import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export default function MatchScreen({
  myName,
  myInterests,
  theirName,
  theirInterests,
  venueName,
  onDismiss,
}: {
  myName: string;
  myInterests: string[];
  theirName: string;
  theirInterests: string[];
  venueName: string;
  onDismiss: () => void;
}) {
  const shared = myInterests.filter((i) => theirInterests.includes(i));

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>YOU BOTH SAID YES</Text>

      <View style={styles.squaresRow}>
        <View style={[styles.square, { backgroundColor: colors.accent }]}>
          <Text style={[styles.squareText, { color: colors.onAccent }]}>{myName.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.plus}>+</Text>
        <View style={[styles.square, { backgroundColor: colors.borderStrong }]}>
          <Text style={[styles.squareText, { color: colors.text }]}>{theirName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.headline}>
        {myName} & {theirName}
      </Text>
      <Text style={styles.subline}>Both at {venueName} right now</Text>

      {shared.length > 0 && (
        <View style={styles.tagRow}>
          {shared.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottom}>
        <Pressable style={styles.sayHiButton} onPress={onDismiss}>
          <Text style={styles.sayHiText}>Say hi</Text>
        </Pressable>
        <Text style={styles.note}>Chat opens in the next step.</Text>
        <Pressable onPress={onDismiss}>
          <Text style={styles.closeText}>close</Text>
        </Pressable>
      </View>
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
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  label: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 24,
  },
  squaresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  square: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  plus: {
    color: colors.textSecondary,
    fontSize: 24,
    fontWeight: '300',
  },
  headline: {
    color: colors.text,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subline: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
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
  bottom: {
    width: '100%',
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  sayHiButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sayHiText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
