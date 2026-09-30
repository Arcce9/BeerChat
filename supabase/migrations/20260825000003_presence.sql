-- Step 3: presence — discoverable lives on the check-in (pin), not the profile
alter table public.pins add column discoverable boolean not null default false;
alter table public.profiles drop column discoverable;

-- others may see a pin only when its owner opted into being discoverable
create policy "discoverable pins visible to signed-in users" on public.pins
  for select to authenticated using (discoverable = true);

-- profile (first name + interests) visible while its owner has a discoverable pin
create policy "discoverable profiles visible to signed-in users" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.pins
      where pins.user_id = profiles.id and pins.discoverable
    )
  );

-- live updates for pins (Realtime respects RLS)
alter publication supabase_realtime add table public.pins;
