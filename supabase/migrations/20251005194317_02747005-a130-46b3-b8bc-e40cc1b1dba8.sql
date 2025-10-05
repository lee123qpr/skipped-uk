-- Create FK constraints one at a time with explicit checks
-- FK: transactions -> listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_listing'
  ) THEN
    ALTER TABLE public.transactions 
      ADD CONSTRAINT fk_transactions_listing 
      FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK: transactions -> listings';
  END IF;
END $$;

-- FK: environmental_certificates -> transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_certificates_transaction'
  ) THEN
    ALTER TABLE public.environmental_certificates 
      ADD CONSTRAINT fk_certificates_transaction 
      FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK: certificates -> transactions';
  END IF;
END $$;

-- FK: environmental_certificates -> listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_certificates_listing'
  ) THEN
    ALTER TABLE public.environmental_certificates 
      ADD CONSTRAINT fk_certificates_listing 
      FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK: certificates -> listings';
  END IF;
END $$;

-- FK: reviews -> transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_reviews_transaction'
  ) THEN
    ALTER TABLE public.reviews 
      ADD CONSTRAINT fk_reviews_transaction 
      FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK: reviews -> transactions';
  END IF;
END $$;

-- FK: reviews -> listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_reviews_listing'
  ) THEN
    ALTER TABLE public.reviews 
      ADD CONSTRAINT fk_reviews_listing 
      FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created FK: reviews -> listings';
  END IF;
END $$;