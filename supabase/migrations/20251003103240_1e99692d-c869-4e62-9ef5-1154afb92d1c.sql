-- Update database triggers to include transaction_id when creating messages

-- Fix create_offer_notification trigger to link message to transaction
CREATE OR REPLACE FUNCTION public.create_offer_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  transaction_record RECORD;
BEGIN
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
      WHEN 'pending_payment' THEN 6
      WHEN 'disputed' THEN 5
      WHEN 'disputed_pending_review' THEN 5
      WHEN 'pending' THEN 1
      ELSE 0
    END DESC,
    created_at DESC
  LIMIT 1;

  -- When offer is created, notify seller
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
    NEW.buyer_id,
    NEW.seller_id,
    NEW.listing_id,
    transaction_record.id,
    'New offer of £' || NEW.amount || ' received' || CASE WHEN NEW.message IS NOT NULL AND NEW.message != '' THEN ' - ' || NEW.message ELSE '' END,
    'offer',
    NEW.id,
    false
  );
  
  RETURN NEW;
END;
$function$;

-- Fix create_offer_system_message trigger to link message to transaction
CREATE OR REPLACE FUNCTION public.create_offer_system_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  transaction_record RECORD;
BEGIN
  -- When offer status changes from pending, create system message
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
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
        WHEN 'pending_payment' THEN 6
        WHEN 'disputed' THEN 5
        WHEN 'disputed_pending_review' THEN 5
        WHEN 'pending' THEN 1
        ELSE 0
      END DESC,
      created_at DESC
    LIMIT 1;

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
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Offer of £' || NEW.amount || ' accepted'
        WHEN NEW.status = 'declined' THEN 'Offer of £' || NEW.amount || ' declined'
        ELSE 'Offer status updated'
      END,
      'system',
      NEW.id,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$function$;