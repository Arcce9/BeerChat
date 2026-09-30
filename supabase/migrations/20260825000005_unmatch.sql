-- Step 4 fix: a match requires ongoing mutual consent.
-- Withdrawing either meet_request dissolves the match for both people.
create function public.handle_meet_request_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.matches
  where user_a = least(old.requester_id, old.target_id)
    and user_b = greatest(old.requester_id, old.target_id);
  return old;
end;
$$;

create trigger on_meet_request_deleted
  after delete on public.meet_requests
  for each row execute function public.handle_meet_request_withdrawn();
