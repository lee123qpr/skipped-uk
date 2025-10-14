-- Remove all duplicate/old policies causing multiple permissive policy warnings

-- blog_categories: Remove old admin policy (consolidated into "Everyone can view categories")
DROP POLICY IF EXISTS "Admins can manage categories" ON public.blog_categories;

-- blog_post_categories: Remove old admin policy
DROP POLICY IF EXISTS "Admins can manage post categories" ON public.blog_post_categories;

-- blog_posts: Remove old individual policies (consolidated into "View blog posts")
DROP POLICY IF EXISTS "Admins can view all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;

-- categories: Remove old admin policy (consolidated into "Categories are viewable by everyone")
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.categories;

-- environmental_certificates: Remove old individual policy
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.environmental_certificates;

-- listings: Remove old individual policies (consolidated into "View listings")
DROP POLICY IF EXISTS "Active buyers can see sensitive fields" ON public.listings;
DROP POLICY IF EXISTS "Owners can see all listing fields" ON public.listings;

-- messages: Consolidate INSERT policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can send system messages" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  ((select auth.uid()) = sender_id) AND (
    -- Regular users can send regular messages
    (message_type != 'system'::message_type) OR
    -- Admins can send system messages
    (message_type = 'system'::message_type AND listing_id IS NULL AND has_role((select auth.uid()), 'admin'::app_role))
  )
);

-- offers: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Buyers can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Sellers can update offers on their listings" ON public.offers;

CREATE POLICY "Update offers" ON public.offers
FOR UPDATE USING (
  ((select auth.uid()) = buyer_id) OR 
  ((select auth.uid()) = seller_id)
);

-- platform_settings: Remove old admin policy
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;

-- profiles: Remove old individual policy
DROP POLICY IF EXISTS "Users view complete own profile" ON public.profiles;

-- site_banners: Remove old admin policies
DROP POLICY IF EXISTS "Admins can view all banners" ON public.site_banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.site_banners;

-- transactions: Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view transactions they're involved in" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "View transactions" ON public.transactions
FOR SELECT USING (
  (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id)) OR
  has_role((select auth.uid()), 'admin'::app_role)
);

-- user_roles: Consolidate SELECT policies
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

CREATE POLICY "User roles are viewable by everyone" ON public.user_roles
FOR SELECT USING (true);

CREATE POLICY "Only admins can manage user roles" ON public.user_roles
FOR ALL USING (has_role((select auth.uid()), 'admin'::app_role));

COMMENT ON POLICY "Users can send messages" ON public.messages IS 'Consolidated: users send regular messages, admins send system messages';
COMMENT ON POLICY "Update offers" ON public.offers IS 'Consolidated: buyers and sellers can update offers';
COMMENT ON POLICY "View transactions" ON public.transactions IS 'Consolidated: participants or admin can view';
COMMENT ON POLICY "User roles are viewable by everyone" ON public.user_roles IS 'Public SELECT for role checking';
COMMENT ON POLICY "Only admins can manage user roles" ON public.user_roles IS 'Admin-only INSERT/UPDATE/DELETE';