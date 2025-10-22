-- Fix public_safe_profiles to use SECURITY DEFINER
-- This view is specifically designed to expose only safe profile data
-- and needs elevated permissions to work with unauthenticated users

DROP VIEW IF EXISTS public.public_safe_profiles CASCADE;

CREATE VIEW public.public_safe_profiles
AS
SELECT 
  id,
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  location,
  company_name,
  business_logo_url,
  verified,
  identity_verified,
  stripe_onboarding_complete,
  on_holiday,
  holiday_message,
  holiday_start_date,
  holiday_end_date,
  created_at,
  updated_at
FROM public.profiles
WHERE account_status = 'active';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_safe_profiles TO anon;
GRANT SELECT ON public.public_safe_profiles TO authenticated;

COMMENT ON VIEW public.public_safe_profiles IS 'Public view of safe profile data. This view only exposes non-sensitive fields and is granted to anonymous users for marketplace functionality.';