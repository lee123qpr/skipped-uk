-- Update handle_offer_acceptance trigger to NOT create pending transactions
-- Instead, only create system messages when offers are accepted
DROP TRIGGER IF EXISTS handle_offer_acceptance ON offers CASCADE;
DROP FUNCTION IF EXISTS handle_offer_acceptance() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_offer_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  transaction_record RECORD;
BEGIN
  -- When an offer is accepted, do NOT create a transaction
  -- Transaction will be created after payment succeeds
  -- Only create a system message to notify the buyer to pay
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Find the most relevant transaction for this offer (if any)
    SELECT id INTO transaction_record
    FROM public.transactions
    WHERE listing_id = NEW.listing_id
      AND ((buyer_id = NEW.buyer_id AND seller_id = NEW.seller_id) OR
           (buyer_id = NEW.seller_id AND seller_id = NEW.buyer_id))
    ORDER BY 
      CASE status
        WHEN 'completed' THEN 10
        WHEN 'delivered' THEN 9
        WHEN 'dispatched' THEN 8
        WHEN 'paid' THEN 7
        WHEN 'disputed' THEN 5
        WHEN 'disputed_pending_review' THEN 5
        ELSE 0
      END DESC,
      created_at DESC
    LIMIT 1;

    -- Create notification message for buyer
    INSERT INTO public.messages (
      sender_id,
      receiver_id,
      listing_id,
      transaction_id,
      content,
      message_type,
      offer_id,
      read
    ) VALUES (
      NEW.seller_id,
      NEW.buyer_id,
      NEW.listing_id,
      transaction_record.id,
      'Your offer of £' || NEW.amount || ' has been accepted! Click "Pay Now" to complete the purchase.',
      'system',
      NEW.id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER handle_offer_acceptance
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_offer_acceptance();