-- ===========================================================================
-- Aquafeel VIP — Schema v14: Restore full portal data in get_client_portal_data
-- Fixes: missing referrals[], redemptions[], converted_referrals from v13 rewrite
-- Run entire block in Supabase SQL Editor.
-- ===========================================================================

-- DROP first to allow return type change (jsonb vs json)
DROP FUNCTION IF EXISTS public.get_client_portal_data();

CREATE OR REPLACE FUNCTION public.get_client_portal_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid         uuid := auth.uid();
  v_client      public.clients%ROWTYPE;
  v_points      public.client_points%ROWTYPE;
  v_referrals   jsonb;
  v_redemptions jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- ── 1. Get client by auth_user_id ──────────────────────────────────────
  SELECT * INTO v_client FROM public.clients WHERE auth_user_id = v_uid LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Client not found. Please contact support.');
  END IF;

  -- ── 2. Get / create client_points row ──────────────────────────────────
  SELECT * INTO v_points FROM public.client_points WHERE client_id = v_client.id;

  IF NOT FOUND THEN
    INSERT INTO public.client_points (client_id, points, level, total_referrals)
    VALUES (v_client.id, 0, 1, 0)
    RETURNING * INTO v_points;
  END IF;

  -- ── 3. Auto-generate referral_token if missing ──────────────────────────
  IF v_points.referral_token IS NULL THEN
    UPDATE public.client_points
    SET referral_token = gen_random_uuid()
    WHERE id = v_points.id
    RETURNING * INTO v_points;
  END IF;

  -- ── 4. Auto-generate referral_slug if missing ───────────────────────────
  IF v_points.referral_slug IS NULL THEN
    UPDATE public.client_points
    SET referral_slug = public.generate_referral_slug(v_client.id)
    WHERE id = v_points.id
    RETURNING * INTO v_points;
  END IF;

  -- ── 5. Referrals list ───────────────────────────────────────────────────
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',           r.id,
      'name',         r.name,
      'phone',        r.phone,
      'email',        r.email,
      'address',      r.address,
      'status',       r.status,
      'referral_type', r.referral_type,
      'created_at',   r.created_at
    ) ORDER BY r.created_at DESC
  ), '[]'::jsonb)
  INTO v_referrals
  FROM public.referrals r
  WHERE r.client_id = v_client.id;

  -- ── 6. Prize redemptions list ───────────────────────────────────────────
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',          pr.id,
      'prize_name',  pr.prize_name,
      'points_cost', pr.points_cost,
      'status',      pr.status,
      'created_at',  pr.created_at
    ) ORDER BY pr.created_at DESC
  ), '[]'::jsonb)
  INTO v_redemptions
  FROM public.prize_redemptions pr
  WHERE pr.client_id = v_client.id;

  -- ── 7. Return full payload ──────────────────────────────────────────────
  RETURN jsonb_build_object(
    'client', jsonb_build_object(
      'id',           v_client.id,
      'name',         v_client.name,
      'email',        v_client.email,
      'phone',        v_client.phone,
      'address',      v_client.address,
      'avatar_url',   v_client.avatar_url,
      'analyst_id',   v_client.analyst_id,
      'auth_user_id', v_client.auth_user_id,
      'status',       v_client.status,
      'created_at',   v_client.created_at
    ),
    'points', jsonb_build_object(
      'id',                  v_points.id,
      'points',              v_points.points,
      'level',               v_points.level,
      'total_referrals',     v_points.total_referrals,
      'converted_referrals', COALESCE(v_points.converted_referrals, 0),
      'referral_token',      v_points.referral_token,
      'referral_slug',       v_points.referral_slug
    ),
    'referrals',   v_referrals,
    'redemptions', v_redemptions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_portal_data() TO authenticated;

-- ── Verify ─────────────────────────────────────────────────────────────────
-- Run this to confirm the function exists and returns the right shape:
-- SELECT get_client_portal_data();
