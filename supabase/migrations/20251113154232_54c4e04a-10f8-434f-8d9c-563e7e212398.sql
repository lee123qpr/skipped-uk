-- Part 1: Create missing system messages for existing transaction
WITH transaction_details AS (
  SELECT 
    t.id as transaction_id,
    t.listing_id,
    t.buyer_id,
    t.seller_id,
    t.amount,
    l.title as listing_title,
    bp.display_name as buyer_name
  FROM transactions t
  JOIN listings l ON l.id = t.listing_id
  JOIN profiles bp ON bp.user_id = t.buyer_id
  WHERE t.id = 'c3717624-e489-4691-b872-868fd943d203'
)
-- Insert system message for buyer
INSERT INTO messages (sender_id, receiver_id, listing_id, transaction_id, content, message_type, read)
SELECT 
  seller_id,
  buyer_id,
  listing_id,
  transaction_id,
  'Payment received! Your payment of £' || amount::text || ' is securely held in escrow. The seller will now dispatch your item.',
  'system',
  false
FROM transaction_details
WHERE NOT EXISTS (
  SELECT 1 FROM messages 
  WHERE transaction_id = transaction_details.transaction_id 
  AND receiver_id = transaction_details.buyer_id
);

-- Insert system message for seller
WITH transaction_details AS (
  SELECT 
    t.id as transaction_id,
    t.listing_id,
    t.buyer_id,
    t.seller_id,
    t.amount,
    l.title as listing_title,
    bp.display_name as buyer_name
  FROM transactions t
  JOIN listings l ON l.id = t.listing_id
  JOIN profiles bp ON bp.user_id = t.buyer_id
  WHERE t.id = 'c3717624-e489-4691-b872-868fd943d203'
)
INSERT INTO messages (sender_id, receiver_id, listing_id, transaction_id, content, message_type, read)
SELECT 
  buyer_id,
  seller_id,
  listing_id,
  transaction_id,
  'New order! ' || buyer_name || ' has paid £' || amount::text || ' for "' || listing_title || '". Please dispatch the item as soon as possible.',
  'system',
  false
FROM transaction_details
WHERE NOT EXISTS (
  SELECT 1 FROM messages 
  WHERE transaction_id = transaction_details.transaction_id 
  AND receiver_id = transaction_details.seller_id
);

-- Part 2: Fix RLS policy for system messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    -- Normal user messages (user must be sender, not system type)
    (auth.uid() = sender_id AND message_type <> 'system')
    OR
    -- System messages (no auth required - service role will handle)
    (message_type = 'system')
    OR
    -- Admin system messages
    (message_type = 'system' AND listing_id IS NULL AND has_role(auth.uid(), 'admin'))
  );