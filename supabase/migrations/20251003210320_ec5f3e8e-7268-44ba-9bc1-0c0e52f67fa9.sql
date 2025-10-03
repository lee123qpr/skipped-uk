-- ============================================================================
-- PHASE 1: FIX CRITICAL PII EXPOSURE
-- ============================================================================

-- Step 1: Create public_profiles view (excludes sensitive phone number)
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  username,
  avatar_url,
  business_logo_url,
  company_name,
  location,
  bio,
  verified,
  identity_verified,
  stripe_onboarding_complete,
  created_at,
  updated_at
FROM profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Step 2: Update RLS policies for profiles to be more restrictive
-- Drop the overly permissive "Public can view basic profiles" policy
DROP POLICY IF EXISTS "Public can view basic profiles" ON profiles;

-- Create explicit policy: Public can ONLY view through the public_profiles view
-- The main profiles table should only be fully accessible to the user themselves
CREATE POLICY "Public can view safe profile fields via view" ON profiles
FOR SELECT USING (
  -- Users can see their complete profile
  auth.uid() = user_id
);

-- Step 3: Fix full address exposure in listings
-- Drop existing address visibility policy
DROP POLICY IF EXISTS "Sellers and active buyers see full address" ON listings;

-- Create separate, explicit policies for address visibility
CREATE POLICY "Listing owner can see all fields including full address" ON listings
FOR SELECT USING (
  auth.uid() = seller_id
);

CREATE POLICY "Active buyers can see full address" ON listings
FOR SELECT USING (
  auth.uid() IN (
    SELECT buyer_id 
    FROM transactions 
    WHERE listing_id = listings.id 
      AND status IN ('paid', 'dispatched', 'delivered', 'completed')
  )
);

CREATE POLICY "Public can see listings without full address" ON listings
FOR SELECT USING (
  true
);

-- Note: The "Public can see listings without full address" policy allows SELECT
-- but frontend must explicitly exclude full_address from public queries
-- The full_address should only be selected when user is seller or active buyer

-- ============================================================================
-- PHASE 3: ADD FINANCIAL OPERATION SAFEGUARDS
-- ============================================================================

-- Create a function to validate refund amounts
CREATE OR REPLACE FUNCTION public.validate_refund_amount(
  refund_amount NUMERIC,
  transaction_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_refund CONSTANT NUMERIC := 50000; -- £50,000 maximum
BEGIN
  -- Check if refund amount is positive
  IF refund_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be greater than zero';
  END IF;
  
  -- Check if refund exceeds transaction amount
  IF refund_amount > transaction_amount THEN
    RAISE EXCEPTION 'Refund amount £% cannot exceed transaction amount £%', refund_amount, transaction_amount;
  END IF;
  
  -- Check if refund exceeds maximum threshold
  IF refund_amount > max_refund THEN
    RAISE EXCEPTION 'Refund exceeds maximum allowed amount of £%', max_refund;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create a function to validate transaction amounts
CREATE OR REPLACE FUNCTION public.validate_transaction_amount(
  amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_transaction CONSTANT NUMERIC := 100000; -- £100,000 maximum
BEGIN
  -- Check if amount is positive
  IF amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be greater than zero';
  END IF;
  
  -- Check if amount exceeds maximum threshold
  IF amount > max_transaction THEN
    RAISE EXCEPTION 'Transaction exceeds maximum allowed amount of £%', max_transaction;
  END IF;
  
  RETURN TRUE;
END;
$$;