-- Enable Realtime for transactions table
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- Enable Realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable Realtime for offers table
ALTER TABLE public.offers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;