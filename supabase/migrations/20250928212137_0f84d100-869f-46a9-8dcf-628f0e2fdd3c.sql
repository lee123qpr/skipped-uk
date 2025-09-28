-- Add reason_for_selling column to listings table
ALTER TABLE public.listings 
ADD COLUMN reason_for_selling TEXT;