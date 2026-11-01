import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Reads app/.env (+ app/.env.test) without a dotenv dependency.
const loadEnv = () => {
  const env: Record<string, string> = {};
  for (const file of ['.env', '.env.test']) {
    try {
      for (const line of readFileSync(join(__dirname, '..', '..', file), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m) env[m[1]] = m[2];
      }
    } catch {
      // optional file
    }
  }
  return { ...env, ...process.env } as Record<string, string>;
};

export const env = loadEnv();
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const anonClient = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export type TestUser = { client: SupabaseClient; id: string; name: string };

// Dedicated integration-test accounts (throwaway, documented in README). Created on first run.
export const signIn = async (n: 1 | 2 | 3, name: string, interests: string[]): Promise<TestUser> => {
  const client = anonClient();
  const email = `int.user${n}@beerchat.dev`;
  const password = env.INTEGRATION_TEST_PASSWORD ?? 'BeerChat-integration-2026';
  const signedIn = await client.auth.signInWithPassword({ email, password });
  const { data, error } = signedIn.error ? await client.auth.signUp({ email, password }) : signedIn;
  if (error) throw error;
  const id = data.user!.id;
  await client.from('profiles').upsert({ id, display_name: name, interests });
  return { client, id, name };
};

// Leaves the shared database clean: no pins, no requests (and so no matches) for test users.
export const reset = async (...users: TestUser[]) => {
  for (const u of users) {
    await u.client.from('meet_requests').delete().eq('requester_id', u.id);
    await u.client.from('pins').delete().eq('user_id', u.id);
  }
};

export const checkIn = (u: TestUser, venueId: string, discoverable = true) =>
  u.client
    .from('pins')
    .upsert({ user_id: u.id, venue_id: venueId, status: 'arrived', discoverable });

export const pairKey = (a: string, b: string) => (a < b ? [a, b] : [b, a]);
