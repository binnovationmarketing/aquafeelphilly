-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create a table for clients
create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  spouse_name text,
  email text,
  phone text,
  address text,
  zip_code text,
  people_count integer,
  water_consumption numeric,
  cleaning_consumption numeric,
  lang text check (lang in ('pt', 'en', 'es')),
  status text check (status in ('LEAD', 'PRESENTATION', 'SALE', 'LOST', 'CONTACTED', 'SCHEDULED', 'INSTALLED', 'MAINTENANCE', 'ACTIVE')),
  observations jsonb default '[]'::jsonb,
  referrals jsonb default '[]'::jsonb,
  analyst text, -- Stores the email of the analyst
  installation_date timestamp with time zone,
  next_water_analysis timestamp with time zone,
  salt_reminder boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table clients enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Analysts can view their own clients" on clients;
drop policy if exists "Analysts can insert their own clients" on clients;
drop policy if exists "Analysts can update their own clients" on clients;
drop policy if exists "Analysts can delete their own clients" on clients;
drop policy if exists "Manager can view all clients" on clients;
drop policy if exists "Manager can update all clients" on clients;
drop policy if exists "Manager can delete all clients" on clients;

-- POLICY 1: VIEW (SELECT)
-- Manager (binnovationmarketing@gmail.com) sees ALL clients.
-- Analysts see ONLY clients where they are the analyst.
create policy "View clients policy"
on clients for select
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.jwt() ->> 'email' = analyst
);

-- POLICY 2: INSERT
-- Any authenticated user can insert a client, provided they set themselves as the analyst.
create policy "Insert clients policy"
on clients for insert
with check (
  auth.jwt() ->> 'email' = analyst
);

-- POLICY 3: UPDATE
-- Manager can update ANY client.
-- Analysts can update ONLY their own clients.
create policy "Update clients policy"
on clients for update
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.jwt() ->> 'email' = analyst
);

-- POLICY 4: DELETE
-- Manager can delete ANY client.
-- Analysts can delete ONLY their own clients.
create policy "Delete clients policy"
on clients for delete
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.jwt() ->> 'email' = analyst
);
