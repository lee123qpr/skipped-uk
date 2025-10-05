-- Create function to send auto-response when seller is on holiday
CREATE OR REPLACE FUNCTION public.send_holiday_auto_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  seller_profile RECORD;
BEGIN
  -- Only send auto-response for incoming messages (not from seller)
  -- And only for regular messages, not offers or system messages
  IF NEW.message_type = 'message' THEN
    -- Get seller profile to check holiday status
    SELECT 
      p.on_holiday,
      p.holiday_message,
      p.holiday_start_date,
      p.holiday_end_date,
      p.user_id
    INTO seller_profile
    FROM public.profiles p
    WHERE p.user_id = NEW.receiver_id;
    
    -- If seller is on holiday and it's within the holiday period
    IF seller_profile.on_holiday = true 
       AND (seller_profile.holiday_start_date IS NULL OR seller_profile.holiday_start_date <= NOW())
       AND (seller_profile.holiday_end_date IS NULL OR seller_profile.holiday_end_date >= NOW())
       AND NEW.sender_id != NEW.receiver_id -- Don't send auto-response to self
    THEN
      -- Insert auto-response message
      INSERT INTO public.messages (
        sender_id,
        receiver_id,
        listing_id,
        transaction_id,
        content,
        message_type,
        read
      ) VALUES (
        NEW.receiver_id, -- Seller sends the auto-response
        NEW.sender_id,   -- To the person who sent the message
        NEW.listing_id,
        NEW.transaction_id,
        COALESCE(
          seller_profile.holiday_message,
          'Thank you for your message. I am currently on holiday and will respond as soon as possible upon my return.'
        ),
        'system',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to send auto-response when new message is received
DROP TRIGGER IF EXISTS trigger_holiday_auto_response ON public.messages;
CREATE TRIGGER trigger_holiday_auto_response
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.send_holiday_auto_response();