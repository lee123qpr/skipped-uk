-- Add transaction_id to messages table
ALTER TABLE public.messages 
ADD COLUMN transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_messages_transaction_id ON public.messages(transaction_id);

-- Update existing messages to link them to the correct transaction
-- This matches messages to transactions based on listing_id and the buyer/seller pair
UPDATE public.messages m
SET transaction_id = (
  SELECT t.id
  FROM public.transactions t
  WHERE t.listing_id = m.listing_id
    AND (
      (t.buyer_id = m.sender_id AND t.seller_id = m.receiver_id) OR
      (t.buyer_id = m.receiver_id AND t.seller_id = m.sender_id)
    )
  -- Priority order: active transactions over pending
  ORDER BY 
    CASE t.status
      WHEN 'completed' THEN 10
      WHEN 'delivered' THEN 9
      WHEN 'dispatched' THEN 8
      WHEN 'paid' THEN 7
      WHEN 'pending_payment' THEN 6
      WHEN 'disputed' THEN 5
      WHEN 'disputed_pending_review' THEN 5
      WHEN 'pending' THEN 1
      ELSE 0
    END DESC,
    t.created_at DESC
  LIMIT 1
)
WHERE m.transaction_id IS NULL;

-- Add comment
COMMENT ON COLUMN public.messages.transaction_id IS 'Links message to specific transaction to prevent conversation crossover';