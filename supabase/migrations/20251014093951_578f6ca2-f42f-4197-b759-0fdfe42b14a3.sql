-- Remove legacy SECURITY DEFINER views that pose privilege escalation risks
-- These have been replaced by regular views (public_safe_profiles, public_reviews, public_listings)

DROP VIEW IF EXISTS public.public_profiles CASCADE;