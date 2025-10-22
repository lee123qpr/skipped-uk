-- Convert Security Definer views to Security Invoker
-- This ensures views respect RLS policies instead of bypassing them

-- Drop and recreate public_listings view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_listings;
CREATE VIEW public.public_listings 
WITH (security_invoker=true)
AS
SELECT 
  id,
  seller_id,
  category_id,
  title,
  description,
  price,
  quantity,
  condition,
  images,
  location,
  public_location,
  status,
  available,
  featured,
  delivery_available,
  pickup_available,
  delivery_radius,
  delivery_cost,
  dimensions,
  weight,
  manufacturer,
  carbon_saved,
  calculation_confidence,
  environmental_assessment_enabled,
  certificate_methodology,
  view_count,
  last_viewed_at,
  reason_for_selling,
  search_vector,
  created_at,
  updated_at
FROM public.listings
WHERE status = 'active' AND available = true;

-- Drop and recreate public_reviews view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;
CREATE VIEW public.public_reviews
WITH (security_invoker=true)
AS
SELECT 
  r.id,
  r.listing_id,
  r.transaction_id,
  r.rating,
  r.title,
  r.comment,
  r.reviewer_type,
  r.seller_reply,
  r.seller_reply_created_at,
  r.created_at,
  r.updated_at,
  -- Reviewer info (safe fields only)
  r.reviewer_id,
  reviewer.display_name as reviewer_name,
  reviewer.username as reviewer_username,
  reviewer.avatar_url as reviewer_avatar,
  reviewer.verified as reviewer_verified,
  -- Seller info (safe fields only)
  r.seller_id,
  seller.display_name as seller_name,
  seller.username as seller_username,
  seller.avatar_url as seller_avatar,
  seller.verified as seller_verified
FROM public.reviews r
LEFT JOIN public.profiles reviewer ON r.reviewer_id = reviewer.user_id
LEFT JOIN public.profiles seller ON r.seller_id = seller.user_id;

-- Drop and recreate public_safe_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_safe_profiles;
CREATE VIEW public.public_safe_profiles
WITH (security_invoker=true)
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
-- Only show profiles of users who have active listings or completed transactions
WHERE account_status = 'active';

-- Add helpful comments
COMMENT ON VIEW public.public_listings IS 'Public view of active listings with SECURITY INVOKER to respect RLS policies';
COMMENT ON VIEW public.public_reviews IS 'Public view of reviews with SECURITY INVOKER to respect RLS policies';
COMMENT ON VIEW public.public_safe_profiles IS 'Public view of safe profile data with SECURITY INVOKER to respect RLS policies';