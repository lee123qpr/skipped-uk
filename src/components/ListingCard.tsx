import { Heart, MapPin, User, Calendar, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import CarbonBadge from "./CarbonBadge";
import { StarRating } from "./StarRating";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: "new" | "excellent" | "good" | "fair";
  images: string[];
  carbonSaved: number;
  seller: {
    username: string;
    verified: boolean;
    rating: number;
    reviewCount?: number;
  };
  postedDate: string;
  isFavorited?: boolean;
  className?: string;
}

const ListingCard = ({ 
  id,
  title, 
  price, 
  location, 
  condition, 
  images, 
  carbonSaved, 
  seller, 
  postedDate,
  isFavorited = false,
  className = "" 
}: ListingCardProps) => {
  const navigate = useNavigate();
  
  const conditionColors = {
    new: "text-success",
    excellent: "text-success",
    good: "text-warning",
    fair: "text-muted-foreground"
  };

  const handleCardClick = () => {
    navigate(`/listing/${id}`);
  };

  return (
    <Card 
      className={`group cursor-pointer transition-smooth hover:shadow-medium bg-card border-border overflow-hidden ${className}`}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {images[0] ? (
          <img 
            src={images[0]} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <div className="text-muted-foreground">No image</div>
          </div>
        )}
        
        {/* Favorite Button */}
        <Button 
          size="icon" 
          variant="ghost"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement favourite functionality
          }}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </Button>

        {/* Carbon Badge */}
        <div className="absolute bottom-3 left-3">
          <CarbonBadge carbonSaved={carbonSaved} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Price */}
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-smooth line-clamp-2 flex-1 mr-2">
            {title}
          </h3>
          <div className="text-lg font-bold text-primary">
            {price === 0 ? 'Free' : `£${price.toLocaleString()}`}
          </div>
        </div>

        {/* Condition */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Condition:</span>
          <span className={`capitalize font-medium ${conditionColors[condition]}`}>
            {condition}
          </span>
        </div>

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{postedDate}</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">
            @{seller.username || 'Anonymous'}
            {seller.verified && (
              <span className="ml-1 text-accent">✓</span>
            )}
          </span>
          {seller.reviewCount && seller.reviewCount > 0 && (
            <div className="ml-auto">
              <StarRating 
                rating={seller.rating} 
                readonly 
                size="sm" 
                showCount 
                count={seller.reviewCount}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ListingCard;