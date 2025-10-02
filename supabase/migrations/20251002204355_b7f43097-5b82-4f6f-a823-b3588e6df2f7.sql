-- Add seller reply fields to reviews table
ALTER TABLE reviews 
ADD COLUMN seller_reply text,
ADD COLUMN seller_reply_created_at timestamp with time zone;

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to send review reminders
CREATE OR REPLACE FUNCTION send_review_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  reminder_transaction RECORD;
BEGIN
  -- Find completed transactions from 7 days ago with no reviews
  FOR reminder_transaction IN
    SELECT 
      t.id as transaction_id,
      t.buyer_id,
      t.seller_id,
      t.listing_id,
      l.title as listing_title
    FROM transactions t
    JOIN listings l ON l.id = t.listing_id
    WHERE t.status = 'completed'
      AND t.completed_at >= NOW() - INTERVAL '30 days'
      AND t.completed_at <= NOW() - INTERVAL '7 days'
      AND t.completed_at >= NOW() - INTERVAL '8 days'
      AND NOT EXISTS (
        SELECT 1 FROM reviews r 
        WHERE r.transaction_id = t.id 
        AND r.reviewer_id = t.buyer_id
      )
  LOOP
    -- Insert reminder message for buyer
    INSERT INTO messages (
      sender_id,
      receiver_id,
      listing_id,
      content,
      message_type,
      read
    ) VALUES (
      reminder_transaction.seller_id,
      reminder_transaction.buyer_id,
      reminder_transaction.listing_id,
      'Reminder: You haven''t left a review for "' || reminder_transaction.listing_title || '" yet. Reviews help build trust in our community!',
      'system',
      false
    );
  END LOOP;

  -- Find completed transactions from 7 days ago where seller hasn't reviewed buyer
  FOR reminder_transaction IN
    SELECT 
      t.id as transaction_id,
      t.buyer_id,
      t.seller_id,
      t.listing_id,
      l.title as listing_title
    FROM transactions t
    JOIN listings l ON l.id = t.listing_id
    WHERE t.status = 'completed'
      AND t.completed_at >= NOW() - INTERVAL '30 days'
      AND t.completed_at <= NOW() - INTERVAL '7 days'
      AND t.completed_at >= NOW() - INTERVAL '8 days'
      AND NOT EXISTS (
        SELECT 1 FROM reviews r 
        WHERE r.transaction_id = t.id 
        AND r.reviewer_id = t.seller_id
      )
  LOOP
    -- Insert reminder message for seller
    INSERT INTO messages (
      sender_id,
      receiver_id,
      listing_id,
      content,
      message_type,
      read
    ) VALUES (
      reminder_transaction.buyer_id,
      reminder_transaction.seller_id,
      reminder_transaction.listing_id,
      'Reminder: You haven''t left a review for your buyer yet. Share your experience with "' || reminder_transaction.listing_title || '"!',
      'system',
      false
    );
  END LOOP;
END;
$$;

-- Schedule the reminder function to run daily at 10am
SELECT cron.schedule(
  'send-review-reminders-daily',
  '0 10 * * *',
  $$SELECT send_review_reminders()$$
);