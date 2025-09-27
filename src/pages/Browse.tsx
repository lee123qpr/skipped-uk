import { useState } from "react";
import { Search, Filter, Grid3X3, List, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";

const Browse = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Sample listings data
  const listings = [
    {
      id: "1",
      title: "Reclaimed Oak Beams - Grade A Quality",
      price: 2450,
      location: "Birmingham",
      condition: "excellent" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 847,
      seller: { name: "Heritage Timber Co.", verified: true, rating: 4.9 },
      postedDate: "2 days ago"
    },
    {
      id: "2", 
      title: "Engineering Bricks - Red Stock, 5000 units",
      price: 890,
      location: "London",
      condition: "new" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 324,
      seller: { name: "Metro Building Supplies", verified: true, rating: 4.7 },
      postedDate: "1 day ago"
    },
    {
      id: "3",
      title: "Kingspan Insulation Boards - 100mm Thickness",
      price: 1200,
      location: "Manchester",
      condition: "good" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 456,
      seller: { name: "Green Build Solutions", verified: false, rating: 4.5 },
      postedDate: "3 days ago"
    },
    {
      id: "4",
      title: "Steel I-Beams - Various Lengths Available",
      price: 3200,
      location: "Glasgow",
      condition: "excellent" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 1230,
      seller: { name: "Scottish Steel Reclaim", verified: true, rating: 4.8 },
      postedDate: "1 day ago"
    },
    {
      id: "5",
      title: "Victorian Clay Roof Tiles - Reclaimed",
      price: 650,
      location: "Bristol",
      condition: "good" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 234,
      seller: { name: "Heritage Roofing", verified: true, rating: 4.6 },
      postedDate: "4 days ago"
    },
    {
      id: "6",
      title: "Rockwool Insulation Batts - Bulk Lot",
      price: 780,
      location: "Leeds",
      condition: "new" as const,
      images: ["/api/placeholder/400/300"],
      carbonSaved: 567,
      seller: { name: "Insulation Direct", verified: false, rating: 4.3 },
      postedDate: "2 days ago"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Construction Materials Marketplace",
    "description": "Browse surplus and second-hand construction materials",
    "numberOfItems": listings.length,
    "itemListElement": listings.map((listing, index) => ({
      "@type": "Product",
      "position": index + 1,
      "name": listing.title,
      "offers": {
        "@type": "Offer",
        "price": listing.price,
        "priceCurrency": "GBP"
      }
    }))
  };

  return (
    <>
      <SEOHead
        title="Browse Construction Materials - Skipped Marketplace"
        description="Browse thousands of surplus and second-hand construction materials across UK & Ireland. Find timber, bricks, insulation, steel and more with buyer protection."
        keywords="browse construction materials, buy building materials, surplus construction materials, second hand building supplies, UK construction marketplace"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Browse Materials</h1>
            <p className="text-muted-foreground">Find quality construction materials while saving money and the environment</p>
          </header>

          {/* Search and Filters */}
          <section className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials, location, seller..."
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0 w-full sm:w-auto"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-6 bg-card border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="timber">Timber & Wood</SelectItem>
                      <SelectItem value="bricks">Bricks & Blocks</SelectItem>
                      <SelectItem value="insulation">Insulation</SelectItem>
                      <SelectItem value="steel">Steel & Metal</SelectItem>
                      <SelectItem value="tools">Tools & Plant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Condition</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Condition</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter location" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Price</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      <SelectItem value="free">Free Items Only</SelectItem>
                      <SelectItem value="under-100">Under £100</SelectItem>
                      <SelectItem value="100-500">£100 - £500</SelectItem>
                      <SelectItem value="500-1000">£500 - £1,000</SelectItem>
                      <SelectItem value="1000-2500">£1,000 - £2,500</SelectItem>
                      <SelectItem value="over-2500">Over £2,500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
          </section>

          {/* Results Header */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="text-muted-foreground">
              Showing {listings.length} results
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Select defaultValue="newest">
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="carbon">Highest Carbon Savings</SelectItem>
                  <SelectItem value="distance">Closest to Me</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none flex-1 sm:flex-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none flex-1 sm:flex-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* Results Grid */}
          <section className={`grid gap-6 mb-12 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </section>

          {/* Load More */}
          <div className="text-center">
            <Button variant="outline" size="lg">
              Load More Results
            </Button>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Browse;