-- Add foreign key relationships for reviews table to profiles table
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;