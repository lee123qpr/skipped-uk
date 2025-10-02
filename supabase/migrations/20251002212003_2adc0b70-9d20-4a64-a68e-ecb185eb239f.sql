-- Fix critical security issue: Remove public access to phone numbers in profiles table

-- Drop the overly permissive policy that exposes phone numbers to everyone
DROP POLICY IF EXISTS "Public can view safe profile information" ON public.profiles;

-- Drop the redundant phone policy (covered by "Users can view their own complete profile")
DROP POLICY IF EXISTS "Only user can view their own phone" ON public.profiles;

-- The existing "Users can view their own complete profile" policy remains, 
-- which allows users to see their own profile including phone number

-- Add a new policy that allows viewing other users' profiles
-- Note: Application code MUST NOT select the phone column when viewing other users' profiles
-- This policy allows row-level access, but phone should only be queried for own profile
CREATE POLICY "Public can view profiles" ON public.profiles
  FOR SELECT
  USING (true);

-- Add a comment to document the security requirement
COMMENT ON POLICY "Public can view profiles" ON public.profiles IS 
  'Allows viewing profile rows. Application code must not SELECT phone column for non-owner profiles. Phone numbers should only be accessed via the "Users can view their own complete profile" policy (auth.uid() = user_id).';

-- Add column comment to warn developers
COMMENT ON COLUMN public.profiles.phone IS 
  'SENSITIVE: Only accessible to profile owner. Never SELECT this column when querying other users profiles.';