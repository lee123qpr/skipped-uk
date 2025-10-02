-- Add pending_payment and fix existing statuses
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
CHECK (status IN (
  'pending',
  'pending_payment',
  'paid',
  'awaiting_dispatch',
  'dispatched',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'disputed',
  'disputed_pending_review',
  'return_requested',
  'return_approved',
  'return_rejected',
  'returned'
));