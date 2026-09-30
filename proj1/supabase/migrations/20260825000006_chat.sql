-- Step 5: chat inside a match. Unmatch cascades — messages die with the match.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 1000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "participants read messages" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
  );

create policy "participants send as themselves" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
  );

alter publication supabase_realtime add table public.messages;
