-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v6 (PHASE 1)
-- Generated: 2026-03-16
-- Run AFTER supabase_schema_final.sql on an existing DB.
-- On a fresh DB, run supabase_schema_final.sql first, then this file.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CLIENTS — Add proposal tracking columns
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists proposal_token   uuid        unique default uuid_generate_v4(),
  add column if not exists proposal_opened_at timestamptz,          -- set once on first open (server-side timer origin)
  add column if not exists last_viewed_at   timestamptz,            -- updated every time client loads proposal
  add column if not exists view_count       integer     default 0,  -- total opens
  add column if not exists proposal_engagement jsonb     default '{}'::jsonb; -- engagement data

-- Ensure every existing client without a token gets one
update public.clients
  set proposal_token = uuid_generate_v4()
  where proposal_token is null;

-- ---------------------------------------------------------------------------
-- 2. ANALYSTS — Expand role hierarchy, add approval workflow
-- ---------------------------------------------------------------------------

-- Drop the old role constraint so we can add new values
alter table public.analysts
  drop constraint if exists analysts_role_check;

alter table public.analysts
  add constraint analysts_role_check
    check (role in (
      'admin',
      'ambassador',
      'director_sr',
      'director_jr',
      'manager_sr',
      'manager_jr',
      'analyst'
    ));

-- Approval workflow columns
alter table public.analysts
  add column if not exists pending_approval boolean     default true,
  add column if not exists approved_by      uuid        references public.analysts(id),
  add column if not exists approved_at      timestamptz;

-- Promote the admin account — never requires approval
update public.analysts
  set role             = 'admin',
      pending_approval = false
  where email = 'binnovationmarketing@gmail.com';

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTION — is the current user a manager or above?
-- Using SECURITY DEFINER to avoid RLS recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_manager_or_above()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from   public.analysts
    where  id   = auth.uid()
      and  role in ('admin','ambassador','director_sr','director_jr','manager_sr','manager_jr')
      and  (pending_approval is false or pending_approval is null)
  );
$$;

-- ---------------------------------------------------------------------------
-- 4. CLIENTS — Replace hardcoded-email RLS policies with role-based ones
-- ---------------------------------------------------------------------------
drop policy if exists "View clients policy"   on public.clients;
drop policy if exists "Insert clients policy" on public.clients;
drop policy if exists "Update clients policy" on public.clients;
drop policy if exists "Delete clients policy" on public.clients;

-- SELECT: own clients OR manager+
create policy "View clients policy"
  on public.clients for select
  using (
    public.is_manager_or_above()
    or auth.uid() = analyst_id
    or auth.jwt() ->> 'email' = analyst  -- legacy fallback
  );

-- INSERT: own clients only (authenticated analysts)
create policy "Insert clients policy"
  on public.clients for insert
  with check (
    auth.uid() = analyst_id
    or auth.jwt() ->> 'email' = analyst
  );

-- UPDATE: own clients OR manager+
create policy "Update clients policy"
  on public.clients for update
  using (
    public.is_manager_or_above()
    or auth.uid() = analyst_id
    or auth.jwt() ->> 'email' = analyst
  );

-- DELETE: own clients OR manager+
create policy "Delete clients policy"
  on public.clients for delete
  using (
    public.is_manager_or_above()
    or auth.uid() = analyst_id
    or auth.jwt() ->> 'email' = analyst
  );

-- ---------------------------------------------------------------------------
-- 5. ANALYSTS — Replace hardcoded-email RLS policies
-- ---------------------------------------------------------------------------
drop policy if exists "Managers can view all analysts" on public.analysts;

create policy "Managers can view all analysts"
  on public.analysts for select
  using (
    public.is_manager_or_above()
    or auth.uid() = id
  );

-- Allow managers to update analyst roles (approve/promote)
drop policy if exists "Managers can update analysts" on public.analysts;
create policy "Managers can update analysts"
  on public.analysts for update
  using (public.is_manager_or_above());

-- ---------------------------------------------------------------------------
-- 6. TASKS — Replace hardcoded-email RLS policy for manager
-- ---------------------------------------------------------------------------
drop policy if exists "Manager can view all tasks" on public.tasks;

create policy "Manager can view all tasks"
  on public.tasks for select
  using (public.is_manager_or_above());

-- ---------------------------------------------------------------------------
-- 7. RPC: get_proposal_by_token
-- Allows UNAUTHENTICATED clients to load their proposal by secure token.
-- Bypasses RLS safely — token is the secret, not user auth.
-- ---------------------------------------------------------------------------
create or replace function public.get_proposal_by_token(token uuid)
returns setof public.clients
language sql
security definer
stable
as $$
  select * from public.clients
  where  proposal_token = token
  limit  1;
$$;

-- Grant to anon role so unauthenticated clients can call it
grant execute on function public.get_proposal_by_token(uuid) to anon;

-- ---------------------------------------------------------------------------
-- 8. RPC: track_proposal_view
-- Called every time a client opens the proposal. Sets proposal_opened_at
-- on first open (provides server-side countdown anchor), bumps view_count,
-- and updates last_viewed_at.
-- ---------------------------------------------------------------------------
create or replace function public.track_proposal_view(token uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.clients
  set
    proposal_opened_at = coalesce(proposal_opened_at, now()),
    last_viewed_at     = now(),
    view_count         = coalesce(view_count, 0) + 1
  where proposal_token = token;
end;
$$;

grant execute on function public.track_proposal_view(uuid) to anon;

-- ---------------------------------------------------------------------------
-- 9. RPC: update_proposal_engagement
-- Merges engagement JSON into the client record (unauthenticated call).
-- The JSONB merge ensures we don't overwrite fields set by other calls.
-- ---------------------------------------------------------------------------
create or replace function public.update_proposal_engagement(token uuid, engagement_data jsonb)
returns void
language plpgsql
security definer
as $$
begin
  update public.clients
  set    proposal_engagement = proposal_engagement || engagement_data
  where  proposal_token = token;
end;
$$;

grant execute on function public.update_proposal_engagement(uuid, jsonb) to anon;

-- ---------------------------------------------------------------------------
-- 10. handle_new_user — default pending_approval = true for new signups
-- (Admin must approve before they get manager access)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.analysts (id, email, full_name, role, pending_approval)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'analyst',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger already exists — recreating the function is enough.

-- =============================================================================
-- END OF MIGRATION v6
-- =============================================================================
