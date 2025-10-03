import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ListingCard from "./ListingCard";
import { ListingCardSkeleton } from "@/components/LoadingSkeletons";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: "excellent" | "good" | "fair" | "new" | "like_new" | "salvage" | "parts_repair";
  images: string[];
  carbonSaved: number;
  seller: {
    username: string;
    verified: boolean;
    rating: number;
    reviewCount?: number;
  };
  postedDate: string;
  quantity?: number;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  weight?: number;
  dimensions?: any;
  allowOffers?: boolean;
}

const FeaturedListings = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      setLoading(true);
      const { data: listingsData, error } = await supabase
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
          quantity,
          weight,
          dimensions,
          delivery_available,
          pickup_available,
          profiles:seller_id (
            username,
            verified,
            stripe_onboarding_complete,
            identity_verified
          )
        `)
        .eq('status', 'active')
        .eq('available', true)
        .order('carbon_saved', { ascending: false, nullsFirst: false })
        .limit(4);

      if (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
        return;
      }

      console.log('Fetched listings data:', listingsData);

      const formattedListings: Listing[] = listingsData?.map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        price: Number(listing.price),
        location: listing.location,
        condition: listing.condition as "excellent" | "good" | "fair" | "new" | "like_new" | "salvage" | "parts_repair",
        images: listing.images?.length > 0 ? listing.images : ["/api/placeholder/400/300"],
        carbonSaved: Number(listing.carbon_saved || 0),
        seller: {
          username: listing.profiles?.username || "Anonymous",
          verified: listing.profiles?.verified || false,
          rating: 0, // No ratings yet - will be calculated from reviews later
          reviewCount: 0 // No reviews yet
        },
        postedDate: listing.created_at,
        quantity: listing.quantity,
        deliveryAvailable: listing.delivery_available,
        pickupAvailable: listing.pickup_available,
        sellerVerified: listing.profiles?.verified || false,
        sellerStripeVerified: listing.profiles?.stripe_onboarding_complete || false,
        sellerIdentityVerified: listing.profiles?.identity_verified || false,
        weight: listing.weight,
        dimensions: listing.dimensions
      })) || [];

      console.log('Formatted listings:', formattedListings);
      setListings(formattedListings);
    } catch (error) {
      console.error('Error fetching featured listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {listings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured listings available at the moment.</p>
          </div>
        )}

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