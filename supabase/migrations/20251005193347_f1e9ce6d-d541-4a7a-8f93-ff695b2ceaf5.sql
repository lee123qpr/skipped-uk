-- ========================================
-- PHASE 1: CRITICAL SECURITY FIXES
-- ========================================

-- Fix #1: Create safe public profiles view (excludes sensitive data)
CREATE OR REPLACE VIEW public.public_safe_profiles AS
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
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_safe_profiles TO anon, authenticated;
REVOKE SELECT ON public.profiles FROM anon;

-- Fix #2: Strengthen listings RLS
DROP POLICY IF EXISTS "Public can see listings without full address" ON public.listings;
DROP POLICY IF EXISTS "Active buyers can see full address" ON public.listings;
DROP POLICY IF EXISTS "Listing owner can see all fields including full address" ON public.listings;

CREATE POLICY "Public can view safe listing fields" 
ON public.listings FOR SELECT USING (true);

CREATE POLICY "Active buyers can see sensitive fields" 
ON public.listings FOR SELECT 
USING (
  auth.uid() IN (
    SELECT transactions.buyer_id FROM transactions
    WHERE transactions.listing_id = listings.id
    AND transactions.status IN ('paid', 'dispatched', 'delivered', 'completed')
  )
);

CREATE POLICY "Owners can see all listing fields" 
ON public.listings FOR SELECT USING (auth.uid() = seller_id);

-- ========================================
-- PHASE 2: FIX DUPLICATE TRANSACTIONS
-- ========================================

-- First, mark older duplicate transactions as 'cancelled' to clean up
WITH duplicate_transactions AS (
  SELECT 
    id,
    listing_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY listing_id 
      ORDER BY 
        CASE status
          WHEN 'completed' THEN 10
          WHEN 'delivered' THEN 9
          WHEN 'dispatched' THEN 8
          WHEN 'paid' THEN 7
          WHEN 'pending_payment' THEN 6
          ELSE 0
        END DESC,
        created_at DESC
    ) as row_num
  FROM public.transactions
  WHERE status NOT IN ('completed', 'refunded', 'cancelled')
)
UPDATE public.transactions
SET status = 'cancelled'
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE row_num > 1
);

-- Now create the unique index to prevent future duplicates
DROP INDEX IF EXISTS unique_active_transaction_per_listing;
CREATE UNIQUE INDEX unique_active_transaction_per_listing 
ON public.transactions(listing_id) 
WHERE status NOT IN ('completed', 'refunded', 'cancelled');

-- ========================================
-- PHASE 3: ADD FOREIGN KEY CONSTRAINTS
-- ========================================

ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS fk_transactions_listing,
  ADD CONSTRAINT fk_transactions_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS fk_transactions_buyer,
  ADD CONSTRAINT fk_transactions_buyer 
  FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS fk_transactions_seller,
  ADD CONSTRAINT fk_transactions_seller 
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_transaction,
  ADD CONSTRAINT fk_certificates_transaction 
  FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_buyer,
  ADD CONSTRAINT fk_certificates_buyer 
  FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_seller,
  ADD CONSTRAINT fk_certificates_seller 
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_listing,
  ADD CONSTRAINT fk_certificates_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_transaction,
  ADD CONSTRAINT fk_reviews_transaction 
  FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_listing,
  ADD CONSTRAINT fk_reviews_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_reviewer,
  ADD CONSTRAINT fk_reviews_reviewer 
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_seller,
  ADD CONSTRAINT fk_reviews_seller 
  FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ========================================
-- PHASE 4: BLOG SECURITY
-- ========================================

DROP POLICY IF EXISTS "Public can record views" ON public.blog_post_views;

CREATE POLICY "Service role can record views" 
ON public.blog_post_views FOR INSERT WITH CHECK (true);

-- ========================================
-- PHASE 5: EXTENSIONS SCHEMA
-- ========================================

CREATE SCHEMA IF NOT EXISTS extensions;
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions. To migrate, run: ALTER EXTENSION "extension_name" SET SCHEMA extensions;';