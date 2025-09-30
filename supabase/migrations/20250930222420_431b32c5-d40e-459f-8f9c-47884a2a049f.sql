-- Add Stripe account ID to profiles for Connect
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add Stripe payment fields to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
ADD COLUMN IF NOT EXISTS buyer_protection_fee numeric(10,2),
ADD COLUMN IF NOT EXISTS dispatch_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dispute_reason text,
ADD COLUMN IF NOT EXISTS disputed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone;

-- Create index for Stripe payment lookups
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent 
ON public.transactions(stripe_payment_intent_id);

-- Drop existing check constraint if it exists
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Add updated check constraint for valid status values including new escrow states
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_status_check 
CHECK (status IN (
  'pending',
  'pending_payment',
  'paid', 
  'dispatched',
  'delivered',
  'completed',
  'disputed',
  'refunded',
  'cancelled'
));