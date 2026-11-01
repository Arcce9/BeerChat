import {
  CHAT_TTL_HOURS,
  MAX_INTERESTS,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  expiryFrom,
  formatClock,
  initialOf,
  isExpired,
  msUntil,
  pinActionFor,
  rankBySharedInterests,
  sharedInterests,
  toggleInterest,
  validateMessage,
  validateProfile,
  type Person,
} from '@/lib/logic';

const person = (name: string, interests: string[], status: Person['status'] = 'arrived'): Person => ({
  user_id: name.toLowerCase(),
  status,
  profiles: { display_name: name, interests },
});

describe('initialOf', () => {
  it('uppercases the first letter of the trimmed name', () => {
    expect(initialOf('  margo')).toBe('M');
  });
  it('falls back to ? for empty names', () => {
    expect(initialOf('   ')).toBe('?');
  });
});

describe('sharedInterests', () => {
  it('returns the intersection in my order', () => {
    expect(sharedInterests(['hiking', 'startups', 'film'], ['film', 'hiking'])).toEqual(['hiking', 'film']);
  });
  it('is empty when nothing overlaps', () => {
    expect(sharedInterests(['poker'], ['art'])).toEqual([]);
  });
});

describe('rankBySharedInterests (BC-08)', () => {
  const me = ['live music', 'startups', 'hiking'];

  it('puts people with the most shared interests first', () => {
    const ranked = rankBySharedInterests(me, [
      person('Ana', ['art']),
      person('Ben', ['live music', 'startups', 'hiking']),
      person('Cy', ['startups']),
    ]);
    expect(ranked.map((r) => r.person.profiles?.display_name)).toEqual(['Ben', 'Cy', 'Ana']);
    expect(ranked.map((r) => r.shared)).toEqual([3, 1, 0]);
  });

  it('breaks ties by arrived-before-heading, then by name', () => {
    const ranked = rankBySharedInterests(me, [
      person('Zed', ['hiking'], 'heading'),
      person('Yan', ['hiking'], 'arrived'),
      person('Abe', ['hiking'], 'arrived'),
    ]);
    expect(ranked.map((r) => r.person.profiles?.display_name)).toEqual(['Abe', 'Yan', 'Zed']);
  });

  it('tolerates a missing profile (treated as no shared interests)', () => {
    const ghost: Person = { user_id: 'x', status: 'arrived', profiles: null };
    const ranked = rankBySharedInterests(me, [ghost, person('Ben', ['hiking'])]);
    expect(ranked[0].person.user_id).toBe('ben');
    expect(ranked[1].shared).toBe(0);
  });

  it('does not mutate the input array', () => {
    const people = [person('B', []), person('A', ['hiking'])];
    rankBySharedInterests(me, people);
    expect(people[0].profiles?.display_name).toBe('B');
  });
});

describe('pinActionFor (pin state machine)', () => {
  it('offers "head there" with no pin', () => {
    expect(pinActionFor(null, 'v1')).toBe('headThere');
  });
  it('offers "head there" when pinned at a different venue', () => {
    expect(pinActionFor({ venue_id: 'v2', status: 'arrived', discoverable: true }, 'v1')).toBe('headThere');
  });
  it('offers "I\'m here" when heading to this venue', () => {
    expect(pinActionFor({ venue_id: 'v1', status: 'heading', discoverable: false }, 'v1')).toBe('imHere');
  });
  it('shows "here" once arrived at this venue', () => {
    expect(pinActionFor({ venue_id: 'v1', status: 'arrived', discoverable: false }, 'v1')).toBe('here');
  });
});

describe('validateProfile', () => {
  const three = ['a', 'b', 'c'];
  it('accepts a valid profile', () => {
    expect(validateProfile('Margo', three)).toBeNull();
  });
  it('rejects a blank name', () => {
    expect(validateProfile('   ', three)).toMatch(/first name/);
  });
  it('rejects an overlong name', () => {
    expect(validateProfile('x'.repeat(MAX_NAME_LENGTH + 1), three)).toMatch(/characters or fewer/);
  });
  it('accepts a name of exactly the max length', () => {
    expect(validateProfile('x'.repeat(MAX_NAME_LENGTH), three)).toBeNull();
  });
  it('rejects fewer than 3 interests', () => {
    expect(validateProfile('Margo', ['a', 'b'])).toMatch(/at least 3/);
  });
  it('rejects more than 5 interests', () => {
    expect(validateProfile('Margo', ['a', 'b', 'c', 'd', 'e', 'f'])).toMatch(/at most 5/);
  });
});

describe('toggleInterest', () => {
  it('adds an unselected interest', () => {
    expect(toggleInterest(['a'], 'b')).toEqual(['a', 'b']);
  });
  it('removes a selected interest', () => {
    expect(toggleInterest(['a', 'b'], 'a')).toEqual(['b']);
  });
  it('refuses to exceed the maximum', () => {
    const full = Array.from({ length: MAX_INTERESTS }, (_, i) => `i${i}`);
    expect(toggleInterest(full, 'extra')).toBe(full);
  });
});

describe('validateMessage', () => {
  it('trims and accepts normal text', () => {
    expect(validateMessage('  hi there  ')).toEqual({ ok: true, text: 'hi there' });
  });
  it('rejects whitespace-only messages', () => {
    expect(validateMessage('   ')).toEqual({ ok: false, error: 'message is empty' });
  });
  it('rejects messages over the limit', () => {
    const result = validateMessage('x'.repeat(MAX_MESSAGE_LENGTH + 1));
    expect(result.ok).toBe(false);
  });
  it('accepts a message of exactly the limit', () => {
    expect(validateMessage('x'.repeat(MAX_MESSAGE_LENGTH)).ok).toBe(true);
  });
});

describe('chat expiry (BC-10)', () => {
  const created = '2026-11-01T20:00:00.000Z';

  it(`expires ${CHAT_TTL_HOURS} hours after the match`, () => {
    expect(expiryFrom(created)).toBe('2026-11-02T02:00:00.000Z');
  });
  it('is not expired before the deadline', () => {
    expect(isExpired('2026-11-02T02:00:00.000Z', new Date('2026-11-02T01:59:59Z'))).toBe(false);
  });
  it('is expired at the deadline', () => {
    expect(isExpired('2026-11-02T02:00:00.000Z', new Date('2026-11-02T02:00:00Z'))).toBe(true);
  });
  it('counts down milliseconds until expiry', () => {
    expect(msUntil('2026-11-02T02:00:00.000Z', new Date('2026-11-02T01:59:00Z'))).toBe(60_000);
  });
  it('never returns a negative countdown', () => {
    expect(msUntil('2026-11-02T02:00:00.000Z', new Date('2026-11-03T00:00:00Z'))).toBe(0);
  });
  it('formats a wall-clock time with a minute component', () => {
    expect(formatClock(created)).toMatch(/\d{1,2}:\d{2}/);
  });
  it('uses the current time when none is given', () => {
    expect(isExpired('2000-01-01T00:00:00Z')).toBe(true);
    expect(msUntil('2000-01-01T00:00:00Z')).toBe(0);
  });
});
