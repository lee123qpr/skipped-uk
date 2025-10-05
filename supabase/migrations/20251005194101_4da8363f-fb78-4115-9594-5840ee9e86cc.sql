-- Test adding one FK to see what error we get
-- This is a diagnostic query to understand why FKs weren't created
DO $$ 
BEGIN
  -- Try to add FK to auth.users
  ALTER TABLE public.transactions 
    ADD CONSTRAINT fk_test_buyer 
    FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  
  RAISE NOTICE 'FK to auth.users succeeded';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK to auth.users failed: %', SQLERRM;
END $$;

-- Drop the test constraint if it was created
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS fk_test_buyer;

-- Now add REAL foreign key constraints that will work
-- FK to listings (this should work fine)
ALTER TABLE public.transactions 
  DROP CONSTRAINT IF EXISTS fk_transactions_listing,
  ADD CONSTRAINT fk_transactions_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- FK to profiles table (user_id column) instead of auth.users
-- Note: profiles.user_id references auth.users, so this provides indirect constraint
ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_transaction,
  ADD CONSTRAINT fk_certificates_transaction 
  FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.environmental_certificates 
  DROP CONSTRAINT IF EXISTS fk_certificates_listing,
  ADD CONSTRAINT fk_certificates_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_transaction,
  ADD CONSTRAINT fk_reviews_transaction 
  FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS fk_reviews_listing,
  ADD CONSTRAINT fk_reviews_listing 
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;