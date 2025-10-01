-- Add delivery_notes column to listings table
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;