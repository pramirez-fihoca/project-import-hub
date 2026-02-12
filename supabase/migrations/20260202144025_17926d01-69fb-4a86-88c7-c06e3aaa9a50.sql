-- Add fecha_entrega column to assets table
ALTER TABLE public.assets ADD COLUMN fecha_entrega date;

-- Add comment for documentation
COMMENT ON COLUMN public.assets.fecha_entrega IS 'Fecha en que se entregó el dispositivo al usuario';