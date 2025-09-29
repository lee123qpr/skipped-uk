import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedListings from "@/components/FeaturedListings";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Skipped",
    "description": "UK's marketplace for surplus and second-hand construction materials",
    "url": "https://skipped.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://skipped.com/browse?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEOHead
        title="Skipped - UK Construction Materials Marketplace | Save Money, Reduce Waste"
        description="Buy and sell surplus construction materials across the UK. Save money, reduce landfill waste, and track your carbon impact with buyer protection guaranteed."
        keywords="construction materials, surplus materials, second hand building materials, UK construction marketplace, sustainable building, carbon savings, reclaimed materials"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <CategoriesSection />
          <FeaturedListings />
          <TrustSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
