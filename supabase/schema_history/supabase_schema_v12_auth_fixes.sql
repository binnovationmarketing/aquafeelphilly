-- ===========================================================================
-- Aquafeel VIP — Schema v12: Auth Fixes + Referral Type
-- Run this in the Supabase SQL Editor (project > SQL Editor > New query)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. check_client_exists
--    Used by the new ClientLogin to determine if email is registered
--    without exposing the clients table to anon users (RLS bypass).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_client_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients WHERE lower(email) = lower(p_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.check_client_exists(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Add referral_type column to referrals table
--    Values: 'agua' (water analysis) | 'trabalho' (join the team)
-- ---------------------------------------------------------------------------
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS referral_type text NOT NULL DEFAULT 'agua'
  CHECK (referral_type IN ('agua', 'trabalho'));

-- ---------------------------------------------------------------------------
-- 3. Update add_referral_from_portal to accept optional p_type
--    Drop old function signature first (PostgreSQL overloads by args).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.add_referral_from_portal(uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.add_referral_from_portal(
  p_token   uuid,
  p_name    text,
  p_phone   text,
  p_email   text    DEFAULT '',
  p_address text    DEFAULT '',
  p_type    text    DEFAULT 'agua'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points   public.client_points%ROWTYPE;
  v_client   public.clients%ROWTYPE;
  v_referral public.referrals%ROWTYPE;
  v_type     text;
BEGIN
  -- Validate referral type
  v_type := CASE WHEN p_type IN ('agua', 'trabalho') THEN p_type ELSE 'agua' END;

  SELECT * INTO v_points FROM public.client_points WHERE referral_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Token inválido.');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_points.client_id;

  INSERT INTO public.referrals (client_id, analyst_id, name, phone, email, address, referral_type)
  VALUES (v_client.id, v_client.analyst_id, p_name, p_phone, p_email, p_address, v_type)
  RETURNING * INTO v_referral;

  RETURN jsonb_build_object('success', true, 'referral_id', v_referral.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_referral_from_portal(uuid, text, text, text, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. get_client_by_phone — lookup client email by phone number
--    Used if we ever need to look up a client by phone in future features.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_client_by_phone(p_phone text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT jsonb_build_object('email', email, 'name', name)
  FROM public.clients
  WHERE phone = p_phone OR phone = '+1' || regexp_replace(p_phone, '\D', '', 'g')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_by_phone(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Done. Verify:
--   SELECT check_client_exists('test@example.com');
--   SELECT referral_type FROM referrals LIMIT 5;
-- ---------------------------------------------------------------------------
