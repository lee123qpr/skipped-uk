-- Add paid_at timestamp to transactions table
ALTER TABLE public.transactions
ADD COLUMN paid_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.transactions.paid_at IS 'Timestamp when payment was confirmed by Stripe';