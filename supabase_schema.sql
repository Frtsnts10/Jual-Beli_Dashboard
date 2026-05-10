-- ─────────────────────────────────────────────────────────
-- Shop Dashboard — Supabase Schema
-- ─────────────────────────────────────────────────────────

-- ─── Accounts Table ───────────────────────────────────────
-- Core table for managing digital accounts (Netflix, Spotify, etc.)
create table if not exists accounts (
  id           uuid        default gen_random_uuid() primary key,
  created_at   timestamptz default now() not null,
  name         text        not null,
  email        text,
  password     text,
  status       text        default 'Ready' check (status in ('Ready', 'Sold', 'Expired')),
  expiry_date  date,
  price        numeric,
  buyer_name   text,
  buyer_wa     text,
  notes        text
);

-- Disable RLS (admin-only dashboard, service role bypasses RLS anyway)
-- If you want RLS, enable it and add policies here.

-- ─── Enable Realtime ──────────────────────────────────────
-- In Supabase dashboard: Database > Replication > enable 'accounts' table
-- Or run:
alter publication supabase_realtime add table accounts;

-- ─── Profiles Table (optional, legacy) ────────────────────
create table if not exists profiles (
  id         uuid references auth.users not null primary key,
  updated_at timestamptz,
  username   text unique,
  full_name  text,
  avatar_url text,
  website    text,
  constraint username_length check (char_length(username) >= 3)
);

-- ─── Products Table (legacy, kept for compatibility) ──────
create table if not exists products (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default timezone('utc'::text, now()) not null,
  updated_at  timestamptz default timezone('utc'::text, now()) not null,
  name        text        not null,
  price       numeric     not null,
  description text,
  image_url   text,
  user_id     uuid        references auth.users not null
);
