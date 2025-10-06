-- Make listing_id nullable for admin system messages
ALTER TABLE public.messages ALTER COLUMN listing_id DROP NOT NULL;

-- Create policy for admins to send system messages without listing_id
CREATE POLICY "Admins can send system messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() 
  AND message_type = 'system'
  AND listing_id IS NULL
  AND has_role(auth.uid(), 'admin'::app_role)
);