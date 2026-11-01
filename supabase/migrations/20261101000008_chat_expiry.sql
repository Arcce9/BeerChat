-- BC-10: chats expire 6 hours after the match (keep in sync with CHAT_TTL_HOURS in app/src/lib/logic.ts).

alter table public.matches
  add column expires_at timestamptz not null default (now() + interval '6 hours');

-- expired matches (and therefore their chats) are invisible even before the purge job runs
drop policy "participants read their matches" on public.matches;
create policy "participants read their unexpired matches" on public.matches
  for select using (auth.uid() in (user_a, user_b) and expires_at > now());

drop policy "participants read messages" on public.messages;
create policy "participants read messages of unexpired matches" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b) and m.expires_at > now()
    )
  );

drop policy "participants send as themselves" on public.messages;
create policy "participants send as themselves while the match lasts" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b) and m.expires_at > now()
    )
  );

-- purge: deleting the pair's meet_requests fires the unmatch trigger, which deletes the
-- match, which cascades to its messages. Clearing the requests also stops a stale
-- one-sided request from instantly re-matching the pair later.
create function public.purge_expired_matches()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.meet_requests r
  using public.matches m
  where m.expires_at <= now()
    and least(r.requester_id, r.target_id) = m.user_a
    and greatest(r.requester_id, r.target_id) = m.user_b;
  delete from public.matches where expires_at <= now();
$$;

revoke execute on function public.purge_expired_matches() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('purge-expired-matches', '*/15 * * * *', 'select public.purge_expired_matches()');
