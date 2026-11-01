/**
 * Integration tests: real Supabase (Auth + Postgres RLS + triggers + Realtime), three real accounts.
 * Run with `npm run test:integration` (needs network; see README "Automated tests").
 */
import { anonClient, checkIn, pairKey, reset, signIn, type TestUser } from './helpers';

jest.setTimeout(45_000);

let A: TestUser; // Alice — checks in and is visible
let B: TestUser; // Bob — checks in at the same venue
let C: TestUser; // Carol — never checks in anywhere (an "outsider")
let venueId: string;

beforeAll(async () => {
  A = await signIn(1, 'IntAlice', ['live music', 'startups', 'hiking']);
  B = await signIn(2, 'IntBob', ['live music', 'startups', 'board games']);
  C = await signIn(3, 'IntCarol', ['poker', 'film', 'art']);
  await reset(A, B, C);
  const { data } = await A.client.from('venues').select('id').eq('name', 'Druid City Social').single();
  venueId = data!.id;
});

afterAll(async () => {
  await reset(A, B, C);
  for (const u of [A, B, C]) await u?.client.removeAllChannels();
});

describe('Auth', () => {
  it('rejects a wrong password', async () => {
    const { error } = await anonClient().auth.signInWithPassword({
      email: 'int.user1@beerchat.dev',
      password: 'definitely-wrong',
    });
    expect(error).not.toBeNull();
  });

  it('gives signed-out clients no access to user data', async () => {
    const anon = anonClient();
    const { data: profiles } = await anon.from('profiles').select('id');
    const { data: pins } = await anon.from('pins').select('user_id');
    expect(profiles).toEqual([]);
    expect(pins).toEqual([]);
  });
});

describe('Presence (BC-04/05)', () => {
  beforeAll(async () => {
    await checkIn(A, venueId, true);
    await checkIn(B, venueId, true);
  });

  it('shows a visible person to someone checked in at the same venue', async () => {
    const { data } = await B.client
      .from('pins')
      .select('user_id, profiles(display_name)')
      .eq('venue_id', venueId)
      .eq('discoverable', true);
    expect(data?.map((p) => p.user_id)).toContain(A.id);
  });

  it('hides a person the moment they turn visibility off', async () => {
    await A.client.from('pins').update({ discoverable: false }).eq('user_id', A.id);
    const { data } = await B.client.from('pins').select('user_id').eq('venue_id', venueId);
    expect(data?.map((p) => p.user_id)).not.toContain(A.id);
    await A.client.from('pins').update({ discoverable: true }).eq('user_id', A.id);
  });
});

describe('Double opt-in matching (BC-06)', () => {
  afterAll(async () => {
    await A.client.from('meet_requests').delete().eq('requester_id', A.id);
    await B.client.from('meet_requests').delete().eq('requester_id', B.id);
  });

  it('keeps a one-sided request invisible to its target', async () => {
    const { error } = await A.client
      .from('meet_requests')
      .insert({ requester_id: A.id, target_id: B.id, venue_id: venueId });
    expect(error).toBeNull();
    const { data } = await B.client.from('meet_requests').select('*').eq('target_id', B.id);
    expect(data).toEqual([]);
    const { data: matches } = await A.client.from('matches').select('id');
    expect(matches).toEqual([]);
  });

  it('creates exactly one match, visible to both, when the request is returned', async () => {
    const { error } = await B.client
      .from('meet_requests')
      .insert({ requester_id: B.id, target_id: A.id, venue_id: venueId });
    expect(error).toBeNull();
    const [ua, ub] = pairKey(A.id, B.id);
    const { data: forA } = await A.client.from('matches').select('id, user_a, user_b').eq('user_a', ua);
    const { data: forB } = await B.client.from('matches').select('id').eq('user_a', ua);
    expect(forA).toHaveLength(1);
    expect(forA![0].user_b).toBe(ub);
    expect(forB).toHaveLength(1);
  });

  it('does not let an outsider see the match', async () => {
    const { data } = await C.client.from('matches').select('id');
    expect(data).toEqual([]);
  });

  it('refuses to let a client create matches directly', async () => {
    const [user_a, user_b] = pairKey(A.id, C.id);
    const { error } = await A.client.from('matches').insert({ user_a, user_b, venue_id: venueId });
    expect(error).not.toBeNull();
  });
});

describe('Chat (BC-07) and expiry (BC-10)', () => {
  let matchId: string;

  beforeAll(async () => {
    await A.client.from('meet_requests').insert({ requester_id: A.id, target_id: B.id, venue_id: venueId });
    await B.client.from('meet_requests').insert({ requester_id: B.id, target_id: A.id, venue_id: venueId });
    const { data } = await A.client.from('matches').select('id, created_at, expires_at').single();
    matchId = data!.id;
  });

  it('sets the match to expire 6 hours after it was made', async () => {
    const { data } = await A.client.from('matches').select('created_at, expires_at').eq('id', matchId).single();
    const hours = (Date.parse(data!.expires_at) - Date.parse(data!.created_at)) / 3_600_000;
    expect(hours).toBeCloseTo(6, 3);
  });

  it('delivers a message to the other participant in real time', async () => {
    const received = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('no realtime message within 15s')), 15_000);
      B.client
        .channel(`it-${matchId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
          (payload) => {
            clearTimeout(timer);
            resolve((payload.new as { text: string }).text);
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // SUBSCRIBED can fire before the server has registered the change filter;
            // a human never types that fast, so give it a moment like a real user would
            await new Promise((r) => setTimeout(r, 2000));
            await A.client.from('messages').insert({ match_id: matchId, sender_id: A.id, text: 'corner table' });
          }
        });
    });
    await expect(received).resolves.toBe('corner table');
  });

  it('rejects a message sent under someone else\'s name', async () => {
    const { error } = await B.client.from('messages').insert({ match_id: matchId, sender_id: A.id, text: 'spoof' });
    expect(error).not.toBeNull();
  });

  it('keeps the conversation private from outsiders', async () => {
    const { data } = await C.client.from('messages').select('id').eq('match_id', matchId);
    expect(data).toEqual([]);
  });

  it('dissolves the match and deletes the chat when either side withdraws', async () => {
    await B.client.from('meet_requests').delete().eq('requester_id', B.id);
    const { data: matches } = await A.client.from('matches').select('id').eq('id', matchId);
    const { data: messages } = await A.client.from('messages').select('id').eq('match_id', matchId);
    expect(matches).toEqual([]);
    expect(messages).toEqual([]);
  });
});
