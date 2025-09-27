-- Ensure clean relationship for listing seller -> profiles.user_id
-- 1) Drop any old FK that may point to auth.users
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

-- 2) Ensure profiles.user_id is unique so it can be referenced
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 3) Create the correct FK from listings.seller_id -> profiles.user_id
ALTER TABLE public.listings 
ADD CONSTRAINT listings_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 4) Index for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
