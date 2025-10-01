-- Update any 'poor' condition values to 'fair' (closest equivalent)
UPDATE public.listings 
SET condition = 'fair' 
WHERE condition = 'poor';

-- Drop the old constraint
ALTER TABLE public.listings 
DROP CONSTRAINT IF EXISTS listings_condition_check;

-- Add the correct constraint with all condition values used in the app
ALTER TABLE public.listings 
ADD CONSTRAINT listings_condition_check 
CHECK (condition = ANY (ARRAY[
  'new'::text, 
  'like_new'::text, 
  'excellent'::text, 
  'good'::text, 
  'fair'::text, 
  'salvage'::text, 
  'parts_repair'::text
]));