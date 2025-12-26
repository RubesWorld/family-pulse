-- Family Pulse Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Families table
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substring(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Users table (extends auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  family_id uuid references families(id),
  created_at timestamptz default now()
);

-- Activities table
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  activity_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  location_name text,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table families enable row level security;
alter table users enable row level security;
alter table activities enable row level security;

-- RLS Policies

-- Users can view their family members
create policy "Users can view family members"
  on users for select
  using (
    family_id is null
    or family_id in (select family_id from users where id = auth.uid())
  );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on users for insert
  with check (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- Anyone can view families (needed for join by invite code)
create policy "Anyone can view families"
  on families for select
  using (true);

-- Authenticated users can create families
create policy "Authenticated users can create families"
  on families for insert
  with check (auth.uid() is not null);

-- Users can view activities from their family
create policy "Users can view family activities"
  on activities for select
  using (
    user_id in (
      select id from users
      where family_id = (select family_id from users where id = auth.uid())
    )
  );

-- Users can create their own activities
create policy "Users can create activities"
  on activities for insert
  with check (user_id = auth.uid());

-- Users can update their own activities
create policy "Users can update own activities"
  on activities for update
  using (user_id = auth.uid());

-- Users can delete their own activities
create policy "Users can delete own activities"
  on activities for delete
  using (user_id = auth.uid());
