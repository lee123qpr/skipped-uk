-- Make author_id nullable and remove foreign key constraint if it exists
-- This allows blog posts to be created even if author profile doesn't exist
ALTER TABLE public.blog_posts 
ALTER COLUMN author_id DROP NOT NULL;

-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'blog_posts_author_id_fkey' 
        AND table_name = 'blog_posts'
    ) THEN
        ALTER TABLE public.blog_posts DROP CONSTRAINT blog_posts_author_id_fkey;
    END IF;
END $$;