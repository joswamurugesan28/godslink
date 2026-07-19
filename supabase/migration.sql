-- Support standard PostgreSQL/Neon setups by creating mock auth tables/functions if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA auth;
        CREATE TABLE auth.users (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            email text,
            raw_user_meta_data jsonb
        );
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT null::uuid;';
    END IF;
END
$$;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text,
  role text not null check (role in ('developer', 'gamer')) default 'gamer',
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create games table
create table if not exists public.games (
  id uuid default gen_random_uuid() primary key,
  developer_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text,
  created_at timestamptz default now() not null
);

-- Enable RLS on games
alter table public.games enable row level security;

-- Create chat_messages table
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on chat_messages
alter table public.chat_messages enable row level security;

-- RLS Policies
-- Profiles:
-- Anyone can view profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Authenticated users can update their own profile
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Games:
-- Anyone can view games
drop policy if exists "Games are viewable by everyone" on public.games;
create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

-- Developers can insert their own games
drop policy if exists "Developers can insert games" on public.games;
create policy "Developers can insert games"
  on public.games for insert
  with check (
    auth.uid() = developer_id 
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'developer'
    )
  );

-- Developers can update their own games
drop policy if exists "Developers can update their own games" on public.games;
create policy "Developers can update their own games"
  on public.games for update
  using (
    auth.uid() = developer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'developer'
    )
  );

-- Developers can delete their own games
drop policy if exists "Developers can delete their own games" on public.games;
create policy "Developers can delete their own games"
  on public.games for delete
  using (
    auth.uid() = developer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'developer'
    )
  );

-- Chat Messages:
-- Anyone can view chat messages
drop policy if exists "Chat messages are viewable by everyone" on public.chat_messages;
create policy "Chat messages are viewable by everyone"
  on public.chat_messages for select
  using (true);

-- Authenticated users can insert chat messages
drop policy if exists "Authenticated users can insert chat messages" on public.chat_messages;
create policy "Authenticated users can insert chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Trigger to auto-create user profile when new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'role', 'gamer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
