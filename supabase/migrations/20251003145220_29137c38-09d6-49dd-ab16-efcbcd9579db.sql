-- Create enum for blog post status
CREATE TYPE blog_post_status AS ENUM ('draft', 'published', 'archived');

-- Create enum for feedback type  
CREATE TYPE blog_feedback_type AS ENUM ('helpful', 'not_helpful');

-- Create blog_categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  color TEXT DEFAULT '#3b82f6',
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status blog_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  meta_description TEXT,
  meta_keywords TEXT,
  reading_time_minutes INTEGER,
  search_vector tsvector,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_post_categories junction table
CREATE TABLE public.blog_post_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

-- Create blog_post_feedback table
CREATE TABLE public.blog_post_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  feedback_type blog_feedback_type NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_post_views table (simplified - one view per session per day handled in app)
CREATE TABLE public.blog_post_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_search_vector ON public.blog_posts USING gin(search_vector);
CREATE INDEX idx_blog_post_categories_post ON public.blog_post_categories(post_id);
CREATE INDEX idx_blog_post_categories_category ON public.blog_post_categories(category_id);
CREATE INDEX idx_blog_post_views_post ON public.blog_post_views(post_id);
CREATE INDEX idx_blog_post_views_session ON public.blog_post_views(post_id, session_id, viewed_at);
CREATE INDEX idx_blog_post_feedback_post ON public.blog_post_feedback(post_id);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_blog_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  IF length(base_slug) < 3 THEN
    base_slug := 'blog-post';
  END IF;
  
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION public.calculate_reading_time(content TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  word_count INTEGER;
  reading_time INTEGER;
BEGIN
  word_count := array_length(regexp_split_to_array(content, '\s+'), 1);
  reading_time := CEIL(word_count::NUMERIC / 200);
  
  IF reading_time < 1 THEN
    reading_time := 1;
  END IF;
  
  RETURN reading_time;
END;
$$;

-- Function to update blog post search vector
CREATE OR REPLACE FUNCTION public.update_blog_posts_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.meta_keywords, '')), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blog_posts_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_search_vector();

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION public.auto_generate_blog_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_blog_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_blog_slug_trigger
BEFORE INSERT ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_blog_slug();

-- Trigger to calculate reading time
CREATE OR REPLACE FUNCTION public.auto_calculate_reading_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.reading_time_minutes := public.calculate_reading_time(NEW.content);
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_calculate_reading_time_trigger
BEFORE INSERT OR UPDATE OF content ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_calculate_reading_time();

-- Function to update category post counts
CREATE OR REPLACE FUNCTION public.update_blog_category_post_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_categories
    SET post_count = post_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_categories
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_category_count_on_post_category
AFTER INSERT OR DELETE ON public.blog_post_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_category_post_count();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Everyone can view categories"
ON public.blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.blog_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blog_posts
CREATE POLICY "Everyone can view published posts"
ON public.blog_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create posts"
ON public.blog_posts FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
ON public.blog_posts FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
ON public.blog_posts FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blog_post_categories
CREATE POLICY "Everyone can view post categories"
ON public.blog_post_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage post categories"
ON public.blog_post_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blog_post_feedback
CREATE POLICY "Anyone can submit feedback"
ON public.blog_post_feedback FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view feedback"
ON public.blog_post_feedback FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for blog_post_views
CREATE POLICY "Anyone can record views"
ON public.blog_post_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view analytics"
ON public.blog_post_views FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));