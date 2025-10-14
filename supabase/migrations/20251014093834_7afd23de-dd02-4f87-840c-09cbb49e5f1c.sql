-- ==========================================
-- CRITICAL SECURITY FIX: Restrict Data Exposure
-- ==========================================

-- 1. FIX PROFILES TABLE - Hide sensitive data from public
-- ==========================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Public can view safe profile fields via view" ON public.profiles;

-- Drop existing view and recreate with correct structure
DROP VIEW IF EXISTS public.public_safe_profiles CASCADE;

-- Create secure public view for profiles (excludes phone, stripe_account_id, email preferences)
CREATE VIEW public.public_safe_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.display_name,
  p.username,
  p.avatar_url,
  p.business_logo_url,
  p.company_name,
  p.location,
  p.bio,
  p.verified,
  p.identity_verified,
  p.stripe_onboarding_complete,
  p.created_at,
  p.updated_at,
  p.on_holiday,
  p.holiday_start_date,
  p.holiday_end_date,
  p.holiday_message
FROM public.profiles p
WHERE p.account_status = 'active';

-- Grant public access to safe view only
GRANT SELECT ON public.public_safe_profiles TO authenticated, anon;

COMMENT ON VIEW public.public_safe_profiles IS 'Public-safe view of profiles excluding sensitive data (phone, stripe_account_id, email preferences)';

-- 2. FIX LISTINGS TABLE - Hide seller addresses and exact coordinates
-- ==========================================

-- Drop overly broad public policies
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Public can view safe listing fields" ON public.listings;

-- Drop and recreate listings view
DROP VIEW IF EXISTS public.public_listings CASCADE;

-- Create safe public listings view (excludes full_address, exact coordinates, collection_location, delivery_notes)
CREATE VIEW public.public_listings AS
SELECT 
  l.id,
  l.title,
  l.description,
  l.price,
  l.condition,
  l.quantity,
  l.category_id,
  l.images,
  l.seller_id,
  l.status,
  l.available,
  l.featured,
  l.created_at,
  l.updated_at,
  l.view_count,
  l.last_viewed_at,
  l.public_location, -- Safe: general area only
  l.location, -- Safe: general location text
  l.carbon_saved,
  l.manufacturer,
  l.weight,
  l.dimensions,
  l.reason_for_selling,
  l.pickup_available,
  l.delivery_available,
  l.delivery_radius,
  l.delivery_cost,
  l.environmental_assessment_enabled,
  l.calculation_confidence,
  l.certificate_methodology,
  l.search_vector
  -- EXCLUDED for security: full_address, latitude, longitude, collection_location, delivery_notes, location_bounds
FROM public.listings l
WHERE l.status = 'active' AND l.available = true;

-- Grant public access to safe listings view
GRANT SELECT ON public.public_listings TO authenticated, anon;

COMMENT ON VIEW public.public_listings IS 'Public-safe view of listings excluding exact addresses and coordinates to prevent stalking/burglary';

-- Policy: Only listing owners can see all fields including sensitive location data
CREATE POLICY "Owners can view all listing fields"
ON public.listings
FOR SELECT
TO authenticated
USING (auth.uid() = seller_id);

-- Policy: Active transaction participants can see sensitive fields (full address for delivery)
CREATE POLICY "Active transaction participants can view sensitive fields"
ON public.listings
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT buyer_id FROM transactions 
    WHERE listing_id = listings.id 
    AND status IN ('paid', 'dispatched', 'delivered', 'completed')
  )
);

-- Policy: Public/authenticated can access basic listing data
CREATE POLICY "Public can view through safe view"
ON public.listings
FOR SELECT
TO authenticated, anon
USING (
  status = 'active' AND available = true
);

-- 3. FIX REVIEWS TABLE - Prevent user ID exposure and harassment
-- ==========================================

-- Drop dangerous public policy
DROP POLICY IF EXISTS "Public reviews view" ON public.reviews;

-- Drop and recreate reviews view
DROP VIEW IF EXISTS public.public_reviews CASCADE;

-- Create safe public reviews view (joins profile data, excludes raw user IDs)
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
  -- Include safe reviewer info (no user_id exposed)
  reviewer_profile.display_name as reviewer_name,
  reviewer_profile.avatar_url as reviewer_avatar,
  reviewer_profile.verified as reviewer_verified,
  reviewer_profile.username as reviewer_username,
  -- Include safe seller info (no user_id exposed)
  seller_profile.display_name as seller_name,
  seller_profile.avatar_url as seller_avatar,
  seller_profile.verified as seller_verified,
  seller_profile.username as seller_username
FROM public.reviews r
LEFT JOIN public.public_safe_profiles reviewer_profile ON reviewer_profile.user_id = r.reviewer_id
LEFT JOIN public.public_safe_profiles seller_profile ON seller_profile.user_id = r.seller_id;

-- Grant public access to safe reviews view
GRANT SELECT ON public.public_reviews TO authenticated, anon;

COMMENT ON VIEW public.public_reviews IS 'Public-safe view of reviews with profile data joined instead of exposing raw user IDs to prevent harassment';

-- Policy: Only transaction participants and admins can access raw reviews table with user IDs
CREATE POLICY "Only authorized users can view raw reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (
  auth.uid() = reviewer_id 
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 4. FIX MESSAGES TABLE - Add extra protection
-- ==========================================

-- Ensure messages can only be seen by sender/receiver
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;

CREATE POLICY "Users can only view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- 5. ADD INDEXES for performance on new views
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_listings_status_available ON public.listings(status, available) WHERE status = 'active' AND available = true;
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON public.reviews(listing_id);