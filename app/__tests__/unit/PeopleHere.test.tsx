import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import PeopleHere from '@/components/PeopleHere';

// Minimal chainable stand-in for the Supabase query builder: every filter returns
// the same builder, and awaiting it resolves to the table's canned response.
const responses: Record<string, unknown> = {};
const inserted: unknown[] = [];
const deleted: unknown[] = [];

const builder = (table: string) => {
  const result = () => Promise.resolve(responses[table] ?? { data: [], error: null });
  const b: any = {
    select: () => b,
    eq: () => b,
    neq: () => b,
    maybeSingle: () => result(),
    insert: (row: unknown) => {
      inserted.push(row);
      return Promise.resolve({ error: null });
    },
    delete: () => {
      const d: any = { eq: () => d, then: (resolve: any) => resolve({ error: null }) };
      deleted.push(table);
      return d;
    },
    then: (resolve: any, reject: any) => result().then(resolve, reject),
  };
  return b;
};

jest.mock('@/lib/supabase', () => ({ supabase: { from: (t: string) => builder(t) } }));

const pins = [
  { user_id: 'u-ana', status: 'arrived', profiles: { display_name: 'Ana', interests: ['art'] } },
  {
    user_id: 'u-ben',
    status: 'heading',
    profiles: { display_name: 'Ben', interests: ['live music', 'startups'] },
  },
  { user_id: 'u-cy', status: 'arrived', profiles: { display_name: 'Cy', interests: ['startups'] } },
];

beforeEach(() => {
  inserted.length = 0;
  deleted.length = 0;
  responses.pins = { data: pins, error: null };
  responses.profiles = { data: { interests: ['live music', 'startups', 'hiking'] }, error: null };
  responses.meet_requests = { data: [], error: null };
});

const renderPeople = () =>
  render(
    <PeopleHere venueId="v1" venueName="Rounders" userId="me" refreshKey={0} onClose={jest.fn()} />
  );

describe('PeopleHere', () => {
  it('lists people ranked by shared interests (BC-08)', async () => {
    await renderPeople();
    await waitFor(() => expect(screen.getByText('2 in common · heading over')).toBeTruthy());
    const names = screen.getAllByText(/^(Ana|Ben|Cy)$/).map((n) => n.props.children);
    expect(names).toEqual(['Ben', 'Cy', 'Ana']);
    expect(screen.getByText('3 people open to hello')).toBeTruthy();
  });

  it('sends a private meet request when tapping "Open to meet?"', async () => {
    await renderPeople();
    await waitFor(() => expect(screen.getAllByText('Open to meet?')).toHaveLength(3));
    await fireEvent.press(screen.getAllByText('Open to meet?')[0]);
    await waitFor(() => expect(screen.getByText('Waiting on Ben…')).toBeTruthy());
    expect(inserted).toEqual([{ requester_id: 'me', target_id: 'u-ben', venue_id: 'v1' }]);
  });

  it('withdraws an existing request', async () => {
    responses.meet_requests = { data: [{ target_id: 'u-cy' }], error: null };
    await renderPeople();
    await waitFor(() => expect(screen.getByText('Waiting on Cy…')).toBeTruthy());
    await fireEvent.press(screen.getByText('Waiting on Cy…'));
    await waitFor(() => expect(screen.getAllByText('Open to meet?')).toHaveLength(3));
    expect(deleted).toEqual(['meet_requests']);
  });
});
