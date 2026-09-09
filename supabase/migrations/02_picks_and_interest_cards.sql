-- Migration: Add interest_cards and picks tables
-- Description: Create tables for enhanced interests (with descriptions) and picks (favorite things)

-- 1. Create interest_cards table
create table interest_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null, -- preset ID or custom name
  is_custom boolean default false,
  description text not null, -- user's personal description
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, category) -- one card per category per user
);

-- RLS Policies for interest_cards
alter table interest_cards enable row level security;

create policy "Users can view family interest cards"
  on interest_cards for select
  using (
    user_id in (
      select id from users
      where family_id = (select family_id from users where id = auth.uid())
    )
  );

create policy "Users can manage own interest cards"
  on interest_cards for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Indexes for interest_cards
create index idx_interest_cards_user_id on interest_cards(user_id);
create index idx_interest_cards_category on interest_cards(category);

-- 2. Create picks table
create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null, -- 'movie', 'food', 'song', 'book', 'place', 'restaurant'
  value text not null, -- the actual pick
  interest_tag text, -- optional link to interest category
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, category) -- one pick per category per user
);

-- RLS Policies for picks
alter table picks enable row level security;

create policy "Users can view family picks"
  on picks for select
  using (
    user_id in (
      select id from users
      where family_id = (select family_id from users where id = auth.uid())
    )
  );

create policy "Users can manage own picks"
  on picks for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Indexes for picks
create index idx_picks_user_id on picks(user_id);
create index idx_picks_category on picks(category);
create index idx_picks_created_at on picks(created_at desc);
