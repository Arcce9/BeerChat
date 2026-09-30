-- Fix: a matched person's name vanished once they left the venue / went hidden,
-- because profile visibility rode only on the discoverable pin.
-- Rule: match participants can read each other's profile while the match lasts.
create policy "matched profiles visible" on public.profiles
  for select using (
    exists (
      select 1 from public.matches m
      where (m.user_a = auth.uid() and m.user_b = profiles.id)
         or (m.user_b = auth.uid() and m.user_a = profiles.id)
    )
  );
