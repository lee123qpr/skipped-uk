-- Fix Messages RLS: Remove overly permissive system message clause
-- This ensures only SECURITY DEFINER functions (triggers) can create system messages

-- First drop the existing insert policy that allows system messages from anyone
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Create a more secure insert policy
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User must be the sender
  auth.uid() = sender_id
  AND
  -- Only allow regular messages from users (not system messages)
  message_type != 'system'
);

-- Keep admin message sending capability via a separate policy
DROP POLICY IF EXISTS "Admins can send any messages" ON public.messages;
CREATE POLICY "Admins can send any messages" ON public.messages
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

-- Add admin RLS policies for site_banners
DROP POLICY IF EXISTS "Admins can manage banners" ON public.site_banners;
CREATE POLICY "Admins can manage banners" ON public.site_banners
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure public can read active banners
DROP POLICY IF EXISTS "Anyone can read active banners" ON public.site_banners;
CREATE POLICY "Anyone can read active banners" ON public.site_banners
FOR SELECT USING (is_active = true);

-- Add admin RLS policies for platform_settings
DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
FOR ALL USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Ensure public can read platform settings (for maintenance mode checks etc.)
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
FOR SELECT USING (true);