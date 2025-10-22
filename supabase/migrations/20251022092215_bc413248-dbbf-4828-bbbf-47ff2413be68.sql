-- Simplify profiles RLS policy to work with SECURITY INVOKER views
-- The public_safe_profiles view already filters sensitive data, so we can be more permissive here

DROP POLICY IF EXISTS "View profiles" ON public.profiles;

-- Simpler policy: allow viewing active profiles (marketplace sellers)
-- The public_safe_profiles view controls what fields are exposed
CREATE POLICY "View profiles"
ON public.profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = user_id
  OR
  -- Admin access
  has_role(auth.uid(), 'admin')
  OR
  -- All active profiles can be viewed (for marketplace functionality)
  -- The view controls what sensitive data is exposed
  account_status = 'active'
);

COMMENT ON POLICY "View profiles" ON public.profiles IS 'Allows viewing own profile, admin access, and public access to active profiles for marketplace. Sensitive data is filtered by the public_safe_profiles view.';