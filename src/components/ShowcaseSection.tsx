import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const ShowcaseSection = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowcaseListings();
  }, []);

  const fetchShowcaseListings = async () => {
    try {
      setLoading(true);
      // First try to get featured listings
      let { data: listingsData, error } = await supabase
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
          public_safe_profiles!inner (
            username,
            verified,
            stripe_onboarding_complete,
            identity_verified
          )
        `)
        .eq('status', 'active')
        .eq('available', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      // Fallback to recent listings if no featured items
      if (!error && (!listingsData || listingsData.length === 0)) {
        const fallback = await supabase
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
            public_safe_profiles!inner (
              username,
              verified,
              stripe_onboarding_complete,
              identity_verified
            )
          `)
          .eq('status', 'active')
          .eq('available', true)
          .order('created_at', { ascending: false })
          .limit(4);
        
        listingsData = fallback.data;
        error = fallback.error;
      }

      if (error) {
        setListings([]);
        return;
      }

      const formattedListings: Listing[] = listingsData?.map((listing: any) => ({
        id: listing.id,
        title: listing.title,
        price: Number(listing.price),
        location: listing.location,
        condition: listing.condition as "excellent" | "good" | "fair" | "new" | "like_new" | "salvage" | "parts_repair",
        images: listing.images?.length > 0 ? listing.images : ["/api/placeholder/400/300"],
        carbonSaved: Number(listing.carbon_saved || 0),
        seller: {
          username: listing.public_safe_profiles?.username || "Anonymous",
          verified: listing.public_safe_profiles?.verified || false,
          rating: 0, // No ratings yet - will be calculated from reviews later
          reviewCount: 0 // No reviews yet
        },
        postedDate: listing.created_at,
        quantity: listing.quantity,
        deliveryAvailable: listing.delivery_available,
        pickupAvailable: listing.pickup_available,
        sellerVerified: listing.public_safe_profiles?.verified || false,
        sellerStripeVerified: listing.public_safe_profiles?.stripe_onboarding_complete || false,
        sellerIdentityVerified: listing.public_safe_profiles?.identity_verified || false,
        weight: listing.weight,
        dimensions: listing.dimensions
      })) || [];

      setListings(formattedListings);
    } catch (error) {
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
            Featured Items
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover quality construction materials from verified sellers across the UK
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
            <p className="text-muted-foreground">No listings available at the moment.</p>
          </div>
        )}

        <div className="text-center">
          <Button variant="default" size="lg" asChild>
            <Link to="/browse">
              Browse All Listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;