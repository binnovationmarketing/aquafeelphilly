-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v15 (SECURITY FIX)
-- Generated: 2026-08-08
-- Run this in your Supabase SQL Editor.
--
-- Fixes an account-linking vulnerability in claim_client_account(): the
-- function only checked that the caller was *some* authenticated user, not
-- that the email being claimed belonged to that user. Any signed-in user
-- could call claim_client_account('someone-elses-email@x.com') and gain
-- access to that client's portal data via get_client_portal_data().
--
-- This version requires the caller's own JWT email to match the client
-- record's email, and refuses to re-link a client that is already claimed
-- by a different auth user.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.claim_client_account(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_existing_auth_user_id UUID;
  v_auth_uid UUID;
  v_auth_email TEXT;
BEGIN
  -- Get the current logged-in user's UID and email
  v_auth_uid := auth.uid();
  v_auth_email := auth.jwt() ->> 'email';

  IF v_auth_uid IS NULL OR v_auth_email IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Only allow claiming the client record that matches the caller's own email
  IF LOWER(v_auth_email) <> LOWER(p_email) THEN
    RETURN json_build_object('error', 'Forbidden — you can only claim your own account.');
  END IF;

  -- Find the client by email (case-insensitive)
  SELECT id, name, auth_user_id INTO v_client_id, v_client_name, v_existing_auth_user_id
  FROM public.clients
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_client_id IS NULL THEN
    RETURN json_build_object('error', 'Client not found with this email. Please contact your consultant.');
  END IF;

  -- Refuse to re-link a client already claimed by a different auth user
  IF v_existing_auth_user_id IS NOT NULL AND v_existing_auth_user_id <> v_auth_uid THEN
    RETURN json_build_object('error', 'This account is already linked to a different login.');
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
