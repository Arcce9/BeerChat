-- Step 4: double opt-in matching.
-- Privacy invariant: a one-sided "open to meet" is visible ONLY to its sender.
-- The reciprocity check happens in a definer trigger, which can see both sides.

create table public.meet_requests (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, target_id),
  check (requester_id <> target_id)
);

alter table public.meet_requests enable row level security;

create policy "read own requests" on public.meet_requests
  for select using (auth.uid() = requester_id);
create policy "send own requests" on public.meet_requests
  for insert with check (auth.uid() = requester_id);
create policy "withdraw own requests" on public.meet_requests
  for delete using (auth.uid() = requester_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

alter table public.matches enable row level security;

create policy "participants read their matches" on public.matches
  for select using (auth.uid() in (user_a, user_b));

-- the matchmaker: on every new request, create a match iff the reverse exists
create function public.handle_meet_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.meet_requests
    where requester_id = new.target_id and target_id = new.requester_id
  ) then
    insert into public.matches (user_a, user_b, venue_id)
    values (
      least(new.requester_id, new.target_id),
      greatest(new.requester_id, new.target_id),
      new.venue_id
    )
    on conflict (user_a, user_b) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_meet_request_created
  after insert on public.meet_requests
  for each row execute function public.handle_meet_request();

-- both participants can see a match row, so realtime INSERT events reach both
alter publication supabase_realtime add table public.matches;
