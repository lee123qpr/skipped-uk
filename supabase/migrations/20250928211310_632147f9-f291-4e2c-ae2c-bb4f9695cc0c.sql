-- Create transactions table to track completed purchases
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  offer_id uuid,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view transactions they're involved in" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Parties can update transaction status" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Update reviews table to support mutual reviews and transaction linking
ALTER TABLE public.reviews ADD COLUMN transaction_id uuid;
ALTER TABLE public.reviews ADD COLUMN reviewer_type text CHECK (reviewer_type IN ('buyer', 'seller'));

-- Drop and recreate reviews RLS policies to be transaction-based
DROP POLICY IF EXISTS "Users can create reviews for listings they don't own" ON public.reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- New RLS policies for transaction-based reviews
CREATE POLICY "Users can create transaction-based reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE id = transaction_id 
    AND status = 'completed'
    AND (
      (auth.uid() = buyer_id AND reviewer_type = 'buyer') OR
      (auth.uid() = seller_id AND reviewer_type = 'seller')
    )
  )
);

CREATE POLICY "Transaction reviews are publicly viewable" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their transaction reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their transaction reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = reviewer_id);

-- Add trigger for transactions updated_at
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle offer acceptance and transaction creation
CREATE OR REPLACE FUNCTION public.handle_offer_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When an offer is accepted, create a transaction
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.transactions (
      listing_id,
      buyer_id,
      seller_id,
      offer_id,
      amount,
      status
    ) VALUES (
      NEW.listing_id,
      NEW.buyer_id,
      NEW.seller_id,
      NEW.id,
      NEW.amount,
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for offer acceptance
CREATE TRIGGER on_offer_accepted
  AFTER UPDATE ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_offer_acceptance();