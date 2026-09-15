-- Run this in Supabase SQL Editor once per project.

create extension if not exists btree_gist;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  package_id text not null,
  package_name text not null,
  package_price integer not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  address text not null,
  car_make text not null,
  model_year text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint bookings_valid_range check (end_at > start_at),
  constraint bookings_no_overlap
    exclude using gist (tstzrange(start_at, end_at, '[)') with &&)
);

alter table public.bookings enable row level security;

create policy "Public can read bookings"
  on public.bookings
  for select
  to anon, authenticated
  using (true);

create policy "Public can insert bookings"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);
