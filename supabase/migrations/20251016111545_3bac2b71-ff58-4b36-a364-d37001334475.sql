-- Create secure RPC to fetch favourite counts for seller's listings
CREATE OR REPLACE FUNCTION public.get_favourite_counts_for_seller(_seller_id uuid)
RETURNS TABLE(listing_id uuid, favourite_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT f.listing_id, count(*)::bigint AS favourite_count
  FROM public.favourites f
  JOIN public.listings l ON l.id = f.listing_id
  WHERE l.seller_id = _seller_id
  GROUP BY f.listing_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_favourite_counts_for_seller(uuid) TO anon, authenticated;

-- Enable realtime for listings table
ALTER TABLE public.listings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;

-- Enable realtime for favourites table
ALTER TABLE public.favourites REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.favourites;