// Pure app logic: no React, no network. Everything here is unit-tested in __tests__/unit.

export const MAX_NAME_LENGTH = 30;
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 5;
export const MAX_MESSAGE_LENGTH = 1000;
// must match the matches.expires_at default in supabase/migrations/*_chat_expiry.sql
export const CHAT_TTL_HOURS = 6;

export type PinStatus = 'heading' | 'arrived';
export type Pin = { venue_id: string; status: PinStatus; discoverable: boolean };
export type Person = {
  user_id: string;
  status: PinStatus;
  profiles: { display_name: string; interests: string[] } | null;
};

export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

export const sharedInterests = (mine: string[], theirs: string[]) =>
  mine.filter((interest) => theirs.includes(interest));

// BC-08: most shared interests first; ties → people already here before people heading over, then by name
export const rankBySharedInterests = (mine: string[], people: Person[]) =>
  people
    .map((person) => ({
      person,
      shared: sharedInterests(mine, person.profiles?.interests ?? []).length,
    }))
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        Number(b.person.status === 'arrived') - Number(a.person.status === 'arrived') ||
        (a.person.profiles?.display_name ?? '').localeCompare(b.person.profiles?.display_name ?? '')
    );

export const countPresence = (statuses: PinStatus[]) => ({
  heading: statuses.filter((s) => s === 'heading').length,
  arrived: statuses.filter((s) => s === 'arrived').length,
});

// the venue sheet's primary action for the user's own pin relative to the venue being viewed
export type PinAction = 'headThere' | 'imHere' | 'here';
export const pinActionFor = (pin: Pin | null, venueId: string): PinAction => {
  if (!pin || pin.venue_id !== venueId) return 'headThere';
  return pin.status === 'heading' ? 'imHere' : 'here';
};

export const validateProfile = (name: string, interests: string[]): string | null => {
  const trimmed = name.trim();
  if (!trimmed) return 'enter a first name';
  if (trimmed.length > MAX_NAME_LENGTH) return `first name must be ${MAX_NAME_LENGTH} characters or fewer`;
  if (interests.length < MIN_INTERESTS) return `pick at least ${MIN_INTERESTS} interests`;
  if (interests.length > MAX_INTERESTS) return `pick at most ${MAX_INTERESTS} interests`;
  return null;
};

export const toggleInterest = (selected: string[], interest: string) =>
  selected.includes(interest)
    ? selected.filter((i) => i !== interest)
    : selected.length < MAX_INTERESTS
      ? [...selected, interest]
      : selected;

export const validateMessage = (text: string): { ok: true; text: string } | { ok: false; error: string } => {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'message is empty' };
  if (trimmed.length > MAX_MESSAGE_LENGTH)
    return { ok: false, error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` };
  return { ok: true, text: trimmed };
};

// BC-10: chats expire CHAT_TTL_HOURS after the match is made
export const expiryFrom = (createdAt: string) =>
  new Date(new Date(createdAt).getTime() + CHAT_TTL_HOURS * 3_600_000).toISOString();

export const isExpired = (expiresAt: string, now: Date = new Date()) =>
  new Date(expiresAt).getTime() <= now.getTime();

export const msUntil = (iso: string, now: Date = new Date()) =>
  Math.max(0, new Date(iso).getTime() - now.getTime());

export const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
