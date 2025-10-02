import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  message: string;
  link_url: string | null;
  link_text: string | null;
  banner_type: "info" | "warning" | "critical";
  click_count: number;
  view_count: number;
}

const AnnouncementBanner = () => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBanner = async () => {
      const dismissedId = localStorage.getItem("dismissed_banner_id");
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from("site_banners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching banner:", error);
        return;
      }

      // Filter manually for date ranges since PostgREST OR logic is complex
      const activeBanner = data?.find(banner => {
        if (banner.id === dismissedId) return false;
        
        const startValid = !banner.start_date || new Date(banner.start_date) <= new Date(now);
        const endValid = !banner.end_date || new Date(banner.end_date) >= new Date(now);
        
        return startValid && endValid;
      });

      if (activeBanner) {
        setBanner(activeBanner as Banner);
        
        // Track view
        await supabase
          .from("site_banners")
          .update({ view_count: activeBanner.view_count + 1 })
          .eq("id", activeBanner.id);
      }
    };

    fetchBanner();
  }, []);

  const handleDismiss = () => {
    if (banner) {
      localStorage.setItem("dismissed_banner_id", banner.id);
      setDismissed(true);
    }
  };

  const handleLinkClick = async () => {
    if (banner) {
      await supabase
        .from("site_banners")
        .update({ click_count: banner.click_count + 1 })
        .eq("id", banner.id);
    }
  };

  if (!banner || dismissed) return null;

  const typeStyles = {
    info: "bg-primary/10 border-primary text-primary",
    warning: "bg-yellow-500/10 border-yellow-500 text-yellow-900 dark:text-yellow-100",
    critical: "bg-red-500/10 border-red-500 text-red-900 dark:text-red-100",
  };

  return (
    <div
      className={cn(
        "w-full border-b py-3 px-4 flex items-center justify-between gap-4",
        typeStyles[banner.banner_type]
      )}
    >
      <div className="flex-1 flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium">{banner.message}</p>
        {banner.link_url && banner.link_text && (
          <a
            href={banner.link_url}
            onClick={handleLinkClick}
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            target={banner.link_url.startsWith("http") ? "_blank" : undefined}
            rel={banner.link_url.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {banner.link_text}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AnnouncementBanner;
