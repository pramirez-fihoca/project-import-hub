
-- Make profile_id nullable since assignments don't require a registered user
ALTER TABLE public.assignments ALTER COLUMN profile_id DROP NOT NULL;

-- Add employee name and email directly to assignments
ALTER TABLE public.assignments ADD COLUMN employee_name text;
ALTER TABLE public.assignments ADD COLUMN employee_email text;
