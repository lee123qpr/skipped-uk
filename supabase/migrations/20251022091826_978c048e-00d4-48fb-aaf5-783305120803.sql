-- Fix profiles RLS policy to allow viewing seller profiles for public listings
-- This allows the public_safe_profiles view to work correctly with SECURITY INVOKER

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "View profiles" ON public.profiles;

-- Create new policy that allows:
-- 1. Users to view their own profile
-- 2. Admins to view all profiles
-- 3. Anyone to view profiles of sellers with active listings (for marketplace functionality)
CREATE POLICY "View profiles"
ON public.profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = user_id
  OR
  -- Admin access
  has_role(auth.uid(), 'admin')
  OR
  -- Public access to sellers with active listings
  (
    account_status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.listings
      WHERE listings.seller_id = profiles.user_id
      AND listings.status = 'active'
      AND listings.available = true
    )
  )
  OR
  -- Public access to users involved in completed transactions (for reviews)
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE (transactions.buyer_id = profiles.user_id OR transactions.seller_id = profiles.user_id)
    AND transactions.status IN ('completed', 'delivered', 'dispatched', 'paid')
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "View profiles" ON public.profiles IS 'Allows viewing own profile, admin access, and public access to active seller profiles and transaction participants';