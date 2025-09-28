import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Edit3, 
  Trash2, 
  Eye, 
  MessageCircle, 
  PoundSterling,
  Calendar,
  MapPin,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  status: string;
  images: string[];
  created_at: string;
  quantity: number;
  carbon_saved: number;
}

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ['myListings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Listing[];
    },
    enabled: !!user,
  });

  const handleDeleteListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Listing deleted',
        description: 'Your listing has been successfully deleted.',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error deleting listing',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Listing marked as ${newStatus}.`,
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Error updating status',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Listings</CardTitle>
          <CardDescription>Manage your construction material listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't created any listings yet</p>
            <Button onClick={() => navigate('/sell')}>
              Create Your First Listing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your Listings</h2>
          <p className="text-sm text-muted-foreground">
            You have {listings.length} listing{listings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => navigate('/sell')}>
          Create New Listing
        </Button>
      </div>

      <div className="grid gap-4">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Image */}
                  <div className="w-20 sm:w-24 aspect-[4/3] rounded bg-muted flex-shrink-0 overflow-hidden">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <PoundSterling className="h-3 w-3" />
                          {listing.price === 0 ? 'Free' : `£${listing.price.toLocaleString()}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(listing.created_at).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={listing.status === 'active' ? 'default' : 
                                   listing.status === 'sold' ? 'secondary' : 'outline'}
                        >
                          {listing.status}
                        </Badge>
                        <Badge variant="outline">{listing.condition}</Badge>
                        {listing.quantity > 1 && (
                          <Badge variant="outline">{listing.quantity} units</Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Listing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}/edit`)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {listing.status === 'active' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(listing.id, 'paused')}
                            >
                              Pause Listing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(listing.id, 'sold')}
                            >
                              Mark as Sold
                            </DropdownMenuItem>
                          </>
                        )}
                        {listing.status === 'paused' && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(listing.id, 'active')}
                          >
                            Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Listing
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteListing(listing.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyListings;