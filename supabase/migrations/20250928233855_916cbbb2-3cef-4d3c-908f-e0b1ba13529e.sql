-- Add collection location and notes fields to listings table
ALTER TABLE public.listings 
ADD COLUMN collection_location TEXT,
ADD COLUMN collection_notes TEXT;

-- Update existing listings to have a default collection location if pickup is available
UPDATE public.listings 
SET collection_location = 'Home' 
WHERE pickup_available = true AND collection_location IS NULL;