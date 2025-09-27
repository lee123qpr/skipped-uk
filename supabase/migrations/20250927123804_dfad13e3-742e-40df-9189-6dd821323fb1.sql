-- Create storage bucket for listing media
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-media', 'listing-media', true);

-- Create RLS policies for listing media storage
CREATE POLICY "Users can view all listing media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'listing-media');

CREATE POLICY "Authenticated users can upload listing media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'listing-media' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own listing media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'listing-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own listing media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'listing-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add delivery and pickup options to listings table
ALTER TABLE public.listings 
ADD COLUMN delivery_available boolean DEFAULT false,
ADD COLUMN pickup_available boolean DEFAULT true,
ADD COLUMN delivery_radius integer,
ADD COLUMN delivery_cost numeric,
ADD COLUMN dimensions jsonb,
ADD COLUMN weight numeric,
ADD COLUMN allow_offers boolean DEFAULT false,
ADD COLUMN minimum_offer_percentage integer DEFAULT 90;