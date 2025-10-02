-- Add environmental assessment columns to listings table
ALTER TABLE public.listings
ADD COLUMN environmental_assessment_enabled boolean DEFAULT false,
ADD COLUMN calculation_confidence text CHECK (calculation_confidence IN ('high', 'medium', 'low')),
ADD COLUMN certificate_methodology jsonb DEFAULT '{}'::jsonb;

-- Add business logo to profiles table
ALTER TABLE public.profiles
ADD COLUMN business_logo_url text;

-- Create environmental_certificates table
CREATE TABLE public.environmental_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  certificate_reference text UNIQUE NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  material_type text NOT NULL,
  material_weight_kg numeric NOT NULL,
  carbon_saved_kg numeric NOT NULL,
  landfill_diverted_kg numeric NOT NULL,
  calculation_method text NOT NULL CHECK (calculation_method IN ('provided_weight', 'estimated')),
  carbon_factor_source text NOT NULL,
  methodology_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer_certificate_url text,
  seller_certificate_url text,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on environmental_certificates
ALTER TABLE public.environmental_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for environmental_certificates
CREATE POLICY "Users can view their own certificates"
ON public.environmental_certificates
FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can create certificates"
ON public.environmental_certificates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can verify certificates by reference"
ON public.environmental_certificates
FOR SELECT
USING (certificate_reference IS NOT NULL);

-- Create storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for business-logos bucket
CREATE POLICY "Users can upload their own business logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own business logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'business-logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'business-logos');

-- Create storage bucket for environmental certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('environmental-certificates', 'environmental-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for environmental-certificates bucket
CREATE POLICY "Users can view their own certificates"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'environmental-certificates' AND
  (
    auth.uid()::text = split_part((storage.foldername(name))[1], '-', 1) OR
    auth.uid()::text = split_part((storage.foldername(name))[1], '-', 2)
  )
);

CREATE POLICY "System can upload certificates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'environmental-certificates');

-- Add indexes for performance
CREATE INDEX idx_certificates_buyer ON public.environmental_certificates(buyer_id);
CREATE INDEX idx_certificates_seller ON public.environmental_certificates(seller_id);
CREATE INDEX idx_certificates_transaction ON public.environmental_certificates(transaction_id);
CREATE INDEX idx_certificates_reference ON public.environmental_certificates(certificate_reference);

-- Add comments for documentation
COMMENT ON TABLE public.environmental_certificates IS 'Stores environmental impact certificates issued after completed transactions';
COMMENT ON COLUMN public.listings.environmental_assessment_enabled IS 'Whether seller opted into environmental certification';
COMMENT ON COLUMN public.listings.calculation_confidence IS 'Confidence level of carbon calculation: high (provided weight), medium (estimated), low (rough estimate)';
COMMENT ON COLUMN public.listings.certificate_methodology IS 'Stores calculation methodology details for certificate generation';