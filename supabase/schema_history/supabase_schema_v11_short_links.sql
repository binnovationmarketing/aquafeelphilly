-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v11 (SHORT LINKS + SCHEDULING + EMAIL)
-- Generated: 2026-05-02
-- Run this in your Supabase SQL Editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. SHORT REFERRAL SLUG on client_points
-- ---------------------------------------------------------------------------
ALTER TABLE public.client_points
ADD COLUMN IF NOT EXISTS referral_slug TEXT UNIQUE;

-- Helper: generate a URL-safe slug from a name
CREATE OR REPLACE FUNCTION public.slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(TRIM(input),
          'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
          'aaaaaaeeeeiiiiooooouuuucnAAAAAAAAEEEEIIIIOOOOOUUUUCN'
        ),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
$$;

-- Function to generate a unique slug from client name
CREATE OR REPLACE FUNCTION public.generate_referral_slug(p_client_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_name TEXT;
  v_first_name TEXT;
  v_base_slug TEXT;
  v_slug TEXT;
  v_suffix INT := 0;
  v_exists BOOLEAN;
BEGIN
  SELECT name INTO v_name FROM public.clients WHERE id = p_client_id;
  IF v_name IS NULL THEN RETURN uuid_generate_v4()::text; END IF;

  -- Take first name only
  v_first_name := SPLIT_PART(v_name, ' ', 1);
  v_base_slug := public.slugify(v_first_name);
  IF LENGTH(v_base_slug) < 2 THEN v_base_slug := public.slugify(v_name); END IF;

  v_slug := v_base_slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.client_points WHERE referral_slug = v_slug) INTO v_exists;
    EXIT WHEN NOT v_exists;
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix::text;
  END LOOP;
  RETURN v_slug;
END;
$$;

-- Populate slugs for existing records
DO $$
DECLARE
  rec RECORD;
  v_slug TEXT;
BEGIN
  FOR rec IN
    SELECT cp.id, cp.client_id FROM public.client_points cp WHERE cp.referral_slug IS NULL
  LOOP
    v_slug := public.generate_referral_slug(rec.client_id);
    UPDATE public.client_points SET referral_slug = v_slug WHERE id = rec.id;
  END LOOP;
END;
$$;

-- Trigger: auto-generate slug on new client_points rows
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_slug IS NULL THEN
    NEW.referral_slug := public.generate_referral_slug(NEW.client_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_slug ON public.client_points;
CREATE TRIGGER trg_auto_slug
  BEFORE INSERT ON public.client_points
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_slug();

-- ---------------------------------------------------------------------------
-- 2. SCHEDULING COLUMNS on referrals
-- ---------------------------------------------------------------------------
ALTER TABLE public.referrals
ADD COLUMN IF NOT EXISTS scheduled_at        TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_address   TEXT,
ADD COLUMN IF NOT EXISTS scheduled_city      TEXT,
ADD COLUMN IF NOT EXISTS scheduled_state     TEXT;

-- ---------------------------------------------------------------------------
-- 3. RPC: GET CLIENT PORTAL DATA (updated to include referral_slug)
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
  SELECT * INTO v_client
  FROM public.clients
  WHERE auth_user_id = auth.uid()
  LIMIT 1;

  IF v_client IS NULL THEN
    RETURN json_build_object('error', 'Client portal not activated. Please log in again.');
  END IF;

  SELECT * INTO v_points
  FROM public.client_points
  WHERE client_id = v_client.id;

  SELECT json_agg(
    json_build_object(
      'id', r.id,
      'name', r.name,
      'phone', r.phone,
      'status', r.status,
      'created_at', r.created_at,
      'scheduled_at', r.scheduled_at,
      'scheduled_address', r.scheduled_address,
      'scheduled_city', r.scheduled_city,
      'scheduled_state', r.scheduled_state
    )
    ORDER BY r.created_at DESC
  ) INTO v_referrals
  FROM public.referrals r
  WHERE r.client_id = v_client.id;

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
      'referral_token', v_points.referral_token,
      'referral_slug', v_points.referral_slug
    ),
    'referrals', COALESCE(v_referrals, '[]'::json),
    'redemptions', COALESCE(v_redemptions, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_portal_data() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RPC: RESOLVE SLUG → portal data (for short link landing page)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_referral_data_by_slug(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID;
  v_client_name TEXT;
BEGIN
  SELECT cp.referral_token, c.name
  INTO v_token, v_client_name
  FROM public.client_points cp
  JOIN public.clients c ON c.id = cp.client_id
  WHERE LOWER(cp.referral_slug) = LOWER(p_slug)
  LIMIT 1;

  IF v_token IS NULL THEN
    -- fallback: try parsing slug as UUID (backward compatibility)
    BEGIN
      v_token := p_slug::UUID;
      SELECT c.name INTO v_client_name
      FROM public.client_points cp
      JOIN public.clients c ON c.id = cp.client_id
      WHERE cp.referral_token = v_token
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('error', 'Link de convite inválido ou expirado.');
    END;
  END IF;

  IF v_token IS NULL THEN
    RETURN json_build_object('error', 'Link de convite inválido ou expirado.');
  END IF;

  RETURN json_build_object(
    'token', v_token,
    'referrer_name', v_client_name,
    'slug', p_slug
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_data_by_slug(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: SCHEDULE REFERRAL VISIT (returns analyst + referrer emails for notification)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.schedule_referral_visit(
  p_referral_id    UUID,
  p_date           DATE,
  p_time           TEXT,
  p_address        TEXT,
  p_city           TEXT,
  p_state          TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_analyst_id    UUID;
  v_client_id     UUID;
  v_client_name   TEXT;
  v_client_email  TEXT;
  v_ref_name      TEXT;
  v_scheduled     TIMESTAMPTZ;
  v_analyst_email TEXT;
BEGIN
  -- Build timestamp from date + time string (format: "09:00 AM")
  v_scheduled := (p_date::TEXT || ' ' || p_time)::TIMESTAMPTZ;

  -- Update referral record
  UPDATE public.referrals
  SET
    status            = 'SCHEDULED',
    scheduled_at      = v_scheduled,
    scheduled_address = p_address,
    scheduled_city    = p_city,
    scheduled_state   = p_state,
    notes             = COALESCE(notes, '') || E'\n[AGENDAMENTO] ' || p_date::TEXT || ' às ' || p_time
                        || ' - ' || p_address || ', ' || p_city || ', ' || p_state,
    updated_at        = now()
  WHERE id = p_referral_id
  RETURNING analyst_id, client_id, name INTO v_analyst_id, v_client_id, v_ref_name;

  IF v_ref_name IS NULL THEN
    RETURN json_build_object('error', 'Referral não encontrado.');
  END IF;

  -- Get referrer (client who sent invite) info
  SELECT name, email INTO v_client_name, v_client_email
  FROM public.clients WHERE id = v_client_id;

  -- Get analyst email from analysts table
  SELECT email INTO v_analyst_email
  FROM public.analysts WHERE id = v_analyst_id;

  -- If analyst not in analysts table, try auth.users email
  IF v_analyst_email IS NULL AND v_analyst_id IS NOT NULL THEN
    SELECT email INTO v_analyst_email
    FROM auth.users WHERE id = v_analyst_id;
  END IF;

  -- Create a task notification for the analyst dashboard
  IF v_analyst_id IS NOT NULL THEN
    INSERT INTO public.tasks (
      client_id, analyst_id, title, notes, status, type, scheduled_for
    ) VALUES (
      v_client_id,
      v_analyst_id,
      '📅 Análise Agendada via Indicação: ' || v_ref_name,
      'Agendamento pelo portal de indicação.' ||
      ' Endereço: ' || p_address || ', ' || p_city || ', ' || p_state ||
      ' — Data: ' || p_date::TEXT || ' às ' || p_time ||
      ' — Indicado por: ' || COALESCE(v_client_name, 'cliente'),
      'PENDING',
      'VISIT',
      v_scheduled
    );
  END IF;

  RETURN json_build_object(
    'success',        true,
    'referral_name',  v_ref_name,
    'referrer_name',  COALESCE(v_client_name, ''),
    'referrer_email', COALESCE(v_client_email, ''),
    'analyst_email',  COALESCE(v_analyst_email, ''),
    'scheduled_at',   v_scheduled
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_referral_visit(UUID, DATE, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Allow anon/portal to read own referral status
DROP POLICY IF EXISTS "Clients can view own referrals" ON public.referrals;
CREATE POLICY "Clients can view own referrals"
  ON public.referrals FOR SELECT
  USING (
    client_id IN (SELECT id FROM public.clients WHERE auth_user_id = auth.uid())
    OR analyst_id = auth.uid()
    OR public.is_manager_or_above()
  );
