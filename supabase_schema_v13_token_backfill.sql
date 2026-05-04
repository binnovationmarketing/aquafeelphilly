-- ===========================================================================
-- Aquafeel VIP — Schema v13: Backfill referral_token + referral_slug
-- Run in Supabase SQL Editor (replaces previous v13 if you ran it before).
-- ===========================================================================

-- 1. Backfill missing referral_token
UPDATE public.client_points
SET referral_token = gen_random_uuid()
WHERE referral_token IS NULL;

-- 2. Backfill missing referral_slug
UPDATE public.client_points cp
SET referral_slug = public.generate_referral_slug(cp.client_id)
WHERE cp.referral_slug IS NULL;

-- 3. RPC: ensure_referral_token
--    Returns the token for the calling client — generates one if still missing.
--    Called by the frontend when portalData.points.referral_token is null.
CREATE OR REPLACE FUNCTION public.ensure_referral_token()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_cp    public.client_points%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_cp FROM public.client_points WHERE client_id = v_uid;

  IF NOT FOUND THEN
    -- Create client_points row if it doesn't exist yet
    INSERT INTO public.client_points (client_id, points, level, total_referrals)
    VALUES (v_uid, 0, 1, 0)
    RETURNING * INTO v_cp;
  END IF;

  -- Generate token/slug if still null
  IF v_cp.referral_token IS NULL THEN
    UPDATE public.client_points
    SET referral_token = gen_random_uuid()
    WHERE id = v_cp.id
    RETURNING * INTO v_cp;
  END IF;

  IF v_cp.referral_slug IS NULL THEN
    UPDATE public.client_points
    SET referral_slug = public.generate_referral_slug(v_uid)
    WHERE id = v_cp.id
    RETURNING * INTO v_cp;
  END IF;

  RETURN jsonb_build_object(
    'referral_token', v_cp.referral_token,
    'referral_slug',  v_cp.referral_slug
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_referral_token() TO authenticated;

-- 4. Update get_client_portal_data to auto-generate token if null
CREATE OR REPLACE FUNCTION public.get_client_portal_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_client public.clients%ROWTYPE;
  v_points public.client_points%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE auth_user_id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Client not found. Please contact support.');
  END IF;

  SELECT * INTO v_points FROM public.client_points WHERE client_id = v_uid;
  IF NOT FOUND THEN
    INSERT INTO public.client_points (client_id, points, level, total_referrals)
    VALUES (v_uid, 0, 1, 0)
    RETURNING * INTO v_points;
  END IF;

  -- Auto-generate missing token/slug
  IF v_points.referral_token IS NULL THEN
    UPDATE public.client_points
    SET referral_token = gen_random_uuid()
    WHERE id = v_points.id
    RETURNING * INTO v_points;
  END IF;

  IF v_points.referral_slug IS NULL THEN
    UPDATE public.client_points
    SET referral_slug = public.generate_referral_slug(v_uid)
    WHERE id = v_points.id
    RETURNING * INTO v_points;
  END IF;

  RETURN jsonb_build_object(
    'client', jsonb_build_object(
      'id',            v_client.id,
      'name',          v_client.name,
      'email',         v_client.email,
      'phone',         v_client.phone,
      'address',       v_client.address,
      'avatar_url',    v_client.avatar_url,
      'analyst_id',    v_client.analyst_id,
      'auth_user_id',  v_client.auth_user_id,
      'created_at',    v_client.created_at
    ),
    'points', jsonb_build_object(
      'id',               v_points.id,
      'points',           v_points.points,
      'level',            v_points.level,
      'total_referrals',  v_points.total_referrals,
      'referral_token',   v_points.referral_token,
      'referral_slug',    v_points.referral_slug
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_portal_data() TO authenticated;

-- 5. Verify
SELECT
  COUNT(*) FILTER (WHERE referral_token IS NULL) AS missing_tokens,
  COUNT(*) FILTER (WHERE referral_slug  IS NULL) AS missing_slugs,
  COUNT(*)                                        AS total_records
FROM public.client_points;
