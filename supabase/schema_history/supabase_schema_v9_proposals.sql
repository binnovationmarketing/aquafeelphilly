-- =============================================================================
-- AQUAFEEL VIP PROPOSAL — SCHEMA MIGRATION v9 (PDF PROPOSALS)
-- Generated: 2026-05-01
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ADD COLUMN TO CLIENTS TABLE
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS proposal_pdf_url TEXT;

-- ---------------------------------------------------------------------------
-- 2. CREATE STORAGE BUCKET FOR PROPOSALS
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposals', 'proposals', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. STORAGE POLICIES
-- ---------------------------------------------------------------------------
-- Allow authenticated users to upload proposals
CREATE POLICY "Allow authenticated users to upload proposals" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'proposals');

-- Allow authenticated users to update their own proposals
CREATE POLICY "Allow authenticated users to update proposals" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'proposals');

-- Allow public to view proposals (since they need to be sent via WhatsApp link)
CREATE POLICY "Allow public to read proposals" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'proposals');
