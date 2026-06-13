-- Add avatar_url to clients table for circular org chart photos
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url text;
