import { useState, useEffect } from "react";
import { Search, Filter, Grid3X3, List, Map, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";
import MapSearch from "@/components/MapSearch";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Browse = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [mapBounds, setMapBounds] = useState<any>(null);

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
          seller_id,
          latitude,
          longitude,
          public_location,
          categories (
            id,
            name,
            slug
          ),
          profiles!listings_seller_id_fkey (
            id,
            display_name,
            username,
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
          case 'over-1000':
            query = query.gt('price', 1000);
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

      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading listings',
        description: 'Failed to fetch listings. Please try again.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Construction Materials for Sale",
    "description": "Browse surplus construction materials available for purchase",
    "numberOfItems": listings.length,
    "itemListElement": listings.slice(0, 10).map((listing, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": listing.title,
        "offers": {
          "@type": "Offer",
          "price": listing.price,
          "priceCurrency": "GBP"
        }
      }
    }))
  };

  const formatListingForCard = (listing: any) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    location: listing.location || listing.public_location,
    condition: listing.condition,
    images: listing.images || [],
    carbonSaved: listing.carbon_saved || 0,
    seller: {
      name: listing.profiles?.display_name || listing.profiles?.username || 'Anonymous',
      verified: listing.profiles?.verified || false,
      rating: 4.5, // TODO: Calculate from reviews
      reviewCount: 0 // TODO: Get from reviews count
    },
    postedDate: new Date(listing.created_at).toLocaleDateString('en-GB')
  });

  return (
    <>
      <SEOHead
        title="Browse Construction Materials - Find Surplus Building Supplies | Skipped"
        description="Discover thousands of quality surplus construction materials at great prices. Search by location, category, and condition to find exactly what you need."
        keywords="browse construction materials, surplus building supplies, search building materials, construction marketplace, used building materials"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find Quality Construction Materials
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse thousands of surplus construction materials from verified sellers across the UK and Ireland
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search materials..." 
                className="pl-10 pr-4 py-3 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </section>

          {/* Filters */}
          <section className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {showFilters && <span className="ml-2">×</span>}
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-auto">
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
                    className="rounded-none flex-1 sm:flex-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("map")}
                    className="rounded-l-none flex-1 sm:flex-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <LocationAutocomplete
                      value={selectedLocation}
                      onChange={(locationData) => setSelectedLocation(locationData.publicLocation)}
                      placeholder="Start typing a location..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Price</label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Price</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="under-100">Under £100</SelectItem>
                        <SelectItem value="100-500">£100 - £500</SelectItem>
                        <SelectItem value="500-1000">£500 - £1,000</SelectItem>
                        <SelectItem value="over-1000">Over £1,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}
          </section>

          {/* Results Section */}
          {viewMode === "map" ? (
            <section className="mb-12">
              <MapSearch
                listings={listings.map(listing => ({
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  public_location: listing.location,
                  latitude: listing.latitude || 0,
                  longitude: listing.longitude || 0,
                  category: listing.categories?.name || '',
                  condition: listing.condition || '',
                  images: listing.images || []
                }))}
                onBoundsChange={setMapBounds}
                height="600px"
                className="w-full"
              />
            </section>
          ) : (
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
          )}

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