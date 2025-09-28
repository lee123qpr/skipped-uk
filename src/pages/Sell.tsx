import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Sell = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main create listing page
    navigate('/create-listing', { replace: true });
  }, [navigate]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sell Construction Materials",
    "description": "List your surplus construction materials for sale on Skipped marketplace",
    "url": "https://skipped.com/sell"
  };

  return (
    <>
      <SEOHead
        title="Sell Your Construction Materials - Redirecting | Skipped"
        description="Redirecting to create listing page..."
        keywords="sell construction materials, create listing"
      />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to create listing...</p>
        </div>
      </div>
    </>
  );
};

export default Sell;