-- Add username column to profiles table with unique constraint
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to generate username suggestions
CREATE OR REPLACE FUNCTION public.generate_username_suggestions(base_username text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    suggestions text[] := '{}';
    i integer := 1;
    candidate text;
BEGIN
    -- Add the base username if available
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = base_username) THEN
        suggestions := array_append(suggestions, base_username);
    END IF;
    
    -- Generate numbered suggestions
    WHILE array_length(suggestions, 1) < 5 AND i <= 100 LOOP
        candidate := base_username || i::text;
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) THEN
            suggestions := array_append(suggestions, candidate);
        END IF;
        i := i + 1;
    END LOOP;
    
    RETURN suggestions;
END;
$$;