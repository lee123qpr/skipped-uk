-- Optimize RLS policies: wrap auth.uid() in SELECT to prevent re-evaluation per row
-- This significantly improves query performance at scale

-- profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users view complete own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users view complete own profile" ON public.profiles
FOR SELECT USING ((select auth.uid()) = user_id);

-- user_roles table
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

CREATE POLICY "Only admins can manage user roles" ON public.user_roles
FOR ALL USING (has_role((select auth.uid()), 'admin'::app_role));

-- categories table
DROP POLICY IF EXISTS "Only admins can manage categories" ON public.categories;

CREATE POLICY "Only admins can manage categories" ON public.categories
FOR ALL USING (has_role((select auth.uid()), 'admin'::app_role));

-- listings table
DROP POLICY IF EXISTS "Users can create their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;

CREATE POLICY "Users can create their own listings" ON public.listings
FOR INSERT WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Users can update their own listings" ON public.listings
FOR UPDATE USING ((select auth.uid()) = seller_id);

CREATE POLICY "Users can delete their own listings" ON public.listings
FOR DELETE USING ((select auth.uid()) = seller_id);

-- favourites table
DROP POLICY IF EXISTS "Users can view their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can create their own favourites" ON public.favourites;
DROP POLICY IF EXISTS "Users can delete their own favourites" ON public.favourites;

CREATE POLICY "Users can view their own favourites" ON public.favourites
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own favourites" ON public.favourites
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own favourites" ON public.favourites
FOR DELETE USING ((select auth.uid()) = user_id);

-- offers table
DROP POLICY IF EXISTS "Users can view offers they made or received" ON public.offers;
DROP POLICY IF EXISTS "Users can create offers as buyers" ON public.offers;
DROP POLICY IF EXISTS "Buyers can update their own offers" ON public.offers;
DROP POLICY IF EXISTS "Sellers can update offers on their listings" ON public.offers;

CREATE POLICY "Users can view offers they made or received" ON public.offers
FOR SELECT USING (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id));

CREATE POLICY "Users can create offers as buyers" ON public.offers
FOR INSERT WITH CHECK ((select auth.uid()) = buyer_id);

CREATE POLICY "Buyers can update their own offers" ON public.offers
FOR UPDATE USING ((select auth.uid()) = buyer_id);

CREATE POLICY "Sellers can update offers on their listings" ON public.offers
FOR UPDATE USING ((select auth.uid()) = seller_id);

-- messages table
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.messages;

CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

CREATE POLICY "Users can update read status of received messages" ON public.messages
FOR UPDATE USING ((select auth.uid()) = receiver_id);

-- saved_searches table
DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can create their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_searches;

CREATE POLICY "Users can view their own saved searches" ON public.saved_searches
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own saved searches" ON public.saved_searches
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own saved searches" ON public.saved_searches
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own saved searches" ON public.saved_searches
FOR DELETE USING ((select auth.uid()) = user_id);

-- blog_categories table
DROP POLICY IF EXISTS "Admins can manage categories" ON public.blog_categories;

CREATE POLICY "Admins can manage categories" ON public.blog_categories
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- blog_posts table
DROP POLICY IF EXISTS "Admins can view all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.blog_posts;

CREATE POLICY "Admins can view all posts" ON public.blog_posts
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can create posts" ON public.blog_posts
FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update posts" ON public.blog_posts
FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete posts" ON public.blog_posts
FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- blog_post_categories table
DROP POLICY IF EXISTS "Admins can manage post categories" ON public.blog_post_categories;

CREATE POLICY "Admins can manage post categories" ON public.blog_post_categories
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- transactions table
DROP POLICY IF EXISTS "Users can view transactions they're involved in" ON public.transactions;
DROP POLICY IF EXISTS "Parties can update transaction status" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "Users can view transactions they're involved in" ON public.transactions
FOR SELECT USING (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id));

CREATE POLICY "Parties can update transaction status" ON public.transactions
FOR UPDATE USING (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id));

CREATE POLICY "Admins can view all transactions" ON public.transactions
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

-- reviews table
DROP POLICY IF EXISTS "Users can create transaction-based reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their transaction reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their transaction reviews" ON public.reviews;

CREATE POLICY "Users can create transaction-based reviews" ON public.reviews
FOR INSERT WITH CHECK (
  ((select auth.uid()) = reviewer_id) AND 
  (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = reviews.transaction_id
      AND transactions.status = 'completed'::text
      AND ((((select auth.uid()) = transactions.buyer_id) AND (reviews.reviewer_type = 'buyer'::text))
        OR (((select auth.uid()) = transactions.seller_id) AND (reviews.reviewer_type = 'seller'::text)))
  ))
);

CREATE POLICY "Users can update their transaction reviews" ON public.reviews
FOR UPDATE USING ((select auth.uid()) = reviewer_id);

CREATE POLICY "Users can delete their transaction reviews" ON public.reviews
FOR DELETE USING ((select auth.uid()) = reviewer_id);

-- transaction_audit_log table
DROP POLICY IF EXISTS "Users can view audit logs for their transactions" ON public.transaction_audit_log;

CREATE POLICY "Users can view audit logs for their transactions" ON public.transaction_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transaction_audit_log.transaction_id
      AND ((transactions.buyer_id = (select auth.uid())) OR (transactions.seller_id = (select auth.uid())))
  )
);

-- disputes table
DROP POLICY IF EXISTS "Parties and admins can view disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;

CREATE POLICY "Parties and admins can view disputes" ON public.disputes
FOR SELECT USING (
  (raised_by_id = (select auth.uid())) OR 
  (against_id = (select auth.uid())) OR 
  has_role((select auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Users can create disputes" ON public.disputes
FOR INSERT WITH CHECK (
  (raised_by_id = (select auth.uid())) AND
  (EXISTS (
    SELECT 1 FROM transactions
    WHERE transactions.id = transactions.dispute_id
      AND ((transactions.buyer_id = (select auth.uid())) OR (transactions.seller_id = (select auth.uid())))
  ))
);

CREATE POLICY "Admins can update disputes" ON public.disputes
FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role));

-- dispute_evidence table
DROP POLICY IF EXISTS "Parties and admins can view evidence" ON public.dispute_evidence;
DROP POLICY IF EXISTS "Users can upload evidence" ON public.dispute_evidence;

CREATE POLICY "Parties and admins can view evidence" ON public.dispute_evidence
FOR SELECT USING (
  (uploaded_by_id = (select auth.uid())) OR 
  has_role((select auth.uid()), 'admin'::app_role) OR
  (EXISTS (
    SELECT 1 FROM disputes
    WHERE disputes.id = dispute_evidence.dispute_id
      AND ((disputes.raised_by_id = (select auth.uid())) OR (disputes.against_id = (select auth.uid())))
  ))
);

CREATE POLICY "Users can upload evidence" ON public.dispute_evidence
FOR INSERT WITH CHECK (
  (uploaded_by_id = (select auth.uid())) AND
  (EXISTS (
    SELECT 1 FROM disputes
    WHERE disputes.id = dispute_evidence.dispute_id
      AND ((disputes.raised_by_id = (select auth.uid())) OR (disputes.against_id = (select auth.uid())))
  ))
);

-- blog_post_feedback table
DROP POLICY IF EXISTS "Admins can view feedback" ON public.blog_post_feedback;

CREATE POLICY "Admins can view feedback" ON public.blog_post_feedback
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

-- site_banners table
DROP POLICY IF EXISTS "Admins can view all banners" ON public.site_banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.site_banners;

CREATE POLICY "Admins can view all banners" ON public.site_banners
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can manage banners" ON public.site_banners
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- platform_settings table
DROP POLICY IF EXISTS "Admins can manage settings" ON public.platform_settings;

CREATE POLICY "Admins can manage settings" ON public.platform_settings
FOR ALL 
USING (has_role((select auth.uid()), 'admin'::app_role))
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- environmental_certificates table
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.environmental_certificates;

CREATE POLICY "Users can view their own certificates" ON public.environmental_certificates
FOR SELECT USING (((select auth.uid()) = buyer_id) OR ((select auth.uid()) = seller_id));

-- blog_post_views table
DROP POLICY IF EXISTS "Admin analytics access" ON public.blog_post_views;

CREATE POLICY "Admin analytics access" ON public.blog_post_views
FOR SELECT USING (has_role((select auth.uid()), 'admin'::app_role));