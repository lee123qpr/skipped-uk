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
import { formatCondition, formatReasonForSelling } from '@/lib/utils';
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
  PoundSterling,
  Weight,
  User,
  CheckCircle,
  Copy,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import BackToTop from '@/components/BackToTop';
import MessageDialog from '@/components/MessageDialog';
import OfferDialog from '@/components/OfferDialog';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList } from '@/components/ReviewsList';
import { StarRating } from '@/components/StarRating';
import { SellerOtherItems } from '@/components/SellerOtherItems';
import { ImageModal } from '@/components/ImageModal';
import { VerificationBadges } from '@/components/VerificationBadge';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const ListingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
            stripe_onboarding_complete,
            identity_verified,
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

  const handleContact = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to contact sellers.",
        variant: "destructive",
      });
      navigate('/sign-in');
      return;
    }

    // Check if there's an existing conversation with this seller about this listing
    try {
      const { data: existingMessages, error } = await supabase
        .from('messages')
        .select('id')
        .eq('listing_id', id!)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${listing.seller_id}),and(sender_id.eq.${listing.seller_id},receiver_id.eq.${user.id})`)
        .limit(1);

      if (error) throw error;

      if (existingMessages && existingMessages.length > 0) {
        // Navigate to message history
        navigate('/dashboard?tab=messages');
      } else {
        // Show message dialog for new conversation
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('Error checking messages:', error);
      // Fallback to showing dialog
      setShowMessageDialog(true);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase items.",
        variant: "destructive",
      });
      navigate('/sign-in');
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      
      // Calculate buyer protection fee (2.5% of price)
      const buyerProtectionFee = listing.price * 0.025;
      const totalAmount = listing.price + buyerProtectionFee;
      
      // Create transaction record
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount: listing.price,
          buyer_protection_fee: buyerProtectionFee,
          status: 'pending'
        })
        .select()
        .single();
      
      if (txError) throw txError;
      
      // Call payment intent edge function
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          transactionId: transaction.id,
          amount: totalAmount,
          buyerProtectionFee: buyerProtectionFee,
          returnUrl: `${window.location.origin}/listing/${listing.id}`
        }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe Checkout
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
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

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = listing?.title || 'Check out this item';
    const text = `Check out this ${listing?.title} on Skipped`;
    
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied",
            description: "Listing link copied to clipboard",
          });
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
          break;
        case 'email':
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: title,
              text: text,
              url: url,
            });
          }
          break;
        default:
          // Default to native share or copy
          if (navigator.share) {
            await navigator.share({
              title: title,
              text: text,
              url: url,
            });
          } else {
            await navigator.clipboard.writeText(url);
            toast({
              title: "Link copied",
              description: "Listing link copied to clipboard",
            });
          }
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
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

          {/* Image Gallery */}
          <div className="mb-8">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {listing.images.map((image, index) => (
                        <CarouselItem key={index}>
                          <div 
                            className="aspect-[4/3] lg:aspect-[16/9] bg-muted overflow-hidden cursor-pointer group"
                            onClick={() => handleImageClick(index)}
                          >
                            <img 
                              src={image} 
                              alt={`${listing.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                Click to view full size
                              </div>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {listing.images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                      </>
                    )}
                  </Carousel>
                ) : (
                  <div className="aspect-[4/3] lg:aspect-[16/9] bg-muted flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Title and Key Information */}
          <div className="mb-8">
            {/* Title, Category and Price */}
            <div className="mb-4">
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              {listing.categories && (
                <Badge variant="secondary" className="mb-3">
                  {listing.categories.name}
                </Badge>
              )}
              <div className="text-4xl font-bold text-primary mb-4">
                {listing.price === 0 ? 'Free' : `£${listing.price.toLocaleString()}`}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {user?.id !== listing.seller_id && (
                <>
                  <Button 
                    onClick={handleBuyNow}
                    size="lg"
                    className="flex-1 sm:flex-none sm:px-8"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PoundSterling className="mr-2 h-5 w-5" />
                        Buy Now
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleMakeOffer}
                    variant="secondary"
                    size="lg"
                    className="flex-1 sm:flex-none sm:px-8"
                  >
                    Make Offer
                  </Button>
                </>
              )}
              
              <Button 
                onClick={handleContact} 
                disabled={user?.id === listing.seller_id}
                variant={user?.id === listing.seller_id ? "default" : "outline"}
                className="flex-1 sm:flex-none sm:px-6"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {user?.id === listing.seller_id ? 'Your Listing' : 'Contact Seller'}
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleFavourite}>
                <Heart className={`h-4 w-4 ${isFavourited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Share this listing</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navigator.share && (
                    <>
                      <DropdownMenuItem onClick={() => handleShare('native')}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share...
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => handleShare('copy')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                    <Linkedin className="mr-2 h-4 w-4" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare('email')}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Listed Date */}
            <div className="flex items-center gap-2 text-muted-foreground mt-4 mb-6">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                Listed on {new Date(listing.created_at).toLocaleDateString('en-GB', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Key Information Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Location:</span>
                      <p className="font-medium">{listing.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Condition:</span>
                      <p className="font-medium">{formatCondition(listing.condition)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Quantity Available:</span>
                      <p className="font-medium">{listing.quantity} {listing.quantity === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>
                  {listing.weight && (
                    <div className="flex items-center gap-3">
                      <Weight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Weight:</span>
                        <p className="font-medium">{listing.weight}kg</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {listing.dimensions && typeof listing.dimensions === 'object' && (
                    <div className="flex items-center gap-3">
                      <Ruler className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Dimensions:</span>
                        <p className="font-medium">
                          {(listing.dimensions as any).length} × {(listing.dimensions as any).width} × {(listing.dimensions as any).height} {(listing.dimensions as any).unit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold mb-3 text-primary">Description</h4>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
              
              {/* Reason for Selling */}
              {listing.reason_for_selling && (
                <div>
                  <h4 className="font-semibold mb-3 text-primary">Reason for Selling</h4>
                  <p className="text-muted-foreground">{formatReasonForSelling(listing.reason_for_selling)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environmental Impact */}
          {listing.carbon_saved > 0 && (
            <Card className="mb-8 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Environmental Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 dark:text-green-300">
                  Purchasing this item saves approximately <span className="font-bold">{listing.carbon_saved}kg CO₂</span> from being released into the atmosphere by avoiding new production.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Delivery & Collection Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Delivery & Collection Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${listing.pickup_available ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">Collection Available:</span>
                    <span className={listing.pickup_available ? 'text-green-600' : 'text-red-600'}>
                      {listing.pickup_available ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {listing.pickup_available && (
                    <div className="ml-5 space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold">Location:</span> {listing.location}
                      </div>
                      {listing.collection_location && (
                        <div className="text-sm">
                          <span className="font-semibold">Collection from:</span> {listing.collection_location}
                        </div>
                      )}
                      {listing.collection_notes && (
                        <div className="text-sm p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                          <span className="font-medium text-amber-700 dark:text-amber-300">Collection Notes:</span>
                          <p className="text-amber-600 dark:text-amber-400 mt-1">{listing.collection_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${listing.delivery_available ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">Delivery Available:</span>
                    <span className={listing.delivery_available ? 'text-green-600' : 'text-red-600'}>
                      {listing.delivery_available ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {listing.delivery_available && (
                    <div className="ml-5 space-y-2">
                      {listing.delivery_cost && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Delivery cost:</span> £{listing.delivery_cost}
                        </p>
                      )}
                      {listing.delivery_radius !== null && listing.delivery_radius !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Delivery:</span> {listing.delivery_radius === 0 ? 'Via courier/post' : `${listing.delivery_radius} miles`}
                        </p>
                      )}
                      {listing.delivery_notes && (
                        <div className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                          <span className="font-medium text-blue-700 dark:text-blue-300">Delivery Notes:</span>
                          <p className="text-blue-600 dark:text-blue-400 mt-1">{listing.delivery_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>About the Seller</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={listing.profiles?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {listing.profiles?.username || 'Seller'}
                        </h3>
                      </div>
                      
                      {/* Verification Badges */}
                      <div className="mb-3">
                        <VerificationBadges
                          emailVerified={listing.profiles?.verified || false}
                          stripeVerified={listing.profiles?.stripe_onboarding_complete || false}
                          identityVerified={listing.profiles?.identity_verified || false}
                          size="sm"
                          showLabel={true}
                        />
                      </div>
                      
                      {sellerRating && (
                        <div className="flex items-center gap-2 mb-3">
                          <StarRating 
                            rating={Math.round(sellerRating.averageRating)} 
                            readonly 
                            size="sm"
                            showCount
                            count={sellerRating.totalReviews}
                          />
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(listing.profiles?.created_at || '').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <SellerOtherItems 
                sellerId={listing.seller_id}
                currentListingId={listing.id}
                sellerUsername={listing.profiles?.username}
              />
            </div>
          </div>

          {/* Reviews Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Reviews & Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList listingId={listing.id} refreshTrigger={reviewsRefreshTrigger} />
            </CardContent>
          </Card>
        </main>

        <Footer />
        <BackToTop />

        {/* Dialogs */}
        <MessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          listingId={listing.id}
          sellerId={listing.seller_id}
          listingTitle={listing.title}
        />
        
        <OfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          listingId={listing.id}
          sellerId={listing.seller_id}
          listingTitle={listing.title}
          listingPrice={listing.price}
        />

        {/* Image Modal */}
        <ImageModal
          images={listing.images || []}
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          initialIndex={selectedImageIndex}
        />
      </div>
    </>
  );
};

export default ListingDetails;