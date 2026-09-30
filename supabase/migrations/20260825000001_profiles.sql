-- Step 1: profiles table, auto-creation on signup, RLS
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  interests text[] not null default '{}',
  discoverable boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- every new auth user gets an empty profile row
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
