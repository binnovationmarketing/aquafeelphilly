-- ============================================================
-- Aquafeel Commission System — Full Schema v3
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- 1. Core column additions (safe to re-run)
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS role text DEFAULT 'analyst_jr';
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS sponsored_by uuid REFERENCES analysts(id);
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS total_sales int DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS personal_commission numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS recruitment_bonus numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS differential_bonus numeric(10,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS analyst_id uuid REFERENCES analysts(id);

-- 2. Commissions log table (audit trail + Realtime source for notifications)
CREATE TABLE IF NOT EXISTS commissions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  client_id uuid REFERENCES clients(id),
  closing_analyst_id uuid REFERENCES analysts(id),
  beneficiary_id uuid REFERENCES analysts(id),  -- who earned the bonus
  commission_type text,                          -- 'personal' | 'recruitment' | 'differential'
  amount numeric(10,2) NOT NULL DEFAULT 0,
  beneficiary_role text,
  closing_analyst_role text,
  notified boolean DEFAULT false
);

-- Enable Realtime on commissions_log (copy this instruction for Supabase Dashboard)
-- Dashboard → Database → Replication → Supabase Realtime → enable for commissions_log

-- 3. Commission amount helper function
CREATE OR REPLACE FUNCTION commission_for_role(p_role text)
RETURNS numeric AS $$
BEGIN
  RETURN CASE p_role
    WHEN 'analyst_jr'  THEN 1500
    WHEN 'analyst_sr'  THEN 1800
    WHEN 'mentor_jr'   THEN 2100
    WHEN 'mentor_sr'   THEN 2400
    WHEN 'manager_jr'  THEN 2700
    WHEN 'manager_sr'  THEN 3000
    WHEN 'director_jr' THEN 3000
    WHEN 'director_sr' THEN 3000
    WHEN 'master'      THEN 3000
    WHEN 'ambassador'  THEN 3000
    ELSE 1500
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Main commission trigger function
CREATE OR REPLACE FUNCTION calc_commissions_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  analyst_rec   analysts%ROWTYPE;
  leader_rec    analysts%ROWTYPE;
  analyst_comm  numeric;
  leader_comm   numeric;
  bonus_amount  numeric;
  bonus_type    text;
BEGIN
  -- Only fire when status changes TO a sale state from a non-sale state
  IF NEW.status IN ('SALE', 'INSTALLED', 'ACTIVE') AND
     (OLD.status IS NULL OR OLD.status NOT IN ('SALE', 'INSTALLED', 'ACTIVE')) THEN

    -- Find the closing analyst
    IF NEW.analyst_id IS NOT NULL THEN
      SELECT * INTO analyst_rec FROM analysts WHERE id = NEW.analyst_id LIMIT 1;
    ELSE
      SELECT * INTO analyst_rec FROM analysts WHERE email = NEW.analyst LIMIT 1;
    END IF;

    IF analyst_rec.id IS NULL THEN
      RETURN NEW; -- No analyst found, skip
    END IF;

    analyst_comm := commission_for_role(COALESCE(analyst_rec.role, 'analyst_jr'));

    -- Personal commission for closing analyst
    UPDATE analysts
      SET total_sales         = total_sales + 1,
          personal_commission = personal_commission + analyst_comm
      WHERE id = analyst_rec.id;

    INSERT INTO commissions_log
      (client_id, closing_analyst_id, beneficiary_id, commission_type, amount, beneficiary_role, closing_analyst_role)
    VALUES
      (NEW.id, analyst_rec.id, analyst_rec.id, 'personal', analyst_comm,
       analyst_rec.role, analyst_rec.role);

    -- Walk UP the sponsor chain
    SELECT * INTO leader_rec FROM analysts WHERE id = analyst_rec.sponsored_by LIMIT 1;

    WHILE leader_rec.id IS NOT NULL LOOP
      leader_comm  := commission_for_role(COALESCE(leader_rec.role, 'analyst_jr'));
      bonus_amount := 0;
      bonus_type   := '';

      IF leader_rec.role IN ('analyst_jr', 'analyst_sr') THEN
        -- Flat recruitment bonus
        bonus_amount := 200;
        bonus_type   := 'recruitment';
        UPDATE analysts SET recruitment_bonus = recruitment_bonus + 200 WHERE id = leader_rec.id;
      ELSE
        -- Differential: leader's level minus closing analyst's level
        bonus_amount := GREATEST(0, leader_comm - analyst_comm);
        bonus_type   := 'differential';
        UPDATE analysts SET differential_bonus = differential_bonus + bonus_amount WHERE id = leader_rec.id;
      END IF;

      -- Log this bonus event (triggers Realtime notification to leader's browser)
      INSERT INTO commissions_log
        (client_id, closing_analyst_id, beneficiary_id, commission_type, amount, beneficiary_role, closing_analyst_role)
      VALUES
        (NEW.id, analyst_rec.id, leader_rec.id, bonus_type, bonus_amount,
         leader_rec.role, analyst_rec.role);

      -- Move up the chain
      SELECT * INTO leader_rec FROM analysts WHERE id = leader_rec.sponsored_by LIMIT 1;
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to clients table
DROP TRIGGER IF EXISTS on_sale_calculate_commissions ON clients;
CREATE TRIGGER on_sale_calculate_commissions
  AFTER INSERT OR UPDATE OF status ON clients
  FOR EACH ROW EXECUTE FUNCTION calc_commissions_on_sale();

-- 6. Analyst performance view (safe rebuild)
DROP VIEW IF EXISTS analyst_performance;
CREATE VIEW analyst_performance AS
SELECT
  a.id,
  a.email,
  COALESCE(a.full_name,
    NULLIF(TRIM(COALESCE(a.first_name,'') || ' ' || COALESCE(a.last_name,'')), ''),
    a.email
  ) AS display_name,
  COALESCE(a.role, 'analyst_jr') AS role,
  a.sponsored_by,
  COALESCE(a.active, true) AS active,
  a.total_sales,
  a.personal_commission,
  a.recruitment_bonus,
  a.differential_bonus,
  (a.personal_commission + a.recruitment_bonus + a.differential_bonus) AS total_earnings,
  COUNT(c.id) AS total_leads,
  ROUND(
    CASE WHEN COUNT(c.id) > 0
      THEN a.total_sales::numeric / COUNT(c.id) * 100 ELSE 0 END, 1
  ) AS conversion_rate
FROM analysts a
LEFT JOIN clients c ON c.analyst_id = a.id OR c.analyst = a.email
GROUP BY a.id, a.email, a.full_name, a.first_name, a.last_name,
         a.role, a.sponsored_by, a.active, a.total_sales,
         a.personal_commission, a.recruitment_bonus, a.differential_bonus;

-- 7. RLS: Allow authenticated users to read commissions_log for their own entries
ALTER TABLE commissions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own commission events"
  ON commissions_log FOR SELECT
  TO authenticated
  USING (
    beneficiary_id IN (
      SELECT id FROM analysts WHERE email = auth.email()
    )
  );

-- Allow service role to insert (trigger runs as SECURITY DEFINER)
-- No additional policy needed for INSERT.

-- ============================================================
-- AFTER RUNNING: Update your own role
-- UPDATE analysts SET role = 'director_sr' WHERE email = 'binnovationmarketing@gmail.com';
-- ============================================================
