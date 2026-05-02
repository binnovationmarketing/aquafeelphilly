-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v10 (CLIENT PORTAL)
-- Generated: 2026-05-02
-- Run this in your Supabase SQL Editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. LINK AUTH USERS TO CLIENTS TABLE
-- Adds an optional column so a client can have a Supabase Auth account.
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookups by auth_user_id
CREATE INDEX IF NOT EXISTS clients_auth_user_id_idx ON public.clients(auth_user_id);

-- ---------------------------------------------------------------------------
-- 2. RPC: CLAIM CLIENT ACCOUNT
-- Called after a client logs in via magic link.
-- Links their auth.uid() to their existing client record.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_client_account(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_auth_uid UUID;
BEGIN
  -- Get the current logged-in user's UID
  v_auth_uid := auth.uid();

  IF v_auth_uid IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Find the client by email (case-insensitive)
  SELECT id, name INTO v_client_id, v_client_name
  FROM public.clients
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('error', 'Client not found with this email. Please contact your consultant.');
  END IF;

  -- Link the auth user to the client record
  UPDATE public.clients
  SET auth_user_id = v_auth_uid
  WHERE id = v_client_id;

  RETURN json_build_object(
    'success', true,
    'client_id', v_client_id,
    'client_name', v_client_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_client_account(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. RPC: GET CLIENT PORTAL DATA (by auth_user_id — secure)
-- Returns all portal data for the logged-in client.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_client_portal_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_points RECORD;
  v_referrals JSON;
  v_redemptions JSON;
BEGIN
  -- Get client by auth_user_id
  SELECT * INTO v_client
  FROM public.clients
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_client IS NULL THEN
    RETURN json_build_object('error', 'Client portal not activated. Please log in again.');
  END IF;

  -- Get points / level
  SELECT * INTO v_points
  FROM public.client_points
  WHERE client_id = v_client.id;

  -- Get referrals
  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'name', r.name,
      'phone', r.phone,
      'status', r.status,
      'created_at', r.created_at
    )
    ORDER BY r.created_at DESC
  ) INTO v_referrals
  FROM public.referrals r
  WHERE r.client_id = v_client.id;

  -- Get prize redemptions
  SELECT json_agg(
    json_build_object(
      'id', pr.id,
      'prize_name', pr.prize_name,
      'points_cost', pr.points_cost,
      'status', pr.status,
      'created_at', pr.created_at
    )
    ORDER BY pr.created_at DESC
  ) INTO v_redemptions
  FROM public.prize_redemptions pr
  WHERE pr.client_id = v_client.id;

  RETURN json_build_object(
    'client', json_build_object(
      'id', v_client.id,
      'name', v_client.name,
      'email', v_client.email,
      'phone', v_client.phone,
      'status', v_client.status
    ),
    'points', json_build_object(
      'points', COALESCE(v_points.points, 0),
      'level', COALESCE(v_points.level, 1),
      'total_referrals', COALESCE(v_points.total_referrals, 0),
      'converted_referrals', COALESCE(v_points.converted_referrals, 0),
      'referral_token', v_points.referral_token
    ),
    'referrals', COALESCE(v_referrals, '[]'::json),
    'redemptions', COALESCE(v_redemptions, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_portal_data() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS POLICY: Clients can read/update their own record via auth_user_id
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Clients can view own data" ON public.clients;
CREATE POLICY "Clients can view own data"
  ON public.clients FOR SELECT
  USING (auth_user_id = auth.uid() OR analyst_id = auth.uid() OR analyst = auth.jwt() ->> 'email' OR public.is_manager_or_above());

DROP POLICY IF EXISTS "Clients can update own limited fields" ON public.clients;
CREATE POLICY "Clients can update own limited fields"
  ON public.clients FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
