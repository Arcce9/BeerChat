import { fireEvent, render, screen } from '@testing-library/react-native';
import MatchScreen from '@/components/MatchScreen';

const base = {
  myName: 'margo',
  myInterests: ['live music', 'startups', 'hiking'],
  theirName: 'Sam',
  theirInterests: ['startups', 'board games', 'live music'],
  venueName: 'Houndstooth Sports Bar',
};

describe('MatchScreen', () => {
  it('shows both names, both initials and the venue', async () => {
    await render(<MatchScreen {...base} onSayHi={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('YOU BOTH SAID YES')).toBeTruthy();
    expect(screen.getByText('margo & Sam')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('Both at Houndstooth Sports Bar right now')).toBeTruthy();
  });

  it('shows only the shared interests', async () => {
    await render(<MatchScreen {...base} onSayHi={jest.fn()} onDismiss={jest.fn()} />);
    expect(screen.getByText('live music')).toBeTruthy();
    expect(screen.getByText('startups')).toBeTruthy();
    expect(screen.queryByText('hiking')).toBeNull();
    expect(screen.queryByText('board games')).toBeNull();
  });

  it('shows the expiry note when an expiry time is known (BC-10)', async () => {
    await render(
      <MatchScreen {...base} expiresAt="2026-11-02T02:00:00.000Z" onSayHi={jest.fn()} onDismiss={jest.fn()} />
    );
    expect(screen.getByText(/This chat disappears at/)).toBeTruthy();
  });

  it('wires "Say hi" and "close" to their callbacks', async () => {
    const onSayHi = jest.fn();
    const onDismiss = jest.fn();
    await render(<MatchScreen {...base} onSayHi={onSayHi} onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByText('Say hi'));
    await fireEvent.press(screen.getByText('close'));
    expect(onSayHi).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
