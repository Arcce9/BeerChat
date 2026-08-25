import { useEffect, useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import PeopleHere from '@/components/PeopleHere';

type Venue = { id: string; name: string; lat: number; lng: number };
type Pin = {
  user_id: string;
  venue_id: string;
  status: 'heading' | 'arrived';
  discoverable: boolean;
};
type Counts = { heading: number; arrived: number };

export default function MapHome({ userId }: { userId: string }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pin, setPin] = useState<Pin | null>(null);
  const [selected, setSelected] = useState<Venue | null>(null);
  const [peopleVenue, setPeopleVenue] = useState<Venue | null>(null);
  const [counts, setCounts] = useState<Counts>({ heading: 0, arrived: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinsVersion, setPinsVersion] = useState(0);

  useEffect(() => {
    supabase
      .from('venues')
      .select('id, name, lat, lng')
      .then(({ data }) => setVenues(data ?? []));
  }, []);

  // own pin — refetched on mount and whenever any pin changes (own or others')
  useEffect(() => {
    supabase
      .from('pins')
      .select('user_id, venue_id, status, discoverable')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setPin(data));
  }, [userId, pinsVersion]);

  // discoverable counts for whichever venue's sheet is open
  useEffect(() => {
    if (!selected) return;
    supabase
      .from('pins')
      .select('status')
      .eq('venue_id', selected.id)
      .eq('discoverable', true)
      .then(({ data }) => {
        const heading = data?.filter((p) => p.status === 'heading').length ?? 0;
        const arrived = data?.filter((p) => p.status === 'arrived').length ?? 0;
        setCounts({ heading, arrived });
      });
  }, [selected, pinsVersion]);

  // live updates: anyone's check-in/leave/visibility change bumps pinsVersion
  useEffect(() => {
    const channel = supabase
      .channel('pins-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pins' },
        () => setPinsVersion((v) => v + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pinnedVenue = pin ? venues.find((v) => v.id === pin.venue_id) : null;

  const headThere = async (venue: Venue) => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase
      .from('pins')
      .upsert({ user_id: userId, venue_id: venue.id, status: 'heading', discoverable: false });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPin({ user_id: userId, venue_id: venue.id, status: 'heading', discoverable: false });
  };

  const imHere = async () => {
    if (!pin) return;
    setError('');
    setLoading(true);
    const { error: err } = await supabase
      .from('pins')
      .update({ status: 'arrived' })
      .eq('user_id', userId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPin({ ...pin, status: 'arrived' });
  };

  const leave = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.from('pins').delete().eq('user_id', userId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPin(null);
    setPeopleVenue(null);
  };

  const toggleDiscoverable = async (value: boolean) => {
    if (!pin) return;
    setError('');
    const { error: err } = await supabase
      .from('pins')
      .update({ discoverable: value })
      .eq('user_id', userId);
    if (err) {
      setError(err.message);
      return;
    }
    setPin({ ...pin, discoverable: value });
  };

  const ownPinHere = !!pin && !!selected && pin.venue_id === selected.id;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        userInterfaceStyle="dark"
        initialRegion={{
          latitude: 33.2113,
          longitude: -87.562,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            coordinate={{ latitude: venue.lat, longitude: venue.lng }}
            title={venue.name}
            pinColor={colors.accent}
            onPress={() => setSelected(venue)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </SafeAreaView>

      {pin && !selected && !peopleVenue && pinnedVenue && (
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: pin.status === 'arrived' ? colors.text : colors.accent },
              ]}
            />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              {pin.status === 'arrived' ? `You're at ${pinnedVenue.name}` : `Heading to ${pinnedVenue.name}`}
            </Text>
            <Text style={styles.statusSubline}>
              {pin.discoverable ? 'Visible to people here' : 'Hidden until you check in'}
            </Text>
          </View>
          <Pressable onPress={() => setSelected(pinnedVenue)}>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>
      )}

      {selected && !peopleVenue && (
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.venueName}>{selected.name}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumberAmber}>{counts.heading}</Text>
              <Text style={styles.statLabel}>heading there</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumberWhite}>{counts.arrived}</Text>
              <Text style={styles.statLabel}>here now</Text>
            </View>
          </View>

          {ownPinHere && pin ? (
            <>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextWrap}>
                  <Text style={styles.toggleTitle}>Let people here see me</Text>
                  <Text style={styles.toggleSubline}>
                    First name and interests only. Off anytime.
                  </Text>
                </View>
                <Switch
                  value={pin.discoverable}
                  onValueChange={toggleDiscoverable}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.text}
                />
              </View>

              {pin.status === 'heading' ? (
                <>
                  <Pressable style={styles.button} onPress={imHere} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? '...' : "I'm here"}</Text>
                  </Pressable>
                  <Text style={styles.hint}>
                    Tap this once you've arrived so people here can see you.
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.hereRow}>
                    <Text style={styles.hereText}>You're here</Text>
                    <Pressable style={styles.secondaryButton} onPress={leave} disabled={loading}>
                      <Text style={styles.secondaryButtonText}>{loading ? '...' : 'Leave'}</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.hint}>Leaving removes your pin for everyone.</Text>
                </>
              )}

              {pin.status === 'arrived' && pin.discoverable && (
                <Pressable
                  style={styles.peoplePill}
                  onPress={() => setPeopleVenue(selected)}
                >
                  <Text style={styles.peoplePillText}>See who's open to hello</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Pressable
                style={styles.button}
                onPress={() => headThere(selected)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? '...' : "I'm heading there"}</Text>
              </Pressable>
              <Text style={styles.hint}>You can only head to one place at a time.</Text>
            </>
          )}

          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.closeText}>close</Text>
          </Pressable>
        </View>
      )}

      {peopleVenue && (
        <PeopleHere
          venueId={peopleVenue.id}
          venueName={peopleVenue.name}
          userId={userId}
          refreshKey={pinsVersion}
          onClose={() => setPeopleVenue(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  signOut: {
    position: 'absolute',
    top: 8,
    right: 16,
  },
  signOutText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statusCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTextWrap: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusSubline: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  changeLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.handle,
    alignSelf: 'center',
    marginBottom: 4,
  },
  venueName: {
    color: colors.text,
    fontSize: 27,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumberAmber: {
    color: colors.accent,
    fontSize: 32,
    fontWeight: 'bold',
  },
  statNumberWhite: {
    color: colors.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubline: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  hereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hereText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  peoplePill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peoplePillText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
