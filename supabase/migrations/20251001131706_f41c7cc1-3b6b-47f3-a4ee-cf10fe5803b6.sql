-- Create trigger to send message when offer is first created
CREATE OR REPLACE FUNCTION public.create_offer_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When offer is created, notify seller
  INSERT INTO public.messages (
    sender_id,
    receiver_id,
    listing_id,
    content,
    message_type,
    offer_id,
    read
  ) VALUES (
    NEW.buyer_id,
    NEW.seller_id,
    NEW.listing_id,
    'New offer of £' || NEW.amount || ' received' || CASE WHEN NEW.message IS NOT NULL AND NEW.message != '' THEN ' - ' || NEW.message ELSE '' END,
    'offer',
    NEW.id,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new offers
CREATE TRIGGER on_offer_created
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_offer_notification();

-- Create trigger for offer status changes (accept/decline)
CREATE TRIGGER on_offer_status_changed
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status != 'pending')
  EXECUTE FUNCTION public.create_offer_system_message();