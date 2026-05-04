-- ===========================================================================
-- Aquafeel VIP — Schema v13: Backfill referral_token + referral_slug
-- Run in Supabase SQL Editor for clients created before v8/v11 triggers.
-- ===========================================================================

-- 1. Backfill missing referral_token (null rows only)
UPDATE public.client_points
SET referral_token = gen_random_uuid()
WHERE referral_token IS NULL;

-- 2. Backfill missing referral_slug (uses existing generate_referral_slug function)
UPDATE public.client_points cp
SET referral_slug = public.generate_referral_slug(cp.client_id)
WHERE cp.referral_slug IS NULL;

-- 3. Verify
SELECT
  COUNT(*) FILTER (WHERE referral_token IS NULL) AS missing_tokens,
  COUNT(*) FILTER (WHERE referral_slug  IS NULL) AS missing_slugs,
  COUNT(*)                                        AS total_records
FROM public.client_points;
