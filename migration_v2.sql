-- ─────────────────────────────────────────────────────────
-- Migration: Add inventory fields + complaints table
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────

-- ─── Step 1: Add new columns to inventory table ──────────
alter table inventory
  add column if not exists pin          text        check (pin is null or pin ~ '^\d{4}$'),
  add column if not exists slot_type    text,
  add column if not exists quantity     integer     not null default 1 check (quantity >= 1);

-- ─── Step 2: Create complaints table ─────────────────────
create table if not exists complaints (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now() not null,
  profile_id       uuid        not null references profiles(id) on delete cascade,
  customer_name    text        not null,
  whatsapp_number  text,
  product_name     text        not null,
  complaint_text   text        not null,
  status           text        not null default 'open'
                               check (status in ('open', 'in_progress', 'resolved')),
  seller_notes     text,
  resolved_at      timestamptz
);

-- ─── Step 3: Enable Realtime on complaints ───────────────
alter publication supabase_realtime add table complaints;

-- ─── Step 4: Index for performance ──────────────────────
create index if not exists idx_complaints_profile_id on complaints(profile_id);
create index if not exists idx_complaints_status  on complaints(status);

-- ─── Step 5: Disable RLS & Grant Permissions ────────────
-- For admin-only dashboards, we disable RLS to allow direct access.
alter table complaints disable row level security;
grant all on table complaints to anon, authenticated, service_role;
