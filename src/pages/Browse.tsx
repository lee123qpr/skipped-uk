import { useState, useEffect } from "react";
import { Search, Filter, Grid3X3, List, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Browse = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch listings with filters
  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ['listings', searchTerm, selectedCategory, selectedCondition, selectedLocation, priceRange, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          price,
          location,
          condition,
          images,
          carbon_saved,
          created_at,
          status,
          seller_id,
          profiles:seller_id (
            display_name,
            verified,
            avatar_url
          )
        `)
        .eq('status', 'active');

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply condition filter
      if (selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }

      // Apply location filter
      if (selectedLocation) {
        query = query.ilike('location', `%${selectedLocation}%`);
      }

      // Apply price filter
      if (priceRange !== 'all') {
        switch (priceRange) {
          case 'free':
            query = query.eq('price', 0);
            break;
          case 'under-100':
            query = query.lt('price', 100);
            break;
          case '100-500':
            query = query.gte('price', 100).lte('price', 500);
            break;
          case '500-1000':
            query = query.gte('price', 500).lte('price', 1000);
            break;
          case '1000-2500':
            query = query.gte('price', 1000).lte('price', 2500);
            break;
          case 'over-2500':
            query = query.gt('price', 2500);
            break;
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'carbon':
          query = query.order('carbon_saved', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading listings",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

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

  const formatListingForCard = (listing: any) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    condition: listing.condition,
    images: listing.images || [],
    carbonSaved: listing.carbon_saved || 0,
    seller: {
      name: listing.profiles?.display_name || "Anonymous User",
      verified: listing.profiles?.verified || false,
      rating: 4.5, // TODO: Implement actual rating system
    },
    postedDate: new Date(listing.created_at).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  });

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Condition</label>
                  <Select value={selectedCondition} onValueChange={setSelectedCondition}>
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
                    <Input 
                      placeholder="Enter location" 
                      className="pl-10"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Price</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
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
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading listings...
                </div>
              ) : (
                `Showing ${listings.length} result${listings.length !== 1 ? 's' : ''}`
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="carbon">Highest Carbon Savings</SelectItem>
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
          <section className={`mb-12 ${
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          }`}>
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading listings...</p>
                </div>
              </div>
            ) : listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">No listings found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search criteria or check back later for new items.</p>
              </div>
            ) : (
              listings.map((listing) => (
                <ListingCard key={listing.id} {...formatListingForCard(listing)} />
              ))
            )}
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