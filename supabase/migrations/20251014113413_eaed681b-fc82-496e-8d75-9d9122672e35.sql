-- Fix user_roles policies: Separate SELECT from admin management policies
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

-- Public SELECT for everyone (needed for has_role function)
CREATE POLICY "User roles are viewable by everyone" ON public.user_roles
FOR SELECT USING (true);

-- Admin-only for INSERT
CREATE POLICY "Admins can insert user roles" ON public.user_roles
FOR INSERT WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- Admin-only for UPDATE
CREATE POLICY "Admins can update user roles" ON public.user_roles
FOR UPDATE USING (has_role((select auth.uid()), 'admin'::app_role));

-- Admin-only for DELETE
CREATE POLICY "Admins can delete user roles" ON public.user_roles
FOR DELETE USING (has_role((select auth.uid()), 'admin'::app_role));

-- Remove duplicate indexes for performance
-- Drop the shorter/less descriptive names
DROP INDEX IF EXISTS public.idx_listings_location_coords;
DROP INDEX IF EXISTS public.idx_messages_listing_id;
DROP INDEX IF EXISTS public.idx_offers_listing_id;
DROP INDEX IF EXISTS public.idx_reviews_seller_id;
DROP INDEX IF EXISTS public.idx_transactions_buyer_id;
DROP INDEX IF EXISTS public.idx_transactions_seller_id;

-- Drop duplicate constraint on profiles (keep the more explicit one)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;