import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MyListingSkeleton } from '@/components/LoadingSkeletons';
import { EmptyState } from '@/components/EmptyState';
import { 
  Heart, 
  Trash2, 
  Eye, 
  PoundSterling,
  Calendar,
  MapPin,
  Package
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Favourite {
  id: string;
  created_at: string;
  listing_id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    location: string;
    condition: string;
    status: string;
    images: string[];
    created_at: string;
  };
}

const FavouritesTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favourites = [], isLoading, refetch } = useQuery({
    queryKey: ['favourites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get favourites with listing details
      const { data: favouriteRecords, error: favouritesError } = await supabase
        .from('favourites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (favouritesError) throw favouritesError;
      if (!favouriteRecords || favouriteRecords.length === 0) return [];

      // Get listing details
      const listingIds = favouriteRecords.map(f => f.listing_id);
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, location, condition, status, images, created_at')
        .in('id', listingIds);
      
      if (listingsError) throw listingsError;

      // Combine data
      return favouriteRecords.map(favourite => ({
        ...favourite,
        listing: listings?.find(l => l.id === favourite.listing_id) || null
      })).filter(f => f.listing !== null) as Favourite[];
    },
    enabled: !!user,
  });

  const handleRemoveFavourite = async (favouriteId: string, listingTitle: string) => {
    try {
      const { error } = await supabase
        .from('favourites')
        .delete()
        .eq('id', favouriteId);

      if (error) throw error;

      toast({
        title: 'Removed from favourites',
        description: `"${listingTitle}" has been removed from your favourites.`,
      });

      // Invalidate both query keys to update all components
      queryClient.invalidateQueries({ queryKey: ['favourites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-favourites'] });
      refetch();
    } catch (error) {
      toast({
        title: 'Error removing favourite',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-muted animate-pulse rounded mt-1"></div>
          </div>
          <div className="h-9 w-28 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <MyListingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (favourites.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favourites yet"
        description="Save construction materials you're interested in to view them here for easy access later."
        actionLabel="Browse Materials"
        onAction={() => navigate('/browse')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Favourites</h2>
          <p className="text-sm text-muted-foreground">
            You have {favourites.length} saved item{favourites.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/browse')}>
          Browse More
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
        {favourites.map((favourite) => {
          // Handle cases where listing might be hidden by RLS (e.g., paused)
          if (!favourite.listing) {
            return (
              <Card key={favourite.id} className="shadow-soft border-muted">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-muted-foreground">Listing No Longer Available</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        This listing has been removed or is temporarily unavailable.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFavourite(favourite.id, 'this listing')}
                      className="text-xs"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
          <Card key={favourite.id} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {/* Image */}
                <div className="w-24 sm:w-28 md:w-32 aspect-[4/3] rounded-lg bg-muted flex-shrink-0 overflow-hidden border"
                >
                  {favourite.listing.images && favourite.listing.images.length > 0 ? (
                    <img 
                      src={favourite.listing.images[0]} 
                      alt={favourite.listing.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{favourite.listing.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <PoundSterling className="h-3 w-3" />
                          {favourite.listing.price === 0 ? 'Free' : `£${favourite.listing.price.toLocaleString()}`}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{favourite.listing.location}</span>
                        </span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="h-3 w-3" />
                          <span className="whitespace-nowrap">Listed {new Date(favourite.listing.created_at).toLocaleDateString('en-GB')}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Only show status if NOT active (to alert user) */}
                        {favourite.listing.status !== 'active' && (
                          <Badge variant="secondary">
                            {favourite.listing.status === 'paused' ? 'Temporarily Unavailable' : 
                             favourite.listing.status === 'sold' ? 'Sold' : favourite.listing.status}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {favourite.listing.condition.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1 fill-red-500 text-red-500" />
                          Saved {new Date(favourite.created_at).toLocaleDateString('en-GB')}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/listing/${favourite.listing.id}`, { 
                          state: { fromFavourites: true } 
                        })}
                        className="text-xs px-3 w-full sm:w-auto"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs px-3 w-full sm:w-auto"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from Favourites</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{favourite.listing.title}" from your favourites?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveFavourite(favourite.id, favourite.listing.title)}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
};

export default FavouritesTab;