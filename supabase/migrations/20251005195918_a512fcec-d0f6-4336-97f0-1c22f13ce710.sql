-- Add holiday/away mode columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS on_holiday boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS holiday_message text,
ADD COLUMN IF NOT EXISTS holiday_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS holiday_end_date timestamp with time zone;

-- Add notification preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_new_message boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_new_offer boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_transaction_update boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_review_reminder boolean DEFAULT true;

-- Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamp with time zone DEFAULT now(),
  reason text,
  scheduled_deletion_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on account_deletion_requests
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own deletion requests
CREATE POLICY "Users can view their own deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: Users can create their own deletion requests
CREATE POLICY "Users can create deletion requests"
ON public.account_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS: Users can cancel their own deletion requests
CREATE POLICY "Users can cancel their deletion requests"
ON public.account_deletion_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (status = 'cancelled');

-- RLS: Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if user is on holiday
CREATE OR REPLACE FUNCTION public.is_user_on_holiday(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = $1
      AND on_holiday = true
      AND (holiday_start_date IS NULL OR holiday_start_date <= NOW())
      AND (holiday_end_date IS NULL OR holiday_end_date >= NOW())
  );
END;
$$;