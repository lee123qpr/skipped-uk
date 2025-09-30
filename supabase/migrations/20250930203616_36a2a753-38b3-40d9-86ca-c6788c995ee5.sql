-- Add message types enum
CREATE TYPE message_type AS ENUM ('message', 'offer', 'system');

-- Add columns to messages table
ALTER TABLE public.messages
ADD COLUMN message_type message_type NOT NULL DEFAULT 'message',
ADD COLUMN offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE;

-- Add parent_offer_id for counter-offers
ALTER TABLE public.offers
ADD COLUMN parent_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_messages_offer_id ON public.messages(offer_id);
CREATE INDEX idx_offers_parent_offer_id ON public.offers(parent_offer_id);

-- Function to auto-create system messages for offer status changes
CREATE OR REPLACE FUNCTION public.create_offer_system_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When offer status changes from pending, create system message
  IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
    INSERT INTO public.messages (
      sender_id,
      receiver_id,
      listing_id,
      content,
      message_type,
      offer_id,
      read
    ) VALUES (
      NEW.seller_id,
      NEW.buyer_id,
      NEW.listing_id,
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
$$;

-- Create trigger for offer status changes
CREATE TRIGGER on_offer_status_change
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.create_offer_system_message();