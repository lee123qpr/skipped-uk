import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
      navigate('/auth');
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
      navigate('/auth');
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
      navigate('/auth');
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
        
        <main className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images and Media */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {listing.images && listing.images.length > 0 ? (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description and Reviews Tabs */}
              <Card className="mt-6">
                <Tabs defaultValue="description" className="w-full">
                  <CardHeader>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="description">Description</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="description">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {listing.description}
                      </p>
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

              {/* Specifications */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{listing.condition}</Badge>
                      <span className="text-sm text-muted-foreground">Condition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{listing.quantity} unit{listing.quantity !== 1 ? 's' : ''}</span>
                    </div>
                    {listing.dimensions && typeof listing.dimensions === 'object' && (
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(listing.dimensions as any).length}×{(listing.dimensions as any).width}×{(listing.dimensions as any).height} {(listing.dimensions as any).unit}
                        </span>
                      </div>
                    )}
                    {listing.weight && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{listing.weight}kg</span>
                      </div>
                    )}
                  </div>
                  
                  {listing.carbon_saved > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Leaf className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        Saves approximately {listing.carbon_saved}kg CO₂
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price and Actions */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold">
                        {listing.price === 0 ? 'Free' : `£${listing.price.toLocaleString()}`}
                      </div>
                      {listing.categories && (
                        <p className="text-muted-foreground">{listing.categories.name}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{listing.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Listed {new Date(listing.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      {(listing.delivery_available || listing.pickup_available) && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {listing.pickup_available && listing.delivery_available 
                              ? 'Pickup & Delivery available'
                              : listing.delivery_available 
                                ? 'Delivery available'
                                : 'Pickup only'
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
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
                  </div>
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Seller Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarImage src={(listing.profiles as any)?.avatar_url} />
                      <AvatarFallback>
                        {(listing.profiles as any)?.username?.charAt(0)?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          @{(listing.profiles as any)?.username || 'Anonymous'}
                        </span>
                        {(listing.profiles as any)?.verified && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">No reviews yet</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Member since {new Date((listing.profiles as any)?.created_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Options */}
              {(listing.delivery_available || listing.pickup_available) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery & Pickup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {listing.pickup_available && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Pickup available</span>
                        <Badge variant="outline">Free</Badge>
                      </div>
                    )}
                    {listing.delivery_available && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Delivery available</span>
                          <Badge variant="outline">
                            {listing.delivery_cost === 0 ? 'Free' : `£${listing.delivery_cost}`}
                          </Badge>
                        </div>
                        {listing.delivery_radius && (
                          <p className="text-xs text-muted-foreground">
                            Within {listing.delivery_radius} miles
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>

        <Footer />
        
        {showMessageDialog && (
          <MessageDialog
            listingId={listing.id}
            sellerId={listing.seller_id}
            listingTitle={listing.title}
            open={showMessageDialog}
            onOpenChange={setShowMessageDialog}
          />
        )}

        {showOfferDialog && (
          <OfferDialog
            listingId={listing.id}
            sellerId={listing.seller_id}
            listingTitle={listing.title}
            listingPrice={listing.price}
            minimumOfferPercentage={listing.minimum_offer_percentage}
            open={showOfferDialog}
            onOpenChange={setShowOfferDialog}
          />
        )}
      </div>
    </>
  );
};

export default ListingDetails;