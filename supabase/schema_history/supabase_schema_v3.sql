-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create table for Analysts (Profiles) if it doesn't exist
create table if not exists analysts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  role text default 'analyst' check (role in ('analyst', 'manager', 'admin')),
  avatar_url text,
  sales_goal numeric default 0,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS for analysts
alter table analysts enable row level security;

-- Policies for analysts table
drop policy if exists "Analysts can view their own profile" on analysts;
create policy "Analysts can view their own profile"
  on analysts for select
  using (auth.uid() = id);

drop policy if exists "Analysts can update their own profile" on analysts;
create policy "Analysts can update their own profile"
  on analysts for update
  using (auth.uid() = id);

drop policy if exists "Managers can view all analysts" on analysts;
create policy "Managers can view all analysts"
  on analysts for select
  using (
    exists (
      select 1 from analysts
      where id = auth.uid() and role in ('manager', 'admin')
    )
    OR
    auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  );

-- Trigger to create analyst profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.analysts (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'analyst')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid duplication error on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Modify Clients table to add analyst_id
-- We use a do block to check if the column exists before adding it to avoid errors
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'analyst_id') then
        alter table clients add column analyst_id uuid references analysts(id);
    end if;
end $$;

-- Enable RLS for clients
alter table clients enable row level security;

-- Re-apply policies for clients to include analyst_id check
drop policy if exists "View clients policy" on clients;
drop policy if exists "Insert clients policy" on clients;
drop policy if exists "Update clients policy" on clients;
drop policy if exists "Delete clients policy" on clients;

-- POLICY 1: VIEW (SELECT)
create policy "View clients policy"
on clients for select
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.uid() = analyst_id
  OR
  auth.jwt() ->> 'email' = analyst -- Fallback for legacy
);

-- POLICY 2: INSERT
create policy "Insert clients policy"
on clients for insert
with check (
  auth.uid() = analyst_id
  OR
  auth.jwt() ->> 'email' = analyst
);

-- POLICY 3: UPDATE
create policy "Update clients policy"
on clients for update
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.uid() = analyst_id
  OR
  auth.jwt() ->> 'email' = analyst
);

-- POLICY 4: DELETE
create policy "Delete clients policy"
on clients for delete
using (
  auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  OR
  auth.uid() = analyst_id
  OR
  auth.jwt() ->> 'email' = analyst
);
