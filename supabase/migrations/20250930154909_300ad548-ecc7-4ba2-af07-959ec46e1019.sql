-- Remove allow_offers and minimum_offer_percentage columns from listings table
ALTER TABLE public.listings 
DROP COLUMN IF EXISTS allow_offers,
DROP COLUMN IF EXISTS minimum_offer_percentage;