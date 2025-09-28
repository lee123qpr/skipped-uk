-- Add location-related columns to listings table for enhanced search with privacy
ALTER TABLE public.listings 
ADD COLUMN full_address TEXT, -- Private, only visible to listing owner
ADD COLUMN public_location TEXT, -- Public display (postcode/town only)
ADD COLUMN latitude DECIMAL(10, 8), -- For map positioning
ADD COLUMN longitude DECIMAL(11, 8), -- For map positioning
ADD COLUMN location_bounds JSONB; -- For area-based searches

-- Create index for efficient geographic queries
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON public.listings USING btree (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_public_location ON public.listings USING btree (public_location);

-- Update RLS policies to ensure full_address is only visible to listing owners
CREATE POLICY "Users can only see their own full address" 
ON public.listings 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() = seller_id THEN true
    ELSE full_address IS NULL
  END
);

-- Create saved searches table for enhanced discovery
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- Stores search parameters (category, location, price range, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  notification_enabled BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on saved searches
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Create policies for saved searches
CREATE POLICY "Users can view their own saved searches" 
ON public.saved_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches" 
ON public.saved_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches" 
ON public.saved_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches" 
ON public.saved_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON public.saved_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();