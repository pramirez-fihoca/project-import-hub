-- Add accessories_stock field to assets table for storing equipment accessories
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS accessories_stock JSONB DEFAULT '[]'::jsonb;