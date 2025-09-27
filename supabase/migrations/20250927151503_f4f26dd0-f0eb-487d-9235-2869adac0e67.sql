-- Fix the seller_id reference issue by updating the listings table
-- This ensures proper relationship with user profiles
ALTER TABLE public.listings
ADD CONSTRAINT fk_listings_seller_id 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;