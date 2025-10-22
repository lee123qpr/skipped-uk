import { Heart, MapPin, Calendar, Package, Truck, Leaf, PauseCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { VerificationBadges } from "@/components/VerificationBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: "new" | "like_new" | "excellent" | "good" | "fair" | "salvage" | "parts_repair";
  images: string[];
  postedDate: string;
  isFavorited?: boolean;
  className?: string;
  quantity?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  allowOffers?: boolean;
  variant?: "grid" | "list";
  sellerVerified?: boolean;
  sellerStripeVerified?: boolean;
  sellerIdentityVerified?: boolean;
  carbonSaved?: number;
  available?: boolean;
  isOwnListing?: boolean;
}

const ListingCard = ({ 
  id,
  title, 
  price, 
  location, 
  condition, 
  images, 
  postedDate,
  isFavorited = false,
  className = "",
  quantity,
  deliveryAvailable,
  pickupAvailable,
  allowOffers,
  variant = "grid",
  sellerVerified = false,
  sellerStripeVerified = false,
  sellerIdentityVerified = false,
  carbonSaved = 0,
  available = true,
  isOwnListing = false
}: ListingCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const conditionConfig = {
    new: { label: "NEW", className: "bg-[#22C55E] text-white border-0 shadow-sm" },
    like_new: { label: "LIKE NEW", className: "bg-[#10B981] text-white border-0 shadow-sm" },
    excellent: { label: "EXCELLENT", className: "bg-[#3B82F6] text-white border-0 shadow-sm" },
    good: { label: "GOOD", className: "bg-[#F59E0B] text-white border-0 shadow-sm" },
    fair: { label: "FAIR", className: "bg-[#64748B] text-white border-0 shadow-sm" },
    salvage: { label: "SALVAGE", className: "bg-[#EF4444] text-white border-0 shadow-sm" },
    parts_repair: { label: "PARTS/REPAIR", className: "bg-[#DC2626] text-white border-0 shadow-sm" }
  };

  // Normalize condition to lowercase and provide fallback
  const normalizedCondition = condition?.toLowerCase() as keyof typeof conditionConfig;
  const conditionDisplay = conditionConfig[normalizedCondition] || { 
    label: (condition || "USED").toUpperCase(), 
    className: "bg-[#9333EA] text-white border-0 shadow-sm" 
  };

  const getRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const handleCardClick = () => {
    navigate(`/listing/${id}`);
  };

  return (
    <Card 
      className={`group cursor-pointer transition-smooth hover:shadow-medium bg-card border-border overflow-hidden ${variant === "list" ? "flex flex-row items-center" : ""} ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Carousel */}
      <div 
        className={`relative ${variant === "list" ? "w-32 sm:w-48 h-32 sm:h-36 flex-shrink-0 overflow-hidden rounded-md m-2 border border-border/50" : ""}`}
      >
        {/* Paused Overlay */}
        {isOwnListing && !available && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2">
            <PauseCircle className="h-12 w-12 text-muted-foreground" />
            <div className="text-center px-4">
              <p className="font-semibold text-foreground">Listing Paused</p>
              <p className="text-xs text-muted-foreground">Not visible to others</p>
            </div>
          </div>
        )}
        
        {images && images.length > 0 ? (
          <Carousel 
            className="w-full h-full"
            opts={{
              loop: true,
              dragFree: true,
            }}
          >
            <CarouselContent className="h-full -ml-0">
              {images.map((image, index) => (
                <CarouselItem key={index} className="h-full pl-0">
                  <div className={`relative w-full h-full overflow-hidden ${variant === "list" ? "" : "aspect-[4/3]"}`}>
                    <img 
                      src={image} 
                      alt={`${title} - Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      loading="lazy"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious 
                  className="left-2 z-20" 
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <CarouselNext 
                  className="right-2 z-20" 
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                {/* Image Counter Badge */}
                <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-md z-10">
                  {images.length} photos
                </div>
              </>
            )}
          </Carousel>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-muted-foreground">No image</div>
          </div>
        )}
        
        {/* Favorite Button */}
        <Button 
          size="icon" 
          variant="ghost"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background z-10"
          onClick={async (e) => {
            e.stopPropagation();
            if (!user) {
              toast({
                title: "Sign in required",
                description: "You need to be signed in to save favourites. Please sign in or create an account.",
                variant: "default",
              });
              return;
            }
            
            try {
              if (isFavorited) {
                // Remove from favourites
                const { error } = await supabase
                  .from('favourites')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('listing_id', id);
                
                if (error) throw error;
                
                toast({
                  title: "Removed from favourites",
                  description: "This listing has been removed from your favourites.",
                });
              } else {
                // Add to favourites
                const { error } = await supabase
                  .from('favourites')
                  .insert({
                    user_id: user.id,
                    listing_id: id
                  });
                
                if (error) throw error;
                
                toast({
                  title: "Added to favourites",
                  description: "This listing has been saved to your favourites.",
                });
              }
              
              // Invalidate and refetch favourites without page reload
              queryClient.invalidateQueries({ queryKey: ['user-favourites', user.id] });
              queryClient.invalidateQueries({ queryKey: ['favourites', user.id] });
              // Also invalidate the seller's listings to update engagement counts
              queryClient.invalidateQueries({ queryKey: ['myListings'] });
        } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update favourites. Please try again.",
                variant: "destructive",
              });
            }
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {/* Content */}
      <div className={`${variant === "list" ? "p-2 sm:p-3 flex flex-col justify-between flex-1 min-w-0" : "p-4 space-y-3"}`}>
        {/* Title and Price */}
        <div className="flex justify-between items-start gap-2">
          <h3 className={`font-bold text-[#047857] group-hover:text-[#059669] transition-smooth line-clamp-2 flex-1 ${variant === "list" ? "text-sm sm:text-base" : "text-lg"}`}>
            {title}
          </h3>
          <div className={`font-bold text-[#047857] whitespace-nowrap flex-shrink-0 ${variant === "list" ? "text-lg sm:text-2xl" : "text-3xl"}`}>
            {price === 0 ? 'Free' : `£${price.toLocaleString()}`}
          </div>
        </div>

        {/* Badges: Condition, Quantity, Carbon Saved, and Offers */}
        <div className={`flex items-center gap-1.5 flex-wrap ${variant === "list" ? "gap-1" : "gap-2"}`}>
          <Badge 
            variant="outline" 
            className={`${conditionDisplay.className} font-bold text-xs tracking-wider rounded-full border-0 ${variant === "list" ? "px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs" : "px-4 py-1.5"}`}
          >
            {conditionDisplay.label}
          </Badge>
          {(typeof quantity === 'number' && quantity > 1) && (
            <Badge variant="outline" className={`bg-[#047857] text-white border-0 font-bold text-xs tracking-wider rounded-full shadow-sm flex items-center gap-1 ${variant === "list" ? "px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs" : "px-4 py-1.5 gap-1.5"}`}>
              <Package className={variant === "list" ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3.5 w-3.5"} />
              {quantity} UNITS
            </Badge>
          )}
          {carbonSaved > 0 && (
            <Badge variant="outline" className={`bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold text-xs tracking-wider rounded-full shadow-sm flex items-center gap-1 ${variant === "list" ? "px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs" : "px-4 py-1.5 gap-1.5"}`}>
              <Leaf className={variant === "list" ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3.5 w-3.5"} />
              {carbonSaved.toFixed(0)} kg CO₂
            </Badge>
          )}
          {allowOffers && (
            <Badge variant="outline" className={`bg-[#8B5CF6] text-white border-0 font-bold text-xs tracking-wider rounded-full shadow-sm ${variant === "list" ? "px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs hidden sm:inline-flex" : "px-4 py-1.5"}`}>
              OPEN TO OFFERS
            </Badge>
          )}
        </div>

        {/* Location and Date */}
        <div className={`flex items-center justify-between text-muted-foreground ${variant === "list" ? "text-xs sm:text-sm" : "text-sm"}`}>
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <MapPin className={variant === "list" ? "h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" : "h-3.5 w-3.5"} />
            <span className="truncate">{location}</span>
          </div>
          <div className={`flex items-center gap-1 flex-shrink-0 ${variant === "list" ? "hidden sm:flex" : ""}`}>
            <Calendar className={variant === "list" ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-3.5 w-3.5"} />
            <span className="whitespace-nowrap">{getRelativeDate(postedDate)}</span>
          </div>
        </div>
        
        {/* Delivery/Pickup Icons */}
        {(deliveryAvailable || pickupAvailable) && (
          <div className={`flex items-center gap-1.5 text-muted-foreground ${variant === "list" ? "text-xs sm:text-sm pt-0.5" : "text-sm pt-1"}`}>
            <Truck className={variant === "list" ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-3.5 w-3.5"} />
            <span>
              {deliveryAvailable && pickupAvailable 
                ? 'Pickup & Delivery'
                : deliveryAvailable 
                  ? 'Delivery available'
                  : 'Pickup only'
              }
            </span>
          </div>
        )}
        
        {/* Seller Verification Badges */}
        {(sellerVerified || sellerStripeVerified || sellerIdentityVerified) && variant !== "list" && (
          <div className="pt-2 border-t">
            <VerificationBadges
              emailVerified={sellerVerified}
              stripeVerified={sellerStripeVerified}
              identityVerified={sellerIdentityVerified}
              size="sm"
              showLabel={true}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ListingCard;