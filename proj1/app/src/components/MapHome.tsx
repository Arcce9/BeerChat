import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/lib/supabase';

type Venue = { id: string; name: string; lat: number; lng: number };
type Pin = { user_id: string; venue_id: string; status: 'heading' | 'arrived' };

export default function MapHome({ userId }: { userId: string }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pin, setPin] = useState<Pin | null>(null);
  const [selected, setSelected] = useState<Venue | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from('venues')
      .select('id, name, lat, lng')
      .then(({ data }) => setVenues(data ?? []));
    supabase
      .from('pins')
      .select('user_id, venue_id, status')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setPin(data));
  }, [userId]);

  const pinnedVenue = pin ? venues.find((v) => v.id === pin.venue_id) : null;

  const headThere = async (venue: Venue) => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase
      .from('pins')
      .upsert({ user_id: userId, venue_id: venue.id, status: 'heading' });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPin({ user_id: userId, venue_id: venue.id, status: 'heading' });
  };

  const cancel = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.from('pins').delete().eq('user_id', userId);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setPin(null);
  };

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
            pinColor="#F2A93B"
            onPress={() => setSelected(venue)}
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        {pinnedVenue && (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>Heading to {pinnedVenue.name}</Text>
          </View>
        )}
        <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </SafeAreaView>

      {selected && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selected.name}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {pin?.venue_id === selected.id ? (
            <>
              <Text style={styles.headingText}>You're heading here</Text>
              <Pressable style={styles.secondaryButton} onPress={cancel} disabled={loading}>
                <Text style={styles.secondaryButtonText}>{loading ? '...' : 'Cancel'}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.button} onPress={() => headThere(selected)} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? '...' : "I'm heading there"}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.closeText}>close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusBar: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    color: '#F2A93B',
    fontSize: 13,
    fontWeight: '600',
  },
  signOut: {
    position: 'absolute',
    top: 8,
    right: 16,
  },
  signOutText: {
    color: '#AAAAAA',
    fontSize: 13,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headingText: {
    color: '#F2A93B',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#F2A93B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#F2A93B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F2A93B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
  },
});
