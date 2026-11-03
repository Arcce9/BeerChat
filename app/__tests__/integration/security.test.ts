/**
 * Security regression tests (Milestone 2 threat model, docs/SECURITY.md).
 * Each test asserts the SECURE behaviour; before migration 20261101000009 they fail,
 * which is the "before" evidence recorded in docs/evidence/.
 */
import { checkIn, reset, signIn, type TestUser } from './helpers';

jest.setTimeout(45_000);

let A: TestUser; // checked in, visible
let B: TestUser; // checked in at the same venue, visible
let C: TestUser; // outsider: not checked in anywhere
let venueId: string;
let otherVenueId: string;

beforeAll(async () => {
  A = await signIn(1, 'IntAlice', ['live music', 'startups', 'hiking']);
  B = await signIn(2, 'IntBob', ['live music', 'startups', 'board games']);
  C = await signIn(3, 'IntCarol', ['poker', 'film', 'art']);
  await reset(A, B, C);
  const { data } = await A.client.from('venues').select('id, name');
  venueId = data!.find((v) => v.name === 'Druid City Social')!.id;
  otherVenueId = data!.find((v) => v.name === 'Rounders')!.id;
  await checkIn(A, venueId, true);
  await checkIn(B, venueId, true);
});

afterAll(async () => {
  await reset(A, B, C);
});

describe('SEC-1 (OWASP A01) presence enumeration', () => {
  it('an outsider cannot list who is checked in at a venue', async () => {
    const { data } = await C.client.from('pins').select('user_id').eq('venue_id', venueId);
    expect(data).toEqual([]);
  });

  it('an outsider cannot read the profiles of people at a venue', async () => {
    const { data } = await C.client.from('profiles').select('display_name').eq('id', A.id);
    expect(data).toEqual([]);
  });

  it('someone checked in at a different venue cannot list this one', async () => {
    await checkIn(C, otherVenueId, true);
    const { data } = await C.client.from('pins').select('user_id').eq('venue_id', venueId);
    expect(data).toEqual([]);
    await C.client.from('pins').delete().eq('user_id', C.id);
  });

  it('someone pinned at the venue but hidden cannot list it', async () => {
    await checkIn(C, venueId, false);
    const { data: pins } = await C.client.from('pins').select('user_id').eq('venue_id', venueId).neq('user_id', C.id);
    const { data: profiles } = await C.client.from('profiles').select('display_name').eq('id', A.id);
    await C.client.from('pins').delete().eq('user_id', C.id);
    expect(pins).toEqual([]);
    expect(profiles).toEqual([]);
  });

  it('someone only heading to the venue cannot list it', async () => {
    await C.client.from('pins').upsert({ user_id: C.id, venue_id: venueId, status: 'heading', discoverable: true });
    const { data } = await C.client.from('pins').select('user_id').eq('venue_id', venueId).neq('user_id', C.id);
    await C.client.from('pins').delete().eq('user_id', C.id);
    expect(data).toEqual([]);
  });

  it('anyone signed in can still see anonymous counts for a venue', async () => {
    const { data, error } = await C.client.rpc('venue_counts', { target_venue: venueId });
    expect(error).toBeNull();
    expect(data).toEqual([{ heading: 0, arrived: 2 }]);
  });
});

describe('SEC-2 (OWASP A01) unauthorized meet requests', () => {
  afterEach(async () => {
    await C.client.from('meet_requests').delete().eq('requester_id', C.id);
    await A.client.from('meet_requests').delete().eq('requester_id', A.id);
  });

  it('an outsider cannot send a meet request to someone at a venue', async () => {
    const { error } = await C.client
      .from('meet_requests')
      .insert({ requester_id: C.id, target_id: A.id, venue_id: venueId });
    expect(error).not.toBeNull();
  });

  it('a request cannot target someone who is hidden', async () => {
    await B.client.from('pins').update({ discoverable: false }).eq('user_id', B.id);
    const { error } = await A.client
      .from('meet_requests')
      .insert({ requester_id: A.id, target_id: B.id, venue_id: venueId });
    await B.client.from('pins').update({ discoverable: true }).eq('user_id', B.id);
    expect(error).not.toBeNull();
  });

  it('a legitimate request between two visible people at the venue still works', async () => {
    const { error } = await A.client
      .from('meet_requests')
      .insert({ requester_id: A.id, target_id: B.id, venue_id: venueId });
    expect(error).toBeNull();
  });
});

describe('SEC-3 (OWASP A04/A03) server-side input validation', () => {
  it('rejects an oversized display name', async () => {
    const { error } = await A.client.from('profiles').update({ display_name: 'x'.repeat(5000) }).eq('id', A.id);
    expect(error).not.toBeNull();
  });

  it('rejects more than 5 interests', async () => {
    const { error } = await A.client
      .from('profiles')
      .update({ interests: ['a', 'b', 'c', 'd', 'e', 'f'] })
      .eq('id', A.id);
    expect(error).not.toBeNull();
  });

  it('accepts a normal profile update', async () => {
    const { error } = await A.client.from('profiles').update({ display_name: 'IntAlice' }).eq('id', A.id);
    expect(error).toBeNull();
  });
});
