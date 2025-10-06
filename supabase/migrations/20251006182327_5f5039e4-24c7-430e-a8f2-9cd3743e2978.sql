-- Add account management fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
ADD COLUMN IF NOT EXISTS suspension_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES public.profiles(user_id),
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL NOT NULL,
  target_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('suspend', 'unsuspend', 'delete', 'verify', 'message', 'stripe_verify')),
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on admin_actions
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view admin actions
CREATE POLICY "Admins can view admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Policy: Only admins can create admin actions
CREATE POLICY "Admins can create admin actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);