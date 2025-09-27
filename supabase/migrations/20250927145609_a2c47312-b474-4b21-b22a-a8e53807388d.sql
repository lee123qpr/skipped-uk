-- Create favourites table for user wishlists
CREATE TABLE public.favourites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

-- Create policies for favourites
CREATE POLICY "Users can view their own favourites" 
ON public.favourites 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favourites" 
ON public.favourites 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favourites" 
ON public.favourites 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create offers table for negotiations
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Users can view offers they made or received" 
ON public.offers 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create offers as buyers" 
ON public.offers 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own offers" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update offers on their listings" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() = seller_id);

-- Create messages table for buyer-seller communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of received messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Create trigger for updated_at on offers
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_favourites_user_id ON public.favourites(user_id);
CREATE INDEX idx_favourites_listing_id ON public.favourites(listing_id);
CREATE INDEX idx_offers_listing_id ON public.offers(listing_id);
CREATE INDEX idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX idx_offers_seller_id ON public.offers(seller_id);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_messages_listing_id ON public.messages(listing_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);