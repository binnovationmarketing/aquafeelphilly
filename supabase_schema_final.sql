-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SUPABASE SCHEMA (FINAL / CONSOLIDATED)
-- Generated: 2026-03-01
-- This single file replaces: supabase_schema.sql, v2, v3, v4, v5
-- Run this on a FRESH Supabase project. For migrations on existing DB, see
-- the individual v1-v5 files (kept as historical reference).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- TABLE: analysts
-- Stores profiles for each Aquafeel analyst (synced with Supabase Auth).
-- ---------------------------------------------------------------------------
create table if not exists analysts (
  id              uuid        primary key references auth.users(id) on delete cascade,
  email           text        unique not null,
  full_name       text,
  first_name      text,
  last_name       text,
  phone           text,
  aquafeel_email  text,
  role            text        default 'analyst' check (role in ('analyst', 'manager', 'admin')),
  avatar_url      text,
  sales_goal      numeric     default 0,
  active          boolean     default true,
  -- Hierarchy fields
  manager_name    text,
  director_name   text,
  ambassador_name text,
  office          text,
  division        text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table analysts enable row level security;

-- Policies for analysts
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
    OR auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
  );

-- Trigger: auto-compute full_name from first + last name
create or replace function public.update_analyst_full_name()
returns trigger as $$
begin
  new.full_name := trim(coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, ''));
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_analyst_name_update on analysts;
create trigger on_analyst_name_update
  before insert or update of first_name, last_name on analysts
  for each row execute procedure public.update_analyst_full_name();

-- Trigger: auto-create analyst profile when a new Auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.analysts (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'analyst'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TABLE: clients
-- Stores leads and customers for each analyst.
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id                   uuid        primary key default uuid_generate_v4(),
  name                 text        not null,
  spouse_name          text,
  email                text,
  phone                text,
  address              text,
  city                 text,
  state                text,
  zip_code             text,
  lang                 text        check (lang in ('pt', 'en', 'es')),
  status               text        check (status in (
                                     'LEAD', 'PRESENTATION', 'SCHEDULED', 'SALE',
                                     'QUALIFIED', 'INSTALLED', 'ACTIVE',
                                     'MAINTENANCE', 'LOST', 'CONTACTED'
                                   )),
  observations         jsonb       default '[]'::jsonb,
  referrals            jsonb       default '[]'::jsonb,
  -- Analyst refs (both kept for compatibility)
  analyst              text,       -- Legacy: stores analyst email directly
  analyst_id           uuid        references analysts(id),
  -- Financials
  credit_score         integer,
  water_consumption    numeric,
  cleaning_consumption numeric,
  people_count         integer,
  -- Post-sale
  installation_date    timestamptz,
  next_water_analysis  timestamptz,
  salt_reminder        boolean     default false,
  -- Source tracking
  source               text        default 'VIP_WEBAPP',
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table clients enable row level security;

-- Drop old/conflicting policies before re-creating
drop policy if exists "View clients policy"   on clients;
drop policy if exists "Insert clients policy" on clients;
drop policy if exists "Update clients policy" on clients;
drop policy if exists "Delete clients policy" on clients;
drop policy if exists "Analysts can view their own clients"   on clients;
drop policy if exists "Analysts can insert their own clients" on clients;
drop policy if exists "Analysts can update their own clients" on clients;
drop policy if exists "Analysts can delete their own clients" on clients;
drop policy if exists "Manager can view all clients"   on clients;
drop policy if exists "Manager can update all clients" on clients;
drop policy if exists "Manager can delete all clients" on clients;

-- POLICY: SELECT
create policy "View clients policy"
  on clients for select
  using (
    auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
    OR auth.uid() = analyst_id
    OR auth.jwt() ->> 'email' = analyst  -- legacy fallback
  );

-- POLICY: INSERT
create policy "Insert clients policy"
  on clients for insert
  with check (
    auth.uid() = analyst_id
    OR auth.jwt() ->> 'email' = analyst
  );

-- POLICY: UPDATE
create policy "Update clients policy"
  on clients for update
  using (
    auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
    OR auth.uid() = analyst_id
    OR auth.jwt() ->> 'email' = analyst
  );

-- POLICY: DELETE
create policy "Delete clients policy"
  on clients for delete
  using (
    auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
    OR auth.uid() = analyst_id
    OR auth.jwt() ->> 'email' = analyst
  );

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at on clients
-- ---------------------------------------------------------------------------
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at
  before update on clients
  for each row execute procedure public.update_updated_at();

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  analyst_id UUID REFERENCES public.analysts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  type TEXT DEFAULT 'MESSAGE' CHECK (type IN ('CALL', 'MESSAGE', 'EMAIL', 'VISIT')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  ai_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "Analysts can view their own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = analyst_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Analysts can insert their own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = analyst_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Analysts can update their own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = analyst_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Analysts can delete their own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = analyst_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Manager can view all tasks"
    ON public.tasks FOR SELECT
    USING (
      auth.jwt() ->> 'email' = 'binnovationmarketing@gmail.com'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_tasks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE public.update_tasks_updated_at();

-- Append to supabase_schema_final.sql
