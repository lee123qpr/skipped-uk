-- Add manufacturer field to listings table
ALTER TABLE public.listings
ADD COLUMN manufacturer text;

-- Add index for search performance
CREATE INDEX idx_listings_manufacturer ON public.listings(manufacturer);

-- Update the search vector function to include manufacturer
DROP TRIGGER IF EXISTS listings_search_vector_update ON public.listings;

CREATE OR REPLACE FUNCTION public.update_listings_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.manufacturer, '')), 'A');
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_search_vector_update
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_listings_search_vector();