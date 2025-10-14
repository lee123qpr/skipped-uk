-- Remove SECURITY DEFINER from public views for security
-- Using CASCADE to handle dependencies between views

-- Drop all dependent views first
DROP VIEW IF EXISTS public.public_reviews CASCADE;
DROP VIEW IF EXISTS public.public_safe_profiles CASCADE;
DROP VIEW IF EXISTS public.public_listings CASCADE;

-- Recreate public_listings without SECURITY DEFINER
CREATE VIEW public.public_listings AS
SELECT 
  id,
  title,
  description,
  price,
  condition,
  quantity,
  category_id,
  images,
  seller_id,
  status,
  available,
  featured,
  created_at,
  updated_at,
  view_count,
  last_viewed_at,
  public_location,
  location,
  carbon_saved,
  manufacturer,
  weight,
  dimensions,
  reason_for_selling,
  pickup_available,
  delivery_available,
  delivery_radius,
  delivery_cost,
  environmental_assessment_enabled,
  calculation_confidence,
  certificate_methodology,
  search_vector
FROM listings l
WHERE status = 'active' AND available = true;

-- Recreate public_safe_profiles without SECURITY DEFINER
CREATE VIEW public.public_safe_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  username,
  avatar_url,
  business_logo_url,
  company_name,
  location,
  bio,
  verified,
  identity_verified,
  stripe_onboarding_complete,
  created_at,
  updated_at,
  on_holiday,
  holiday_start_date,
  holiday_end_date,
  holiday_message
FROM profiles p
WHERE account_status = 'active';

-- Recreate public_reviews without SECURITY DEFINER
CREATE VIEW public.public_reviews AS
SELECT 
  r.id,
  r.listing_id,
  r.transaction_id,
  r.rating,
  r.title,
  r.comment,
  r.seller_reply,
  r.seller_reply_created_at,
  r.reviewer_type,
  r.created_at,
  r.updated_at,
  reviewer_profile.display_name AS reviewer_name,
  reviewer_profile.avatar_url AS reviewer_avatar,
  reviewer_profile.verified AS reviewer_verified,
  reviewer_profile.username AS reviewer_username,
  seller_profile.display_name AS seller_name,
  seller_profile.avatar_url AS seller_avatar,
  seller_profile.verified AS seller_verified,
  seller_profile.username AS seller_username
FROM reviews r
LEFT JOIN public_safe_profiles reviewer_profile ON reviewer_profile.user_id = r.reviewer_id
LEFT JOIN public_safe_profiles seller_profile ON seller_profile.user_id = r.seller_id;

COMMENT ON VIEW public.public_listings IS 'Public view of active listings with non-sensitive fields only';
COMMENT ON VIEW public.public_safe_profiles IS 'Public view of active user profiles with non-sensitive fields only';
COMMENT ON VIEW public.public_reviews IS 'Public view of reviews with safe profile information';