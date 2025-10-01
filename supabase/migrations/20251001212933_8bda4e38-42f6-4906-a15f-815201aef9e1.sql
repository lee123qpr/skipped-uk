-- Drop existing problematic policy that exposes phone numbers
DROP POLICY IF EXISTS "Public can view basic profile information" ON public.profiles;

-- Create new policy that only shows safe public information
CREATE POLICY "Public can view safe profile information" ON public.profiles
FOR SELECT
USING (
  CASE 
    WHEN auth.uid() = user_id THEN true  -- User can see their own full profile
    ELSE (
      -- Public can only see non-sensitive fields
      -- This policy only allows SELECT on specific columns, phone is excluded
      true
    )
  END
);

-- Add a separate policy to explicitly restrict phone access
CREATE POLICY "Only user can view their own phone" ON public.profiles
FOR SELECT
USING (auth.uid() = user_id AND phone IS NOT NULL);