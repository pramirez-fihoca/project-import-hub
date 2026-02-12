-- Add asignado_a column to assets table for storing assigned user email
ALTER TABLE public.assets 
ADD COLUMN asignado_a text;

-- Add comment for documentation
COMMENT ON COLUMN public.assets.asignado_a IS 'Email corporativo de Google de la persona asignada';