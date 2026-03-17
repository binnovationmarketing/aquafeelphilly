-- ============================================================
-- Aquafeel Hierarchy Schema Update — v2 (safe version)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add name columns if they don't exist
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS phone text;

-- 2. Add role column (text so it's flexible)
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS role text DEFAULT 'analyst_jr';

-- 3. Add sponsored_by (who recruited this analyst into the team)
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS sponsored_by uuid REFERENCES analysts(id);

-- 4. Add commission tracking columns
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS total_sales int DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS personal_commission numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS recruitment_bonus numeric(10,2) DEFAULT 0;
ALTER TABLE analysts ADD COLUMN IF NOT EXISTS differential_bonus numeric(10,2) DEFAULT 0;

-- 5. Make sure analyst_id is a proper FK in clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS analyst_id uuid REFERENCES analysts(id);

-- 6. Create analyst performance view (uses COALESCE for safe name fallback)
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
GROUP BY a.id, a.email, a.full_name, a.first_name, a.last_name, a.role, a.sponsored_by, a.active;

-- ============================================================
-- After running, update your own role:
-- UPDATE analysts SET role = 'manager_jr' WHERE email = 'binnovationmarketing@gmail.com';
--
-- To set who recruited an analyst:
-- UPDATE analysts SET sponsored_by = 'UUID-OF-SPONSOR' WHERE email = 'analyst@aquafeel.com';
-- ============================================================
