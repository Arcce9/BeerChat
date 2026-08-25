import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import MapHome from '@/components/MapHome';

const INTERESTS = [
  'live music',
  'football',
  'basketball',
  'startups',
  'hiking',
  'board games',
  'movies',
  'gaming',
  'travel',
  'foodie',
  'books',
  'fitness',
];

type Profile = { display_name: string; interests: string[] };

export default function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(session === null ? null : undefined);
      return;
    }
    supabase
      .from('profiles')
      .select('display_name, interests')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? { display_name: '', interests: [] }));
  }, [session]);

  if (session === undefined || (session && profile === undefined)) {
    return <View style={styles.container} />;
  }

  if (!session) {
    return <SignInScreen />;
  }

  if (!profile?.display_name) {
    return <ProfileSetupScreen userId={session.user.id} onSaved={setProfile} />;
  }

  return <MapHome userId={session.user.id} />;
}

function SignInScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    const { error: err } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.formSafeArea}>
        <Text style={styles.headline}>Good company{'\n'}is already here.</Text>
        <Text style={styles.subline}>
          Pin the bar you're heading to and see who's up for saying hello.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, email && styles.inputFilled]}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, password && styles.inputFilled]}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={submit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? '...' : isSignUp ? 'Create account' : 'Sign in'}
          </Text>
        </Pressable>
        <Pressable onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.link}>
            {isSignUp ? 'Have an account? Sign in' : 'New here? Create account'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function ProfileSetupScreen({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved: (p: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
          ? [...prev, interest]
          : prev
    );
  };

  const save = async () => {
    setError('');
    if (!displayName.trim()) {
      setError('enter a first name');
      return;
    }
    if (interests.length < 1) {
      setError('pick at least 1 interest');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName.trim(), interests });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved({ display_name: displayName.trim(), interests });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.formSafeArea}>
        <Text style={styles.headline}>Who are you tonight?</Text>
        <Text style={styles.subline}>
          Only your first name is ever shown to other people.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={[styles.input, displayName && styles.inputFilled]}
            placeholderTextColor={colors.textTertiary}
            value={displayName}
            onChangeText={setDisplayName}
          />
        </View>

        <View style={styles.interestsHeader}>
          <Text style={styles.sectionTitle}>Pick 3–5 interests</Text>
          <Text style={styles.counter}>{interests.length} of 5 selected</Text>
        </View>
        <View style={styles.chipWrap}>
          {INTERESTS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <Pressable
                key={interest}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggle(interest)}
              >
                <Text style={selected ? styles.chipTextSelected : styles.chipText}>
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.footerNote}>
          You're invisible until you check in and choose to be seen.
        </Text>
        <Pressable style={styles.button} onPress={save} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : 'Done'}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  formSafeArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },
  headline: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 'bold',
    letterSpacing: -1,
    color: colors.text,
  },
  subline: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  input: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputFilled: {
    borderColor: colors.accent,
  },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  interestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.chipText,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
});
