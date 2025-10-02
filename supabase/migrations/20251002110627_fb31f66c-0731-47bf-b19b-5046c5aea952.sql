-- Create site_banners table for announcement banners
CREATE TABLE public.site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  link_url TEXT,
  link_text TEXT,
  banner_type TEXT NOT NULL DEFAULT 'info' CHECK (banner_type IN ('info', 'warning', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  click_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_settings table for global app settings
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_banners
CREATE POLICY "Everyone can view active banners"
  ON public.site_banners
  FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can view all banners"
  ON public.site_banners
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage banners"
  ON public.site_banners
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for platform_settings
CREATE POLICY "Everyone can view settings"
  ON public.platform_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_site_banners_updated_at
  BEFORE UPDATE ON public.site_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "We are currently performing maintenance. Please check back soon."}'::jsonb, 'Maintenance mode configuration'),
  ('feature_flags', '{"new_registrations": true, "create_listings": true, "make_offers": true, "transactions": true}'::jsonb, 'Feature toggles for platform functionality'),
  ('buyer_protection_fee_percentage', '{"value": 3.5}'::jsonb, 'Buyer protection fee percentage'),
  ('platform_commission_percentage', '{"value": 5.0}'::jsonb, 'Platform commission on transactions');

-- Create index for active banners query
CREATE INDEX idx_site_banners_active ON public.site_banners(is_active, start_date, end_date) WHERE is_active = true;