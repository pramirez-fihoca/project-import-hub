-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more restrictive SELECT policy using the security definer function
CREATE POLICY "Profiles are private"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  public.has_role(auth.uid(), 'admin')
);