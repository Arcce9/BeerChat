import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import ChatScreen from '@/components/ChatScreen';

let mockHistory: unknown[] = [];
let mockRealtimeHandler: ((payload: { new: unknown }) => void) | null = null;
const mockInserted: unknown[] = [];
let mockInsertError: { message: string } | null = null;
const mockRemoved: unknown[] = [];

jest.mock('@/lib/supabase', () => {
  const channel: any = {
    on: (_type: string, _filter: unknown, handler: any) => {
      mockRealtimeHandler = handler;
      return channel;
    },
    subscribe: () => channel,
  };
  return {
    supabase: {
      from: () => {
        const b: any = {
          select: () => b,
          eq: () => b,
          order: () => Promise.resolve({ data: mockHistory, error: null }),
          insert: (row: unknown) => {
            mockInserted.push(row);
            return Promise.resolve({ error: mockInsertError });
          },
        };
        return b;
      },
      channel: () => channel,
      removeChannel: (c: unknown) => mockRemoved.push(c),
    },
  };
});

const props = {
  matchId: 'm1',
  myId: 'me',
  theirName: 'sam',
  venueName: 'Rounders',
  matchCreatedAt: '2026-11-01T20:00:00.000Z',
  expiresAt: '2026-11-02T02:00:00.000Z',
  onClose: jest.fn(),
};

beforeEach(() => {
  mockHistory = [
    { id: '2', sender_id: 'them', text: 'back corner, blue jacket', created_at: '2026-11-01T20:05:00Z' },
    { id: '1', sender_id: 'me', text: 'hey!', created_at: '2026-11-01T20:01:00Z' },
  ];
  mockInserted.length = 0;
  mockRemoved.length = 0;
  mockInsertError = null;
});

describe('ChatScreen', () => {
  it('renders the header with initial, expiry time and history', async () => {
    await render(<ChatScreen {...props} />);
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText(/Rounders · disappears at/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('back corner, blue jacket')).toBeTruthy());
    expect(screen.getByText('hey!')).toBeTruthy();
    expect(screen.getByText(/You matched at/)).toBeTruthy();
  });

  it('sends a trimmed message', async () => {
    await render(<ChatScreen {...props} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Message'), '  on my way  ');
    await fireEvent.press(screen.getByText('↑'));
    expect(mockInserted).toEqual([{ match_id: 'm1', sender_id: 'me', text: 'on my way' }]);
  });

  it('does not send whitespace-only messages', async () => {
    await render(<ChatScreen {...props} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Message'), '    ');
    await fireEvent.press(screen.getByText('↑'));
    expect(mockInserted).toEqual([]);
  });

  it('shows a server-side rejection (e.g. expired match) as an error', async () => {
    mockInsertError = { message: 'new row violates row-level security policy' };
    await render(<ChatScreen {...props} />);
    await fireEvent.changeText(screen.getByPlaceholderText('Message'), 'hello?');
    await fireEvent.press(screen.getByText('↑'));
    await waitFor(() => expect(screen.getByText(/row-level security/)).toBeTruthy());
  });

  it('appends messages pushed over realtime', async () => {
    await render(<ChatScreen {...props} />);
    await waitFor(() => expect(screen.getByText('hey!')).toBeTruthy());
    await act(async () => {
      mockRealtimeHandler?.({ new: { id: '3', sender_id: 'them', text: 'see you', created_at: '' } });
    });
    expect(screen.getByText('see you')).toBeTruthy();
  });

  it('unsubscribes from realtime on unmount', async () => {
    const { unmount } = await render(<ChatScreen {...props} />);
    await act(async () => unmount());
    expect(mockRemoved).toHaveLength(1);
  });

  it('falls back to the withdrawal note when no expiry is known', async () => {
    await render(<ChatScreen {...props} expiresAt={undefined} matchCreatedAt={undefined} />);
    expect(screen.getByText(/disappears when either of you withdraws/)).toBeTruthy();
  });
});
