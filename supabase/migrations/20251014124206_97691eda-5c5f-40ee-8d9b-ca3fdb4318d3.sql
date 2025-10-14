-- Add indexes for unindexed foreign keys to improve join performance

-- Account deletion requests
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id 
ON public.account_deletion_requests(user_id);

-- Admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id 
ON public.admin_actions(admin_id);

-- Blog post feedback
CREATE INDEX IF NOT EXISTS idx_blog_post_feedback_user_id 
ON public.blog_post_feedback(user_id);

-- Blog post views
CREATE INDEX IF NOT EXISTS idx_blog_post_views_user_id 
ON public.blog_post_views(user_id);

-- Disputes
CREATE INDEX IF NOT EXISTS idx_disputes_listing_id 
ON public.disputes(listing_id);

-- Environmental certificates
CREATE INDEX IF NOT EXISTS idx_environmental_certificates_listing_id 
ON public.environmental_certificates(listing_id);

-- Platform settings
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by 
ON public.platform_settings(updated_by);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_by 
ON public.profiles(suspended_by);