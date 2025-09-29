import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Filter, Grid3X3, List, Map, MapPin, SlidersHorizontal, Loader2, Bug, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SearchSuggestions from "@/components/SearchSuggestions";
import BackToTop from "@/components/BackToTop";
import ListingCard from "@/components/ListingCard";
import MapSearch from "@/components/MapSearch";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { ListingCardSkeleton } from "@/components/LoadingSkeletons";
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
  const [selectedReason, setSelectedReason] = useState<string>("all");
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [pickupAvailable, setPickupAvailable] = useState<boolean | null>(null);
  const [acceptsOffers, setAcceptsOffers] = useState<boolean | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapSectionRef = useRef<HTMLElement>(null);
  const [mapsDebug, setMapsDebug] = useState(false);

  // Search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    queryKey: ['listings', debouncedSearchTerm, selectedCategory, selectedCondition, selectedLocation, priceRange, sortBy, selectedReason, deliveryAvailable, pickupAvailable, acceptsOffers],
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
          quantity,
          weight,
          dimensions,
          delivery_available,
          pickup_available,
          allow_offers,
          categories (
            id,
            name,
            slug
          ),
          profiles!listings_seller_id_fkey (
            id,
            username,
            verified,
            avatar_url
          )
        `)
        .eq('status', 'active');

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`title.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%,location.ilike.%${debouncedSearchTerm}%`);
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

      // Apply reason for selling filter
      if (selectedReason !== 'all') {
        query = query.eq('reason_for_selling', selectedReason);
      }

      // Apply delivery available filter
      if (deliveryAvailable !== null) {
        query = query.eq('delivery_available', deliveryAvailable);
      }

      // Apply pickup available filter
      if (pickupAvailable !== null) {
        query = query.eq('pickup_available', pickupAvailable);
      }

      // Apply accepts offers filter
      if (acceptsOffers !== null) {
        query = query.eq('allow_offers', acceptsOffers);
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
      username: listing.profiles?.username || 'Anonymous',
      verified: listing.profiles?.verified || false,
      rating: 0, // No ratings yet - will be calculated from reviews later
      reviewCount: 0 // No reviews yet
    },
    postedDate: new Date(listing.created_at).toLocaleDateString('en-GB'),
    quantity: listing.quantity,
    deliveryAvailable: listing.delivery_available,
    pickupAvailable: listing.pickup_available,
    weight: listing.weight,
    dimensions: listing.dimensions,
    allowOffers: listing.allow_offers
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
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Browse", href: "/browse" },
              ...(selectedCategory !== 'all' ? [{ 
                label: categories.find(c => c.id === selectedCategory)?.name || 'Category'
              }] : [])
            ]}
            className="mb-6"
          />
          
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Find Quality Construction Materials
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse thousands of surplus construction materials from verified sellers across the UK
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                ref={searchInputRef}
                placeholder="Search materials..." 
                className="pl-10 pr-10 py-3 text-base border-2 focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                >
                  ×
                </Button>
              )}
              <SearchSuggestions
                searchTerm={searchTerm}
                onSuggestionClick={(suggestion) => setSearchTerm(suggestion)}
                onClose={() => setShowSearchSuggestions(false)}
                isVisible={showSearchSuggestions}
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
                    onClick={() => {
                      setViewMode("map");
                      setTimeout(() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                    }}
                    className="rounded-l-none flex-1 sm:flex-none"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant={mapsDebug ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setMapsDebug((v) => {
                      const next = !v;
                      if (next && viewMode !== "map") {
                        setViewMode("map");
                        setTimeout(() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
                        toast({
                          title: 'Debug enabled',
                          description: 'Switched to Map view to show the Maps Debug panel.'
                        });
                      }
                      return next;
                    });
                  }}
                  aria-pressed={mapsDebug}
                  className="sm:ml-2"
                >
                  <Bug className="h-4 w-4 mr-2" /> Debug
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Filter Options</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedCondition("all");
                      setSelectedLocation("");
                      setPriceRange("all");
                      setSelectedReason("all");
                      setDeliveryAvailable(null);
                      setPickupAvailable(null);
                      setAcceptsOffers(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
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
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="salvage">Salvage</SelectItem>
                        <SelectItem value="parts_repair">Parts/Repair</SelectItem>
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

                  {/* Row 2: Advanced Filters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Reason for Selling</label>
                    <Select value={selectedReason} onValueChange={setSelectedReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Reason</SelectItem>
                        <SelectItem value="surplus">Surplus Materials</SelectItem>
                        <SelectItem value="incorrect_order">Incorrect Order</SelectItem> 
                        <SelectItem value="saving_from_skip">Saving from Skip</SelectItem>
                        <SelectItem value="no_longer_needed">No Longer Needed</SelectItem>
                        <SelectItem value="downsizing">Downsizing</SelectItem>
                        <SelectItem value="end_of_project">End of Project</SelectItem>
                        <SelectItem value="upgrading">Upgrading</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Delivery Options</label>
                    <Select 
                      value={deliveryAvailable === null ? "all" : deliveryAvailable ? "delivery" : "collection"} 
                      onValueChange={(value) => {
                        if (value === "all") {
                          setDeliveryAvailable(null);
                          setPickupAvailable(null);
                        } else if (value === "delivery") {
                          setDeliveryAvailable(true);
                          setPickupAvailable(null);
                        } else if (value === "collection") {
                          setDeliveryAvailable(null);
                          setPickupAvailable(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any delivery option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Option</SelectItem>
                        <SelectItem value="delivery">Delivery Available</SelectItem>
                        <SelectItem value="collection">Collection Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Offers</label>
                    <Select 
                      value={acceptsOffers === null ? "all" : acceptsOffers ? "accepts" : "fixed"} 
                      onValueChange={(value) => {
                        if (value === "all") {
                          setAcceptsOffers(null);
                        } else if (value === "accepts") {
                          setAcceptsOffers(true);
                        } else {
                          setAcceptsOffers(false);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any offer option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Option</SelectItem>
                        <SelectItem value="accepts">Accepts Offers</SelectItem>
                        <SelectItem value="fixed">Fixed Price Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Carbon Savings</label>
                    <Select 
                      value={priceRange} 
                      onValueChange={setPriceRange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any carbon savings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Amount</SelectItem>
                        <SelectItem value="high-carbon">High Impact (500+ kg CO₂)</SelectItem>
                        <SelectItem value="medium-carbon">Medium Impact (100-500 kg CO₂)</SelectItem>
                        <SelectItem value="low-carbon">Low Impact (Under 100 kg CO₂)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  )}
                  {selectedCondition !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {selectedCondition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )}
                  {selectedLocation && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      📍 {selectedLocation}
                    </span>
                  )}
                  {priceRange !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {priceRange === "free" ? "Free" : 
                       priceRange === "under-100" ? "Under £100" :
                       priceRange === "100-500" ? "£100-£500" :
                       priceRange === "500-1000" ? "£500-£1,000" :
                       "Over £1,000"}
                    </span>
                  )}
                  {selectedReason !== "all" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {selectedReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  )}
                  {deliveryAvailable !== null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {deliveryAvailable ? "🚚 Delivery" : "📦 Collection"}
                    </span>
                  )}
                  {acceptsOffers !== null && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {acceptsOffers ? "💬 Accepts Offers" : "💳 Fixed Price"}
                    </span>
                  )}
                </div>
              </Card>
            )}
          </section>

          {/* Results Section */}
          {viewMode === "map" ? (
            <section ref={mapSectionRef} className="mb-12">
              <MapSearch
                listings={listings
                  .filter(listing => listing.latitude && listing.longitude) // Only show listings with valid coordinates
                  .map(listing => ({
                    id: listing.id,
                    title: listing.title,
                    price: listing.price,
                    public_location: listing.public_location || listing.location, // Fixed field mapping
                    latitude: listing.latitude,
                    longitude: listing.longitude,
                    category: listing.categories?.name || '',
                    condition: listing.condition as "new" | "like_new" | "excellent" | "good" | "fair" | "salvage" | "parts_repair" | undefined,
                    images: listing.images || [],
                    quantity: listing.quantity,
                    delivery_available: listing.delivery_available,
                    pickup_available: listing.pickup_available,
                    allow_offers: listing.allow_offers
                  }))}
                onBoundsChange={setMapBounds}
                height="600px"
                className="w-full"
                showDebug={mapsDebug}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <ListingCardSkeleton key={i} />
                      ))}
                    </div>
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

        <BackToTop />
        <Footer />
      </div>
    </>
  );
};

export default Browse;