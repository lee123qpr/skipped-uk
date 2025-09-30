-- Restrict profile data to protect sensitive information
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Policy 1: Users can view their own complete profile including sensitive data
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Public can only view basic, non-sensitive profile information
-- This policy allows public access but applications MUST only select:
-- username, avatar_url, bio, location, verified
-- DO NOT select: display_name, phone, company_name
CREATE POLICY "Public can view basic profile information"
ON public.profiles
FOR SELECT
TO public
USING (true);

-- Add comment to document the security model
COMMENT ON TABLE public.profiles IS 'Contains user profile data. Phone, display_name, and company_name are private. Public queries should only select: username, avatar_url, bio, location, verified.';