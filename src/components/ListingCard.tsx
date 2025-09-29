import { Heart, MapPin, Calendar, Package, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: "new" | "excellent" | "good" | "fair";
  images: string[];
  postedDate: string;
  isFavorited?: boolean;
  className?: string;
  quantity?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  allowOffers?: boolean;
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
  allowOffers
}: ListingCardProps) => {
  const navigate = useNavigate();
  
  const conditionConfig = {
    new: { label: "NEW", className: "bg-success text-white border-success" },
    excellent: { label: "EXCELLENT", className: "bg-success text-white border-success" },
    good: { label: "GOOD", className: "bg-warning text-white border-warning" },
    fair: { label: "FAIR", className: "bg-muted-foreground text-white border-muted-foreground" }
  };

  // Normalize condition to lowercase and provide fallback
  const normalizedCondition = condition?.toLowerCase() as keyof typeof conditionConfig;
  const conditionDisplay = conditionConfig[normalizedCondition] || { 
    label: (condition || "USED").toUpperCase(), 
    className: "bg-muted-foreground text-white border-muted-foreground" 
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
      className={`group cursor-pointer transition-smooth hover:shadow-medium bg-card border-border overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      {/* Image Carousel */}
      <div className="relative aspect-[4/3] bg-muted">
        {images && images.length > 0 ? (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="relative aspect-[4/3] overflow-hidden">
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
                  className="left-2" 
                  onClick={(e) => e.stopPropagation()}
                />
                <CarouselNext 
                  className="right-2" 
                  onClick={(e) => e.stopPropagation()}
                />
                {/* Image Counter Badge */}
                <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-md">
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
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement favourite functionality
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Price */}
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-bold text-base text-card-foreground group-hover:text-primary transition-smooth line-clamp-2 flex-1">
            {title}
          </h3>
          <div className="text-2xl font-bold text-primary whitespace-nowrap">
            {price === 0 ? 'Free' : `£${price.toLocaleString()}`}
          </div>
        </div>

        {/* Condition Badge, Quantity, and Offers */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className={`${conditionDisplay.className} font-semibold px-3 py-1`}
          >
            {conditionDisplay.label}
          </Badge>
          {(typeof quantity === 'number' && quantity > 1) && (
            <Badge variant="outline" className="gap-1 bg-primary text-primary-foreground border-primary font-semibold px-3 py-1">
              <Package className="h-3 w-3" />
              {quantity} UNITS
            </Badge>
          )}
          {allowOffers && (
            <Badge variant="outline" className="bg-accent text-accent-foreground border-accent font-semibold px-3 py-1">
              OPEN TO OFFERS
            </Badge>
          )}
        </div>

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">{getRelativeDate(postedDate)}</span>
          </div>
        </div>
        
        {/* Delivery/Pickup Icons */}
        {(deliveryAvailable || pickupAvailable) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <Truck className="h-3.5 w-3.5" />
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
      </div>
    </Card>
  );
};

export default ListingCard;