-- Update handle_new_user function to auto-generate usernames
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Try to get first name from metadata, fallback to email prefix
  base_username := COALESCE(
    NEW.raw_user_meta_data ->> 'first_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Sanitize: lowercase, remove spaces and special characters, keep only alphanumeric
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure it's not empty and has minimum length
  IF base_username = '' OR base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user';
  END IF;
  
  -- Try base username first
  final_username := base_username;
  
  -- If taken, append numbers until we find an available one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  
  -- Insert profile with generated username
  INSERT INTO public.profiles (user_id, display_name, username, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    final_username,
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;