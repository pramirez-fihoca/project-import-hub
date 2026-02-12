
-- 1. Reemplazar política de profiles
DROP POLICY IF EXISTS "Profiles are private" ON public.profiles;

CREATE POLICY "Profiles are private access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id)
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- 2. Blindar user_roles (ya tiene RLS habilitado, solo actualizamos políticas)
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can only view their own role" ON public.user_roles;

CREATE POLICY "Users can only view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);
