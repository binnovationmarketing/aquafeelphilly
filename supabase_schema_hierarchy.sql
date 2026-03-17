-- ============================================================
-- Aquafeel Hierarchy Schema Update
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add sponsored_by (who recruited this analyst into the team)
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS sponsored_by uuid REFERENCES analysts(id);

-- 2. Add role column if not exists (text so it's flexible)
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS role text DEFAULT 'analyst_jr';

-- 3. Add commission tracking columns
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS total_sales int DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS personal_commission numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS recruitment_bonus numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS differential_bonus numeric(10,2) DEFAULT 0;

-- 4. Make sure analyst_id is a proper FK in clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS analyst_id uuid REFERENCES analysts(id);

-- 5. View: analyst performance summary (used by manager dashboard)
CREATE OR REPLACE VIEW analyst_performance AS
SELECT
  a.id,
  a.email,
  a.first_name,
  a.last_name,
  a.full_name,
  a.role,
  a.sponsored_by,
  a.active,
  COUNT(c.id) FILTER (WHERE c.status IN ('SALE','INSTALLED','ACTIVE')) AS total_sales,
  COUNT(c.id) AS total_leads,
  ROUND(
    CASE WHEN COUNT(c.id) > 0
      THEN COUNT(c.id) FILTER (WHERE c.status IN ('SALE','INSTALLED','ACTIVE'))::numeric / COUNT(c.id) * 100
      ELSE 0
    END, 1
  ) AS conversion_rate
FROM analysts a
LEFT JOIN clients c ON c.analyst_id = a.id OR c.analyst = a.email
GROUP BY a.id, a.email, a.first_name, a.last_name, a.full_name, a.role, a.sponsored_by, a.active;

-- 6. Enable RLS on analyst_performance view
-- (The view inherits from the base tables which should already have RLS)

-- ============================================================
-- Example: Manually set roles after running this script
-- UPDATE analysts SET role = 'analyst_sr' WHERE email = 'example@aquafeel.com';
-- UPDATE analysts SET sponsored_by = 'UUID-OF-SPONSOR' WHERE email = 'downline@aquafeel.com';
-- ============================================================
