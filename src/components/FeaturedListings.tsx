import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingCard from "./ListingCard";

const featuredListings = [
  {
    id: "1",
    title: "Reclaimed Oak Beams - Grade A Quality",
    price: 2450,
    location: "Birmingham",
    condition: "excellent" as const,
    images: ["/api/placeholder/400/300"],
    carbonSaved: 847,
    seller: {
      name: "Heritage Timber Co.",
      verified: true,
      rating: 4.9
    },
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
    seller: {
      name: "Metro Building Supplies",
      verified: true,
      rating: 4.7
    },
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
    seller: {
      name: "Green Build Solutions",
      verified: false,
      rating: 4.5
    },
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
    seller: {
      name: "Scottish Steel Reclaim",
      verified: true,
      rating: 4.8
    },
    postedDate: "1 day ago"
  }
];

const FeaturedListings = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            High Carbon Savings
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            These materials offer exceptional environmental impact - save money while making a real difference
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredListings.map((listing) => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="default" size="lg">
            View All High Impact Items
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;