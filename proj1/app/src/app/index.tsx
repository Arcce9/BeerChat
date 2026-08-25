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
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>BeerChat</Text>
        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor="#888"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
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
      setError('enter a display name');
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
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Set up profile</Text>
        <TextInput
          style={styles.input}
          placeholder="display name"
          placeholderTextColor="#888"
          value={displayName}
          onChangeText={setDisplayName}
        />
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
        <Pressable style={styles.button} onPress={save} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : 'Continue'}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F2A93B',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#F2A93B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 8,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#F2A93B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: '#F2A93B',
  },
  chipText: {
    color: '#F2A93B',
    fontSize: 14,
  },
  chipTextSelected: {
    color: '#121212',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
