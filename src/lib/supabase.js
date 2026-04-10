import { createClient } from '@supabase/supabase-js'

// Replace these values with your Supabase project settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

/*
─────────────────────────────────────────────────────────────────
  SUPABASE SETUP — Run this SQL in your Supabase SQL Editor
  (https://supabase.com → Project → SQL Editor → New Query)
─────────────────────────────────────────────────────────────────

-- 1. PROFILES TABLE (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_color text not null default '#185FA5',
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
create policy "Public profiles readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_color)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#185FA5')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. ROOMS TABLE
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_dm boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.rooms enable row level security;
create policy "Rooms readable by members" on public.rooms for select using (
  exists (select 1 from public.room_members where room_id = id and user_id = auth.uid())
);
create policy "Authenticated can create rooms" on public.rooms for insert with check (auth.uid() is not null);

-- 3. ROOM MEMBERS TABLE
create table public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

alter table public.room_members enable row level security;
create policy "Members readable" on public.room_members for select using (true);
create policy "Authenticated can join" on public.room_members for insert with check (auth.uid() = user_id);
create policy "Members can leave" on public.room_members for delete using (auth.uid() = user_id);

-- 4. MESSAGES TABLE
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  content text not null,
  reply_to_id uuid references public.messages(id),
  edited boolean default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "Messages readable by room members" on public.messages for select using (
  exists (select 1 from public.room_members where room_id = messages.room_id and user_id = auth.uid())
);
create policy "Room members can send messages" on public.messages for insert with check (
  auth.uid() = sender_id and
  exists (select 1 from public.room_members where room_id = messages.room_id and user_id = auth.uid())
);

-- 5. REACTIONS TABLE
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

alter table public.reactions enable row level security;
create policy "Reactions readable" on public.reactions for select using (true);
create policy "Authenticated can react" on public.reactions for insert with check (auth.uid() = user_id);
create policy "Users remove own reactions" on public.reactions for delete using (auth.uid() = user_id);

-- 6. Enable Realtime on messages, reactions, room_members
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.profiles;

-- 7. SEED: Create default public rooms (run after setup)
-- (You'll need to insert these manually or via the app's "Create Room" feature)

─────────────────────────────────────────────────────────────────
*/

// Open DevTools → Console and paste:
// import { supabase } from './src/lib/supabase.js'
// await supabase.auth.getSession()
