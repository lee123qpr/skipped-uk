-- Update RLS policy to allow users to see their own blog posts regardless of status
-- Keep existing policies for admins and public viewing

-- Drop existing author viewing policy if it exists
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;

-- Create policy for authors to view their own posts
CREATE POLICY "Authors can view their own posts"
ON public.blog_posts
FOR SELECT
TO authenticated
USING (auth.uid() = author_id OR has_role(auth.uid(), 'admin'::app_role));