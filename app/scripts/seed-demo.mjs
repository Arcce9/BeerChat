#!/usr/bin/env node
// Demo data for the TA: fills Houndstooth Sports Bar with checked-in, visible demo people so the
// presence list, BC-08 ranking and matching can be seen with a single device.
//
//   node scripts/seed-demo.mjs setup         # demo people check in (idempotent)
//   node scripts/seed-demo.mjs sam-says-yes  # Sam sends "Open to meet?" to demo user 1 (Alex)
//   node scripts/seed-demo.mjs clear         # everyone in the script leaves; requests withdrawn
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]])
);

const VENUE = 'Houndstooth Sports Bar';
const people = [
  { n: 1, name: 'Alex', interests: ['live music', 'startups', 'hiking'], checkIn: false },
  { n: 2, name: 'Sam', interests: ['live music', 'startups', 'board games'], checkIn: true },
  { n: 3, name: 'Priya', interests: ['startups', 'hiking', 'travel'], checkIn: true },
  { n: 4, name: 'Tom', interests: ['football', 'gaming', 'movies'], checkIn: true },
];

const login = async ({ n, name, interests }) => {
  const client = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const creds = { email: `ta.demo${n}@beerchat.dev`, password: `BeerChat-M1-demo${n}` };
  let { data, error } = await client.auth.signInWithPassword(creds);
  if (error) ({ data, error } = await client.auth.signUp(creds));
  if (error) throw new Error(`${creds.email}: ${error.message}`);
  await client.from('profiles').upsert({ id: data.user.id, display_name: name, interests });
  return { client, id: data.user.id, name };
};

const [cmd = 'setup'] = process.argv.slice(2);
const users = await Promise.all(people.map(login));
const byName = Object.fromEntries(users.map((u) => [u.name, u]));
const { data: venue } = await users[0].client.from('venues').select('id').eq('name', VENUE).single();

if (cmd === 'setup') {
  for (const [i, p] of people.entries()) {
    if (!p.checkIn) continue;
    const { error } = await users[i].client
      .from('pins')
      .upsert({ user_id: users[i].id, venue_id: venue.id, status: 'arrived', discoverable: true });
    if (error) throw error;
  }
  console.log(`Sam, Priya and Tom are checked in and visible at ${VENUE}.`);
} else if (cmd === 'sam-says-yes') {
  const { error } = await byName.Sam.client
    .from('meet_requests')
    .insert({ requester_id: byName.Sam.id, target_id: byName.Alex.id, venue_id: venue.id });
  if (error) throw new Error(`Sam's request was refused (is Alex checked in and visible?): ${error.message}`);
  console.log('Sam is open to meet Alex. Tap "Open to meet?" on Sam as Alex to match.');
} else if (cmd === 'clear') {
  for (const u of users) {
    await u.client.from('meet_requests').delete().eq('requester_id', u.id);
    await u.client.from('pins').delete().eq('user_id', u.id);
  }
  console.log('Demo people cleared.');
} else {
  console.error(`unknown command: ${cmd}`);
  process.exit(1);
}
