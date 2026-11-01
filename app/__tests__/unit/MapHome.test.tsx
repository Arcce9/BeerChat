import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import MapHome from '@/components/MapHome';

// react-native-maps is native-only; render markers as plain pressable text instead.
jest.mock('react-native-maps', () => {
  const { Pressable, Text, View } = require('react-native');
  const MapView = ({ children }: any) => <View>{children}</View>;
  const Marker = ({ title, onPress }: any) => (
    <Pressable onPress={onPress}>
      <Text>{`marker:${title}`}</Text>
    </Pressable>
  );
  return { __esModule: true, default: MapView, Marker };
});

type Filters = Record<string, unknown>;
// list = awaited query; single = .maybeSingle(); both may depend on the .eq() filters used
let mockDb: Record<string, { list?: (f: Filters) => unknown; single?: (f: Filters) => unknown }> = {};
const mockWrites: { table: string; op: string; row?: unknown }[] = [];

jest.mock('@/lib/supabase', () => {
  const channel: any = { on: () => channel, subscribe: () => channel, send: () => undefined };
  const from = (table: string) => {
    const filters: Filters = {};
    const ok = (data: unknown) => Promise.resolve({ data, error: null });
    const b: any = {
      select: () => b,
      eq: (k: string, v: unknown) => {
        filters[k] = v;
        return b;
      },
      or: () => b,
      order: () => b,
      limit: () => b,
      maybeSingle: () => ok(mockDb[table]?.single?.(filters) ?? null),
      then: (resolve: any, reject: any) => ok(mockDb[table]?.list?.(filters) ?? []).then(resolve, reject),
      upsert: (row: unknown) => {
        mockWrites.push({ table, op: 'upsert', row });
        return ok(null);
      },
      update: (row: unknown) => {
        mockWrites.push({ table, op: 'update', row });
        return { eq: () => ok(null) };
      },
      delete: () => {
        mockWrites.push({ table, op: 'delete' });
        return { eq: () => ok(null) };
      },
    };
    return b;
  };
  return {
    supabase: {
      from,
      channel: () => channel,
      removeChannel: () => undefined,
      auth: { signOut: jest.fn() },
    },
  };
});

const venues = [
  { id: 'v1', name: 'Rounders', lat: 33.21, lng: -87.56 },
  { id: 'v2', name: 'Gallettes', lat: 33.21, lng: -87.56 },
];

beforeEach(() => {
  mockWrites.length = 0;
  mockDb = {
    venues: { list: () => venues },
    pins: {
      single: () => null,
      list: (f) => (f.venue_id === 'v1' ? [{ status: 'heading' }, { status: 'arrived' }, { status: 'arrived' }] : []),
    },
    matches: { single: () => null },
    profiles: { single: () => null },
  };
});

describe('MapHome', () => {
  it('renders a marker per venue', async () => {
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText('marker:Rounders')).toBeTruthy());
    expect(screen.getByText('marker:Gallettes')).toBeTruthy();
  });

  it('BC-11: the List fallback opens the same venue sheet', async () => {
    await render(<MapHome userId="me" />);
    await fireEvent.press(screen.getByText('List'));
    await waitFor(() => expect(screen.getByText('Venues')).toBeTruthy());
    await fireEvent.press(screen.getByText('Rounders'));
    await waitFor(() => expect(screen.getByText("I'm heading there")).toBeTruthy());
  });

  it('shows live presence counts for the selected venue', async () => {
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText('marker:Rounders')).toBeTruthy());
    await fireEvent.press(screen.getByText('marker:Rounders'));
    await waitFor(() => expect(screen.getByText('2')).toBeTruthy());
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('heading there')).toBeTruthy();
    expect(screen.getByText('here now')).toBeTruthy();
  });

  it('"I\'m heading there" upserts a hidden pin and shows the status card', async () => {
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText('marker:Rounders')).toBeTruthy());
    await fireEvent.press(screen.getByText('marker:Rounders'));
    await fireEvent.press(screen.getByText("I'm heading there"));
    expect(mockWrites).toContainEqual({
      table: 'pins',
      op: 'upsert',
      row: { user_id: 'me', venue_id: 'v1', status: 'heading', discoverable: false },
    });
    await fireEvent.press(screen.getByText('close'));
    await waitFor(() => expect(screen.getByText('Heading to Rounders')).toBeTruthy());
    expect(screen.getByText('Hidden until you check in')).toBeTruthy();
  });

  it('offers "I\'m here" when heading to this venue, then the people list once arrived and visible', async () => {
    mockDb.pins.single = () => ({ user_id: 'me', venue_id: 'v1', status: 'heading', discoverable: false });
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText('Heading to Rounders')).toBeTruthy());
    await fireEvent.press(screen.getByText('Change'));
    await fireEvent.press(screen.getByText("I'm here"));
    expect(mockWrites).toContainEqual({ table: 'pins', op: 'update', row: { status: 'arrived' } });
    await waitFor(() => expect(screen.getByText("You're here")).toBeTruthy());
    await fireEvent(screen.getByRole('switch'), 'valueChange', true);
    expect(mockWrites).toContainEqual({ table: 'pins', op: 'update', row: { discoverable: true } });
    await waitFor(() => expect(screen.getByText("See who's open to hello")).toBeTruthy());
  });

  it('Leave deletes the pin', async () => {
    mockDb.pins.single = () => ({ user_id: 'me', venue_id: 'v1', status: 'arrived', discoverable: true });
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText("You're at Rounders")).toBeTruthy());
    await fireEvent.press(screen.getByText('Change'));
    await fireEvent.press(screen.getByText('Leave'));
    expect(mockWrites).toContainEqual({ table: 'pins', op: 'delete' });
  });

  it('restores an existing, unexpired match as a chat pill', async () => {
    mockDb.matches.single = () => ({
      id: 'm1',
      user_a: 'me',
      user_b: 'sam',
      venue_id: 'v1',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    });
    mockDb.profiles.single = (f) =>
      f.id === 'sam' ? { display_name: 'Sam', interests: [] } : { display_name: 'Me', interests: [] };
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.getByText('Chat with Sam')).toBeTruthy());
    await fireEvent.press(screen.getByText('Chat with Sam'));
    await waitFor(() => expect(screen.getByPlaceholderText('Message')).toBeTruthy());
  });

  it('BC-10: an expired match is cleared instead of shown', async () => {
    mockDb.matches.single = () => ({
      id: 'm1',
      user_a: 'me',
      user_b: 'sam',
      venue_id: 'v1',
      created_at: '2020-01-01T00:00:00Z',
      expires_at: '2020-01-01T06:00:00Z',
    });
    mockDb.profiles.single = () => ({ display_name: 'Sam', interests: [] });
    await render(<MapHome userId="me" />);
    await waitFor(() => expect(screen.queryByText('Chat with Sam')).toBeNull());
  });
});
