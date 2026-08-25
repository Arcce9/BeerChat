import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

type Person = {
  user_id: string;
  status: 'heading' | 'arrived';
  profiles: { display_name: string; interests: string[] } | null;
};

export default function PeopleHere({
  venueId,
  venueName,
  userId,
  refreshKey,
  onClose,
}: {
  venueId: string;
  venueName: string;
  userId: string;
  refreshKey: number;
  onClose: () => void;
}) {
  const [people, setPeople] = useState<Person[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    supabase
      .from('pins')
      .select('user_id, status, profiles(display_name, interests)')
      .eq('venue_id', venueId)
      .eq('discoverable', true)
      .neq('user_id', userId)
      .then(({ data }) => setPeople((data as unknown as Person[]) ?? []));
  }, [venueId, userId, refreshKey]);

  useEffect(() => {
    supabase
      .from('meet_requests')
      .select('target_id')
      .eq('requester_id', userId)
      .then(({ data }) => setRequested(new Set((data ?? []).map((r) => r.target_id))));
  }, [userId, refreshKey]);

  const toggleRequest = async (targetId: string) => {
    setActionError('');
    const alreadyRequested = requested.has(targetId);
    const { error: err } = alreadyRequested
      ? await supabase
          .from('meet_requests')
          .delete()
          .eq('requester_id', userId)
          .eq('target_id', targetId)
      : await supabase
          .from('meet_requests')
          .insert({ requester_id: userId, target_id: targetId, venue_id: venueId });
    if (err) {
      setActionError(err.message);
      return;
    }
    setRequested((prev) => {
      const next = new Set(prev);
      if (alreadyRequested) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={onClose}>
          <Text style={styles.back}>back</Text>
        </Pressable>
        <Text style={styles.venueName}>{venueName}</Text>
        <Text style={styles.checkedIn}>You're checked in · visible</Text>
        <Text style={styles.headline}>{people.length} people open to hello</Text>
        <Text style={styles.subline}>
          Nobody sees you tapped anything unless they tap too.
        </Text>
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {people.map((person) => {
            const name = person.profiles?.display_name ?? 'Someone';
            const isRequested = requested.has(person.user_id);
            return (
              <View key={person.user_id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.statusLabel}>
                    {person.status === 'arrived' ? 'here' : 'heading over'}
                  </Text>
                </View>
                <View style={styles.tagRow}>
                  {(person.profiles?.interests ?? []).map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[styles.requestButton, isRequested ? styles.waitingVariant : styles.meetVariant]}
                  onPress={() => toggleRequest(person.user_id)}
                >
                  <Text style={isRequested ? styles.waitingButtonText : styles.meetButtonText}>
                    {isRequested ? `Waiting on ${name}…` : 'Open to meet?'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 10,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  back: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  venueName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkedIn: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  headline: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    marginTop: 16,
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
  },
  list: {
    marginTop: 20,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusLabel: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  requestButton: {
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetVariant: {
    backgroundColor: '#24262C',
  },
  waitingVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  meetButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  waitingButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 8,
  },
});
