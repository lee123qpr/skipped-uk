-- Fix remaining auth.uid() performance issues and consolidate multiple permissive policies

-- ============================================================================
-- Part 1: Fix remaining auth.uid() issues
-- ============================================================================

-- rate_limit_log
DROP POLICY IF EXISTS "Admins view rate limits" ON public.rate_limit_log;
CREATE POLICY "Admins view rate limits" ON public.rate_limit_log
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING ((select auth.uid()) = user_id);

-- messages
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send system messages" ON public.messages;

CREATE POLICY "Users can only view their own messages" ON public.messages
FOR SELECT USING (((select auth.uid()) = sender_id) OR ((select auth.uid()) = receiver_id));

CREATE POLICY "Admins can send system messages" ON public.messages
FOR INSERT WITH CHECK (
  ((select auth.uid()) = sender_id) AND 
  (message_type = 'system'::message_type) AND 
  (listing_id IS NULL) AND 
  has_role((select auth.uid()), 'admin'::app_role)
);

-- listings - fix remaining policies
DROP POLICY IF EXISTS "Active buyers can see sensitive fields" ON public.listings;
DROP POLICY IF EXISTS "Owners can see all listing fields" ON public.listings;
DROP POLICY IF EXISTS "Owners can view all listing fields" ON public.listings;
DROP POLICY IF EXISTS "Active transaction participants can view sensitive fields" ON public.listings;

CREATE POLICY "Owners can see all listing fields" ON public.listings
FOR SELECT USING ((select auth.uid()) = seller_id);

CREATE POLICY "Active buyers can see sensitive fields" ON public.listings
FOR SELECT USING (
  (select auth.uid()) IN (
    SELECT transactions.buyer_id
    FROM transactions
    WHERE transactions.listing_id = listings.id
      AND transactions.status = ANY (ARRAY['paid'::text, 'dispatched'::text, 'delivered'::text, 'completed'::text])
  )
);

-- account_deletion_requests
DROP POLICY IF EXISTS "Users can view their own deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can create deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Users can cancel their deletion requests" ON public.account_deletion_requests;
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON public.account_deletion_requests;

CREATE POLICY "Users can create deletion requests" ON public.account_deletion_requests
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can cancel their deletion requests" ON public.account_deletion_requests
FOR UPDATE 
USING (((select auth.uid()) = user_id) AND (status = 'pending'::text))
WITH CHECK (status = 'cancelled'::text);

-- admin_actions
DROP POLICY IF EXISTS "Admins can view admin actions" ON public.admin_actions;
DROP POLICY IF EXISTS "Admins can create admin actions" ON public.admin_actions;

CREATE POLICY "Admins can view admin actions" ON public.admin_actions
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can create admin actions" ON public.admin_actions
FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- blog_posts - fix Authors policy
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;

CREATE POLICY "Authors can view their own posts" ON public.blog_posts
FOR SELECT USING (((select auth.uid()) = author_id) OR has_role((select auth.uid()), 'admin'::app_role));

-- reviews
DROP POLICY IF EXISTS "Only authorized users can view raw reviews" ON public.reviews;

CREATE POLICY "Only authorized users can view raw reviews" ON public.reviews
FOR SELECT USING (
  ((select auth.uid()) = reviewer_id) OR 
  ((select auth.uid()) = seller_id) OR 
  has_role((select auth.uid()), 'admin'::app_role)
);

-- ============================================================================
-- Part 2: Consolidate multiple permissive policies into single policies
-- ============================================================================

-- account_deletion_requests: Consolidate SELECT policies
CREATE POLICY "View deletion requests" ON public.account_deletion_requests
FOR SELECT USING (
  ((select auth.uid()) = user_id) OR 
  has_role((select auth.uid()), 'admin'::app_role)
);

-- blog_categories: Consolidate SELECT policies
DROP POLICY IF EXISTS "Everyone can view categories" ON public.blog_categories;

CREATE POLICY "Everyone can view categories" ON public.blog_categories
FOR SELECT USING (true);

-- blog_post_categories: Consolidate SELECT policies
DROP POLICY IF EXISTS "Everyone can view post categories" ON public.blog_post_categories;

CREATE POLICY "Everyone can view post categories" ON public.blog_post_categories
FOR SELECT USING (true);

-- blog_posts: Consolidate SELECT policies
DROP POLICY IF EXISTS "Everyone can view published posts" ON public.blog_posts;

CREATE POLICY "View blog posts" ON public.blog_posts
FOR SELECT USING (
  (status = 'published'::blog_post_status) OR
  ((select auth.uid()) = author_id) OR
  has_role((select auth.uid()), 'admin'::app_role)
);

-- categories: Consolidate SELECT policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

CREATE POLICY "Categories are viewable by everyone" ON public.categories
FOR SELECT USING (true);

-- environmental_certificates: Consolidate SELECT policies
DROP POLICY IF EXISTS "Public can verify certificates by reference" ON public.environmental_certificates;

CREATE POLICY "View environmental certificates" ON public.environmental_certificates
FOR SELECT USING (
  (certificate_reference IS NOT NULL) OR
  ((select auth.uid()) = buyer_id) OR 
  ((select auth.uid()) = seller_id)
);

-- listings: Consolidate SELECT policies (most complex)
DROP POLICY IF EXISTS "Public can view through safe view" ON public.listings;

CREATE POLICY "View listings" ON public.listings
FOR SELECT USING (
  -- Public can see active listings
  ((status = 'active'::text) AND (available = true)) OR
  -- Owners can see their own listings
  ((select auth.uid()) = seller_id) OR
  -- Active buyers with paid transactions
  ((select auth.uid()) IN (
    SELECT transactions.buyer_id
    FROM transactions
    WHERE transactions.listing_id = listings.id
      AND transactions.status = ANY (ARRAY['paid'::text, 'dispatched'::text, 'delivered'::text, 'completed'::text])
  ))
);

-- profiles: Consolidate SELECT policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "View profiles" ON public.profiles
FOR SELECT USING (
  ((select auth.uid()) = user_id) OR
  has_role((select auth.uid()), 'admin'::app_role)
);

-- site_banners: Consolidate SELECT policies  
DROP POLICY IF EXISTS "Everyone can view active banners" ON public.site_banners;

CREATE POLICY "View banners" ON public.site_banners
FOR SELECT USING (
  (is_active = true AND 
   (start_date IS NULL OR start_date <= now()) AND 
   (end_date IS NULL OR end_date >= now())) OR
  has_role((select auth.uid()), 'admin'::app_role)
);

-- platform_settings: Consolidate SELECT policies
DROP POLICY IF EXISTS "Everyone can view settings" ON public.platform_settings;

CREATE POLICY "View settings" ON public.platform_settings
FOR SELECT USING (true);

-- user_roles: Already has single consolidated policy
-- No change needed

-- reviews: Already updated above with consolidated policy

COMMENT ON POLICY "View deletion requests" ON public.account_deletion_requests IS 'Consolidated: users see own, admins see all';
COMMENT ON POLICY "View blog posts" ON public.blog_posts IS 'Consolidated: published visible to all, drafts to authors/admins';
COMMENT ON POLICY "View environmental certificates" ON public.environmental_certificates IS 'Consolidated: public verification or participants';
COMMENT ON POLICY "View listings" ON public.listings IS 'Consolidated: public active listings, owners see all, buyers see purchased';
COMMENT ON POLICY "View profiles" ON public.profiles IS 'Consolidated: own profile or admin';
COMMENT ON POLICY "View banners" ON public.site_banners IS 'Consolidated: active banners or admin';
COMMENT ON POLICY "Only authorized users can view raw reviews" ON public.reviews IS 'Consolidated: participants or admin';