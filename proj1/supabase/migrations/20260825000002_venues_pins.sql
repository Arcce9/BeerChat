-- Step 2: venues, pins, seed data
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null,
  lng double precision not null
);

alter table public.venues enable row level security;

create policy "venues readable by signed-in users" on public.venues
  for select to authenticated using (true);

-- one active pin per user (primary key = user_id); leaving = deleting the row
create table public.pins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  status text not null default 'heading' check (status in ('heading', 'arrived')),
  created_at timestamptz not null default now()
);

alter table public.pins enable row level security;

create policy "read own pin" on public.pins
  for select using (auth.uid() = user_id);
create policy "insert own pin" on public.pins
  for insert with check (auth.uid() = user_id);
create policy "update own pin" on public.pins
  for update using (auth.uid() = user_id);
create policy "delete own pin" on public.pins
  for delete using (auth.uid() = user_id);

-- seed: Tuscaloosa bars near campus/downtown (approximate coordinates, demo data)
insert into public.venues (name, lat, lng) values
  ('Gallettes', 33.2115, -87.5606),
  ('Rounders', 33.2116, -87.5626),
  ('Innisfree Irish Pub', 33.2109, -87.5563),
  ('Houndstooth Sports Bar', 33.2116, -87.5637),
  ('Rhythm & Brews', 33.2119, -87.5692),
  ('Druid City Social', 33.2098, -87.5646);
