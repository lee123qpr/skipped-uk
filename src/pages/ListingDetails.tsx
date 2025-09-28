import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSellerRating } from '@/hooks/useSellerRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Package, 
  Truck, 
  MessageCircle, 
  Heart,
  Share2,
  Star,
  Shield,
  Leaf,
  Ruler,
  PoundSterling
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import BackToTop from '@/components/BackToTop';
import MessageDialog from '@/components/MessageDialog';
import OfferDialog from '@/components/OfferDialog';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList } from '@/components/ReviewsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ListingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!seller_id (
            id,
            username,
            avatar_url,
            verified,
            created_at
          ),
          categories (
            id,
            name,
            icon_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Get seller rating data
  const { data: sellerRating } = useSellerRating(listing?.seller_id);

  // Check if listing is favourited by current user
  const { data: favouriteData } = useQuery({
    queryKey: ['favourite', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      
      const { data, error } = await supabase
        .from('favourites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  useEffect(() => {
    setIsFavourited(!!favouriteData);
  }, [favouriteData]);

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact sellers.",
        variant: "destructive",
      });
      navigate('/sign-in');
      return;
    }
    setShowMessageDialog(true);
  };

  const handleMakeOffer = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to make offers.",
        variant: "destructive",
      });
      navigate('/sign-in');
      return;
    }
    setShowOfferDialog(true);
  };

  const handleFavourite = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save favourites.",
        variant: "destructive",
      });
      navigate('/sign-in');
      return;
    }
    
    try {
      if (isFavourited) {
        // Remove from favourites
        const { error } = await supabase
          .from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id);
          
        if (error) throw error;
        
        setIsFavourited(false);
        toast({
          title: "Removed from favourites",
          description: "Item removed from your favourites",
        });
      } else {
        // Add to favourites
        const { error } = await supabase
          .from('favourites')
          .insert({
            user_id: user.id,
            listing_id: id!,
          });
          
        if (error) throw error;
        
        setIsFavourited(true);
        toast({
          title: "Added to favourites",
          description: "Item saved to your favourites",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing?.title,
        text: `Check out this ${listing?.title} on Skipped`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Listing link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
            <p className="text-muted-foreground mb-8">The listing you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/browse')}>
              Browse Other Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description,
    "offers": {
      "@type": "Offer",
      "price": listing.price,
      "priceCurrency": "GBP",
      "availability": "https://schema.org/InStock"
    },
    "image": listing.images?.[0],
    "condition": listing.condition,
  };

  return (
    <>
      <SEOHead
        title={`${listing.title} - ${listing.price === 0 ? 'Free' : `£${listing.price}`} | Skipped`}
        description={listing.description}
        keywords={`${listing.title}, ${listing.categories?.name}, construction materials, ${listing.condition}, ${listing.location}`}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Browse", href: "/browse" },
              ...(listing.categories ? [{ 
                label: listing.categories.name,
                href: `/browse?category=${listing.categories.id}`
              }] : []),
              { label: listing.title }
            ]}
            className="mb-4"
          />
          
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="aspect-square bg-muted overflow-hidden">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Image Thumbnails */}
              {listing.images && listing.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {listing.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`${listing.title} - ${index + 2}`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hero Info */}
            <div className="space-y-6">
              {/* Title and Category */}
              <div>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                {listing.categories && (
                  <Badge variant="secondary" className="mb-4">
                    {listing.categories.name}
                  </Badge>
                )}
                <div className="text-4xl font-bold text-primary mb-4">
                  {listing.price === 0 ? 'Free' : `£${listing.price.toLocaleString()}`}
                </div>
              </div>

              {/* Key Details Card */}
              <Card className="bg-gradient-to-br from-card to-card/80">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-lg font-semibold text-primary">{listing.condition}</div>
                      <div className="text-xs text-muted-foreground">Condition</div>
                    </div>
                    <div className="text-center p-3 bg-background/50 rounded-lg">
                      <div className="text-lg font-semibold text-primary">{listing.quantity}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Listed {new Date(listing.created_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    {listing.weight && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Weight: {listing.weight}kg</span>
                      </div>
                    )}
                    {listing.dimensions && typeof listing.dimensions === 'object' && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(listing.dimensions as any).length}×{(listing.dimensions as any).width}×{(listing.dimensions as any).height} {(listing.dimensions as any).unit}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions Panel */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-2 mb-4">
                    <Button 
                      onClick={handleContact} 
                      className="flex-1"
                      disabled={user?.id === listing.seller_id}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Contact Seller
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleFavourite}>
                      <Heart className={`h-4 w-4 ${isFavourited ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {listing.allow_offers && listing.price > 0 && user?.id !== listing.seller_id && (
                    <Button 
                      variant="outline" 
                      onClick={handleMakeOffer}
                      className="w-full"
                    >
                      <PoundSterling className="mr-2 h-4 w-4" />
                      Make an Offer
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Environmental Impact */}
          {listing.carbon_saved > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Environmental Impact</h3>
                    <p className="text-green-700 dark:text-green-300">
                      Purchasing this item saves approximately <span className="font-bold">{listing.carbon_saved}kg CO₂</span> from being released into the atmosphere
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description & Specifications */}
              <Card>
                <Tabs defaultValue="description" className="w-full">
                  <CardHeader>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="specifications">Specifications</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="description" className="space-y-4">
                      <div>
                        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {listing.description}
                        </p>
                      </div>
                      
                      {listing.reason_for_selling && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2 text-primary">Reason for Selling</h4>
                          <p className="text-sm text-muted-foreground">{listing.reason_for_selling}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="specifications">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-semibold text-primary">Item Details</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                              <span className="text-sm font-medium">Condition</span>
                              <Badge variant="outline">{listing.condition}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                              <span className="text-sm font-medium">Quantity</span>
                              <span className="text-sm">{listing.quantity} unit{listing.quantity !== 1 ? 's' : ''}</span>
                            </div>
                            {listing.weight && (
                              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                                <span className="text-sm font-medium">Weight</span>
                                <span className="text-sm">{listing.weight}kg</span>
                              </div>
                            )}
                            {listing.dimensions && typeof listing.dimensions === 'object' && (
                              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                                <span className="text-sm font-medium">Dimensions</span>
                                <span className="text-sm">
                                  {(listing.dimensions as any).length}×{(listing.dimensions as any).width}×{(listing.dimensions as any).height} {(listing.dimensions as any).unit}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold text-primary">Availability</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                              <span className="text-sm font-medium">Status</span>
                              <Badge variant={listing.available ? "default" : "secondary"}>
                                {listing.available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                              <span className="text-sm font-medium">Pickup</span>
                              <Badge variant={listing.pickup_available ? "default" : "outline"}>
                                {listing.pickup_available ? "Available" : "Not Available"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                              <span className="text-sm font-medium">Delivery</span>
                              <Badge variant={listing.delivery_available ? "default" : "outline"}>
                                {listing.delivery_available ? "Available" : "Not Available"}
                              </Badge>
                            </div>
                            {listing.allow_offers && (
                              <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                                <span className="text-sm font-medium">Offers</span>
                                <Badge variant="default">Accepted</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="reviews" className="space-y-6">
                      <ReviewsList 
                        listingId={listing.id} 
                        refreshTrigger={reviewsRefreshTrigger}
                      />
                      <ReviewForm 
                        listingId={listing.id}
                        sellerId={listing.seller_id}
                        onReviewSubmitted={() => setReviewsRefreshTrigger(prev => prev + 1)}
                      />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Delivery & Collection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery & Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.pickup_available && (
                    <div className="flex items-start gap-3 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Collection Available</div>
                        <div className="text-xs text-muted-foreground">Free collection from {listing.location}</div>
                      </div>
                    </div>
                  )}
                  
                  {listing.delivery_available ? (
                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">Delivery Available</div>
                        <div className="text-xs text-muted-foreground">
                          {listing.delivery_cost ? `£${listing.delivery_cost}` : 'Price on request'}
                          {listing.delivery_radius && ` within ${listing.delivery_radius}km`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-sm">No Delivery</div>
                        <div className="text-xs text-muted-foreground">Collection only</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seller Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={(listing.profiles as any)?.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {(listing.profiles as any)?.username?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {(listing.profiles as any)?.username || 'Anonymous Seller'}
                        </h4>
                        {(listing.profiles as any)?.verified && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      {sellerRating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{sellerRating.averageRating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({sellerRating.totalReviews} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>Member since {new Date((listing.profiles as any)?.created_at).toLocaleDateString('en-GB')}</div>
                    {listing.updated_at !== listing.created_at && (
                      <div>Last updated {new Date(listing.updated_at).toLocaleDateString('en-GB')}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
        <BackToTop />

        {/* Message Dialog */}
        {showMessageDialog && (
          <MessageDialog
            open={showMessageDialog}
            onOpenChange={(open) => setShowMessageDialog(open)}
            sellerId={listing.seller_id}
            listingId={listing.id}
            listingTitle={listing.title}
          />
        )}

        {/* Offer Dialog */}
        {showOfferDialog && (
          <OfferDialog
            open={showOfferDialog}
            onOpenChange={(open) => setShowOfferDialog(open)}
            listingId={listing.id}
            sellerId={listing.seller_id}
            listingTitle={listing.title}
            listingPrice={listing.price}
            minimumOfferPercentage={listing.minimum_offer_percentage}
          />
        )}
      </div>
    </>
  );
};

export default ListingDetails;