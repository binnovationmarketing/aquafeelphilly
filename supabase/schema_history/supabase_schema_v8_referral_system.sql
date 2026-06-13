-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v8 (REFERRAL SYSTEM)
-- Generated: 2026-05-01
-- Run AFTER supabase_schema_v6_phase1.sql on an existing DB.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. HELPER FUNCTION
-- Ensures the update_updated_at trigger function exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 1. TABLE: referrals
-- Stores client referrals (separate from tasks/clients). Each row = one
-- family that a client recommended to Aquafeel.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  analyst_id            uuid        REFERENCES public.analysts(id),
  -- Referred person info
  name                  text        NOT NULL,
  phone                 text,
  email                 text,
  address               text,
  -- Lifecycle
  status                text        DEFAULT 'PENDING'
                                    CHECK (status IN ('PENDING','SCHEDULED','CONVERTED','LOST','HOLD')),
  converted_client_id   uuid        REFERENCES public.clients(id),  -- set when this referral becomes a client
  points_awarded        boolean     DEFAULT false,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Analysts can see and manage referrals for their own clients
CREATE POLICY "Analysts can view own referrals"
  ON public.referrals FOR SELECT
  USING (analyst_id = auth.uid() OR public.is_manager_or_above());

CREATE POLICY "Analysts can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (analyst_id = auth.uid());

CREATE POLICY "Analysts can update own referrals"
  ON public.referrals FOR UPDATE
  USING (analyst_id = auth.uid() OR public.is_manager_or_above());

CREATE POLICY "Analysts can delete own referrals"
  ON public.referrals FOR DELETE
  USING (analyst_id = auth.uid() OR public.is_manager_or_above());

-- Auto-update updated_at
CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ---------------------------------------------------------------------------
-- 2. TABLE: client_points
-- One row per client that participates in the referral program.
-- Created automatically when a client reaches SALE/INSTALLED/ACTIVE status.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_points (
  id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            uuid        UNIQUE NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  points               integer     DEFAULT 0,
  level                integer     DEFAULT 1,  -- 1=Embaixador, 2=Elite
  total_referrals      integer     DEFAULT 0,
  converted_referrals  integer     DEFAULT 0,
  referral_token       uuid        UNIQUE DEFAULT uuid_generate_v4(),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.client_points ENABLE ROW LEVEL SECURITY;

-- Analysts can view points for their own clients, managers see all
CREATE POLICY "Analysts can view own client points"
  ON public.client_points FOR SELECT
  USING (
    public.is_manager_or_above()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id
        AND (c.analyst_id = auth.uid() OR c.analyst = auth.jwt() ->> 'email')
    )
  );

-- Allow service role to insert/update (triggers run as SECURITY DEFINER)
CREATE POLICY "Service role can manage points"
  ON public.client_points FOR ALL
  USING (auth.role() = 'service_role');

-- RLS bypass for triggers via SECURITY DEFINER functions (no policy needed for them)

-- Auto-update updated_at
CREATE TRIGGER client_points_updated_at
  BEFORE UPDATE ON public.client_points
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ---------------------------------------------------------------------------
-- 3. TABLE: points_transactions
-- Full audit trail of every point change.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  points        integer     NOT NULL,  -- positive = credit, negative = debit
  type          text        NOT NULL
                            CHECK (type IN (
                              'REFERRAL_REGISTERED',
                              'REFERRAL_CONVERTED',
                              'ANALYSIS_DONE',
                              'BONUS',
                              'REDEMPTION'
                            )),
  description   text,
  reference_id  uuid,       -- referral.id or prize_redemptions.id that caused this
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts can view own client transactions"
  ON public.points_transactions FOR SELECT
  USING (
    public.is_manager_or_above()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id
        AND (c.analyst_id = auth.uid() OR c.analyst = auth.jwt() ->> 'email')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. TABLE: prize_redemptions
-- Tracks prize redemption requests from clients.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prize_redemptions (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     uuid        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  prize_name    text        NOT NULL,
  points_cost   integer     NOT NULL,
  status        text        DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','PROCESSING','DELIVERED','CANCELLED')),
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.prize_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analysts can view own redemptions"
  ON public.prize_redemptions FOR SELECT
  USING (
    public.is_manager_or_above()
    OR EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id
        AND (c.analyst_id = auth.uid() OR c.analyst = auth.jwt() ->> 'email')
    )
  );

CREATE TRIGGER prize_redemptions_updated_at
  BEFORE UPDATE ON public.prize_redemptions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();


-- ---------------------------------------------------------------------------
-- 5. TRIGGER: Auto-create client_points row when a client reaches SALE status
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_client_points_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('SALE', 'INSTALLED', 'ACTIVE')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('SALE', 'INSTALLED', 'ACTIVE'))
  THEN
    INSERT INTO public.client_points (client_id)
    VALUES (NEW.id)
    ON CONFLICT (client_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_sale_create_client_points ON public.clients;
CREATE TRIGGER on_sale_create_client_points
  AFTER INSERT OR UPDATE OF status ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.ensure_client_points_on_sale();


-- ---------------------------------------------------------------------------
-- 6. TRIGGER: Auto-award points when a referral is inserted (REGISTERED)
-- +300 pts for registering a new referral
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_points_on_referral_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Credit +300 pts to the referring client
  UPDATE public.client_points
    SET points = points + 300,
        total_referrals = total_referrals + 1
    WHERE client_id = NEW.client_id;

  -- If no client_points row yet (safety), create one
  INSERT INTO public.client_points (client_id, points, total_referrals)
  VALUES (NEW.client_id, 300, 1)
  ON CONFLICT (client_id) DO NOTHING;

  -- Log the transaction
  INSERT INTO public.points_transactions (client_id, points, type, description, reference_id)
  VALUES (NEW.client_id, 300, 'REFERRAL_REGISTERED',
          'Indicação registrada: ' || NEW.name, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_referral_insert_award_points ON public.referrals;
CREATE TRIGGER on_referral_insert_award_points
  AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_referral_insert();


-- ---------------------------------------------------------------------------
-- 7. TRIGGER: Auto-award points when a referral is CONVERTED (+900 pts)
-- Also updates level to Elite (2) if converted_referrals >= 3
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_points_on_referral_converted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes TO 'CONVERTED' and points not yet awarded
  IF NEW.status = 'CONVERTED'
     AND OLD.status <> 'CONVERTED'
     AND NEW.points_awarded = false
  THEN
    -- Credit +900 pts
    UPDATE public.client_points
      SET points = points + 900,
          converted_referrals = converted_referrals + 1,
          -- Auto-upgrade to Elite when 3 conversions reached
          level = CASE WHEN converted_referrals + 1 >= 3 THEN 2 ELSE level END
      WHERE client_id = NEW.client_id;

    -- Log
    INSERT INTO public.points_transactions (client_id, points, type, description, reference_id)
    VALUES (NEW.client_id, 900, 'REFERRAL_CONVERTED',
            'Indicação convertida em venda: ' || NEW.name, NEW.id);

    -- Mark as awarded to prevent double-credit
    NEW.points_awarded := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_referral_converted_award_points ON public.referrals;
CREATE TRIGGER on_referral_converted_award_points
  BEFORE UPDATE OF status ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.award_points_on_referral_converted();


-- ---------------------------------------------------------------------------
-- 8. RPC: get_client_referral_portal
-- Allows unauthenticated clients to load their referral portal by token.
-- Returns client info + points + referrals + transactions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_client_referral_portal(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_client    public.clients%ROWTYPE;
  v_points    public.client_points%ROWTYPE;
  v_referrals jsonb;
  v_history   jsonb;
BEGIN
  -- Get the client from referral_token
  SELECT * INTO v_client
    FROM public.client_points
    WHERE referral_token = p_token
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Token inválido ou não encontrado.');
  END IF;

  -- Get points record
  SELECT * INTO v_points
    FROM public.client_points
    WHERE referral_token = p_token;

  -- Get client info
  SELECT * INTO v_client
    FROM public.clients
    WHERE id = v_points.client_id;

  -- Get referrals
  SELECT jsonb_agg(r ORDER BY r.created_at DESC) INTO v_referrals
    FROM public.referrals r
    WHERE r.client_id = v_client.id;

  -- Get last 10 transactions
  SELECT jsonb_agg(t ORDER BY t.created_at DESC) INTO v_history
    FROM (
      SELECT * FROM public.points_transactions
      WHERE client_id = v_client.id
      ORDER BY created_at DESC
      LIMIT 10
    ) t;

  RETURN jsonb_build_object(
    'client',       row_to_json(v_client),
    'points',       row_to_json(v_points),
    'referrals',    COALESCE(v_referrals, '[]'::jsonb),
    'history',      COALESCE(v_history,   '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_referral_portal(uuid) TO anon;


-- ---------------------------------------------------------------------------
-- 9. RPC: add_referral_from_portal
-- Allows unauthenticated clients to submit a new referral via their portal.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_referral_from_portal(
  p_token   uuid,
  p_name    text,
  p_phone   text,
  p_email   text,
  p_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points   public.client_points%ROWTYPE;
  v_client   public.clients%ROWTYPE;
  v_referral public.referrals%ROWTYPE;
BEGIN
  SELECT * INTO v_points FROM public.client_points WHERE referral_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Token inválido.');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_points.client_id;

  INSERT INTO public.referrals (client_id, analyst_id, name, phone, email, address)
  VALUES (v_client.id, v_client.analyst_id, p_name, p_phone, p_email, p_address)
  RETURNING * INTO v_referral;

  RETURN jsonb_build_object('success', true, 'referral_id', v_referral.id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_referral_from_portal(uuid, text, text, text, text) TO anon;


-- ---------------------------------------------------------------------------
-- 10. RPC: redeem_prize_from_portal
-- Records a prize redemption request from the client portal.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_prize_from_portal(
  p_token       uuid,
  p_prize_name  text,
  p_points_cost integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points public.client_points%ROWTYPE;
BEGIN
  SELECT * INTO v_points FROM public.client_points WHERE referral_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Token inválido.');
  END IF;

  IF v_points.points < p_points_cost THEN
    RETURN jsonb_build_object('error', 'Pontos insuficientes para resgatar este prêmio.');
  END IF;

  -- Deduct points
  UPDATE public.client_points
    SET points = points - p_points_cost
    WHERE referral_token = p_token;

  -- Create redemption record
  INSERT INTO public.prize_redemptions (client_id, prize_name, points_cost)
  VALUES (v_points.client_id, p_prize_name, p_points_cost);

  -- Log transaction
  INSERT INTO public.points_transactions (client_id, points, type, description)
  VALUES (v_points.client_id, -p_points_cost, 'REDEMPTION',
          'Resgate solicitado: ' || p_prize_name);

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_prize_from_portal(uuid, text, integer) TO anon;


-- ---------------------------------------------------------------------------
-- 11. Backfill: Create client_points for all existing SALE/INSTALLED/ACTIVE clients
-- ---------------------------------------------------------------------------
INSERT INTO public.client_points (client_id)
SELECT id FROM public.clients
WHERE status IN ('SALE', 'INSTALLED', 'ACTIVE')
ON CONFLICT (client_id) DO NOTHING;


-- =============================================================================
-- END OF MIGRATION v8
-- Instructions:
-- 1. Run this file in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- 2. Paste all contents and click "Run"
-- 3. Verify tables: referrals, client_points, points_transactions, prize_redemptions
-- 4. Test by inserting a referral row and checking points_transactions
-- =============================================================================
