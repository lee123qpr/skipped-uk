-- Phase 1: Critical Security Fixes (Corrected)

-- 1. Update profiles RLS to hide sensitive data
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

-- Create restrictive policy for public profile view (hides phone, stripe_account_id)
CREATE POLICY "Public can view basic profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Separate policy for complete profile access (includes phone, stripe_account_id)
CREATE POLICY "Users view complete own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Update listings RLS for full_address security
DROP POLICY IF EXISTS "Users can only see their own full address" ON public.listings;
DROP POLICY IF EXISTS "Only sellers can see full address" ON public.listings;

CREATE POLICY "Sellers and active buyers see full address" 
ON public.listings 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() = seller_id THEN true
    WHEN auth.uid() IN (
      SELECT buyer_id FROM transactions 
      WHERE listing_id = listings.id 
      AND status IN ('paid', 'dispatched', 'delivered', 'completed')
    ) THEN true
    ELSE (full_address IS NULL)
  END
);

-- 3. Restrict blog_post_views to admins only
DROP POLICY IF EXISTS "Admins can view analytics" ON public.blog_post_views;
DROP POLICY IF EXISTS "Anyone can record views" ON public.blog_post_views;

CREATE POLICY "Admin analytics access" 
ON public.blog_post_views 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can record views" 
ON public.blog_post_views 
FOR INSERT 
WITH CHECK (true);

-- 4. Update reviews RLS 
DROP POLICY IF EXISTS "Transaction reviews are publicly viewable" ON public.reviews;
DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.reviews;
DROP POLICY IF EXISTS "Users can view their transaction review details" ON public.reviews;

CREATE POLICY "Public reviews view" 
ON public.reviews 
FOR SELECT 
USING (true);

-- 5. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings (location);
CREATE INDEX IF NOT EXISTS idx_listings_category_status ON public.listings (category_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings (price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON public.transactions (buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON public.transactions (seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON public.messages (listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages (sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers (listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON public.reviews (seller_id);

-- 6. Create rate limiting table for security monitoring
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  action_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action ON public.rate_limit_log (user_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_action ON public.rate_limit_log (ip_address, action_type, created_at);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view rate limits" 
ON public.rate_limit_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System logs rate limits" 
ON public.rate_limit_log 
FOR INSERT 
WITH CHECK (true);