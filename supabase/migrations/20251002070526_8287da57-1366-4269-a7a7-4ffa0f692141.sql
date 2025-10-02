-- Add identity verification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;