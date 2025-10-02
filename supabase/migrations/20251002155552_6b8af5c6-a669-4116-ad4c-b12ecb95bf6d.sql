-- Manual fix: Update the stuck transaction to 'paid' status since payment was completed
-- Transaction ID: 91ffe26a-5447-4e79-91b9-81fdcf0802a0
UPDATE transactions 
SET 
  status = 'paid',
  paid_at = NOW()
WHERE id = '91ffe26a-5447-4e79-91b9-81fdcf0802a0' 
AND status = 'pending_payment';

-- Insert system notification to seller
INSERT INTO messages (
  sender_id,
  receiver_id,
  listing_id,
  content,
  message_type,
  read
)
SELECT 
  buyer_id,
  seller_id,
  listing_id,
  'Payment of £' || amount || ' received in escrow. Please mark as dispatched when you send the item.',
  'system',
  false
FROM transactions
WHERE id = '91ffe26a-5447-4e79-91b9-81fdcf0802a0'
AND NOT EXISTS (
  SELECT 1 FROM messages 
  WHERE listing_id = (SELECT listing_id FROM transactions WHERE id = '91ffe26a-5447-4e79-91b9-81fdcf0802a0')
  AND message_type = 'system'
  AND content LIKE '%Payment of%received in escrow%'
);