-- SEC-1 follow-up: viewer_venue() accepted any pin, so a client could move a hidden pin from
-- venue to venue and list who is visible at each one. Viewing now requires being checked in
-- and visible yourself, the same state the app requires before it shows the people list.
-- Check-in is still self-declared, so this removes silent viewing, not all enumeration
-- (docs/SECURITY.md section 7).
create or replace function public.viewer_venue()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select venue_id from public.pins
  where user_id = auth.uid() and status = 'arrived' and discoverable
$$;
