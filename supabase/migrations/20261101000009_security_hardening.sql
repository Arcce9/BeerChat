-- Milestone 2 security hardening (threat model: docs/SECURITY.md; evidence: docs/evidence/).

-- Helper: the venue the current user is pinned at (null if none). SECURITY DEFINER so RLS
-- policies on pins can use it without recursively evaluating pins' own policies.
create function public.viewer_venue()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select venue_id from public.pins where user_id = auth.uid()
$$;

-- SEC-1 (OWASP A01 Broken Access Control): "Let people HERE see me" was enforced only by
-- the UI; any signed-in user could list visible people and their profiles at every venue.
drop policy "discoverable pins visible to signed-in users" on public.pins;
create policy "discoverable pins visible to people at the same venue" on public.pins
  for select to authenticated using (discoverable and venue_id = public.viewer_venue());

drop policy "discoverable profiles visible to signed-in users" on public.profiles;
create policy "discoverable profiles visible to people at the same venue" on public.profiles
  for select to authenticated using (
    exists (
      select 1 from public.pins p
      where p.user_id = profiles.id and p.discoverable and p.venue_id = public.viewer_venue()
    )
  );

-- Anonymous per-venue counts for the venue sheet: numbers only, no identities.
create function public.venue_counts(target_venue uuid)
returns table (heading int, arrived int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where status = 'heading')::int,
    count(*) filter (where status = 'arrived')::int
  from public.pins
  where venue_id = target_venue and discoverable
$$;

revoke execute on function public.venue_counts(uuid) from public, anon;
grant execute on function public.venue_counts(uuid) to authenticated;

-- SEC-2 (OWASP A01): meet requests could target any user id from anywhere.
-- Now the requester must be checked in and visible at the venue, and the target must be
-- visible there too (the pins subqueries run under the requester's RLS).
drop policy "send own requests" on public.meet_requests;
create policy "send requests only between visible people at the same venue" on public.meet_requests
  for insert with check (
    requester_id = auth.uid()
    and exists (
      select 1 from public.pins me
      where me.user_id = auth.uid() and me.venue_id = meet_requests.venue_id
        and me.status = 'arrived' and me.discoverable
    )
    and exists (
      select 1 from public.pins them
      where them.user_id = meet_requests.target_id and them.venue_id = meet_requests.venue_id
        and them.discoverable
    )
  );

-- SEC-3 (OWASP A04 Insecure Design / A03-adjacent input validation): limits existed only in
-- the client, so any API caller could store arbitrarily large names and interest lists that
-- are then shown to other users. NOT VALID: enforced for all new writes without rejecting
-- the migration over any legacy row.
alter table public.profiles
  add constraint profiles_display_name_length check (char_length(display_name) <= 30) not valid,
  add constraint profiles_interests_count check (cardinality(interests) <= 5) not valid,
  add constraint profiles_interest_length check (char_length(array_to_string(interests, '')) <= 200) not valid;
