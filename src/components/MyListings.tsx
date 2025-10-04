import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreVertical, 
  Pencil, 
  Eye, 
  Trash2, 
  PlayCircle, 
  PauseCircle, 
  CheckCircle,
  Heart,
  MessageCircle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Package,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MyListingSkeleton } from "./LoadingSkeletons";
import { EmptyState } from "./EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";

interface Listing {
  id: string;
  title: string;
  price: number;
  location: string;
  status: string;
  condition: string;
  images: string[];
  created_at: string;
  updated_at: string;
  view_count: number;
  favourite_count?: number;
  message_count?: number;
  unread_message_count?: number;
  active_transactions?: Array<{
    id: string;
    status: string;
    buyer_id: string;
    created_at: string;
  }>;
  completed_transaction?: {
    id: string;
    completed_at: string;
  };
}

interface ListingSection {
  title: string;
  icon: React.ReactNode;
  listings: Listing[];
  variant: "default" | "destructive" | "outline" | "secondary";
}

const MyListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteListingId, setDeleteListingId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const { data: listings, isLoading, refetch } = useQuery({
    queryKey: ['myListings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch listings with all related data
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      if (!listingsData) return [];

      // Fetch transactions for each listing
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('id, listing_id, status, buyer_id, created_at, completed_at')
        .in('listing_id', listingsData.map(l => l.id));

      // Fetch message counts
      const { data: messagesData } = await supabase
        .from('messages')
        .select('listing_id, read')
        .eq('receiver_id', user.id)
        .in('listing_id', listingsData.map(l => l.id));

      // Fetch favourite counts
      const { data: favouritesData } = await supabase
        .from('favourites')
        .select('listing_id')
        .in('listing_id', listingsData.map(l => l.id));

      // Enrich listings with analytics
      return listingsData.map(listing => {
        const transactions = transactionsData?.filter(t => t.listing_id === listing.id) || [];
        const messages = messagesData?.filter(m => m.listing_id === listing.id) || [];
        const favourites = favouritesData?.filter(f => f.listing_id === listing.id) || [];
        
        const activeTransactions = transactions.filter(t => 
          ['pending_payment', 'paid', 'dispatched', 'delivered'].includes(t.status)
        );
        
        const completedTransaction = transactions.find(t => t.status === 'completed');

        return {
          ...listing,
          view_count: listing.view_count || 0,
          favourite_count: favourites.length,
          message_count: messages.length,
          unread_message_count: messages.filter(m => !m.read).length,
          active_transactions: activeTransactions,
          completed_transaction: completedTransaction,
        };
      });
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
    } finally {
      setDeleteListingId(null);
    }
  };

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (error) throw error;

      if (newStatus === 'sold') {
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('listing_id', listingId)
          .eq('status', 'pending');

        if (transactionError) {
          console.error('Error completing transactions:', transactionError);
        }

        toast({
          title: 'Listing sold!',
          description: 'Transaction completed. Both parties can now leave reviews.',
        });
      } else {
        toast({
          title: 'Status updated',
          description: `Listing marked as ${newStatus}.`,
        });
      }

      refetch();
    } catch (error) {
      toast({
        title: 'Error updating status',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = () => {
    if (deleteListingId) {
      handleDeleteListing(deleteListingId);
    }
  };

  // Categorise listings into sections
  const categorizeListings = (listings: Listing[]): ListingSection[] => {
    const activeListings = listings.filter(l => 
      l.status === 'active' && 
      (!l.active_transactions || l.active_transactions.length === 0) &&
      !l.completed_transaction
    );

    const inProgressListings = listings.filter(l => 
      l.active_transactions && l.active_transactions.length > 0
    );

    const disputedListings = listings.filter(l => 
      l.active_transactions?.some(t => 
        t.status.includes('disputed')
      )
    );

    const completedListings = listings.filter(l => 
      l.completed_transaction && l.status !== 'sold'
    );

    const pausedListings = listings.filter(l => l.status === 'paused');
    const soldListings = listings.filter(l => l.status === 'sold');

    return [
      {
        title: 'Active Listings',
        icon: <Package className="h-4 w-4" />,
        listings: activeListings,
        variant: 'default' as const,
      },
      {
        title: 'In Progress',
        icon: <Clock className="h-4 w-4" />,
        listings: inProgressListings,
        variant: 'secondary' as const,
      },
      {
        title: 'In Dispute',
        icon: <AlertTriangle className="h-4 w-4" />,
        listings: disputedListings,
        variant: 'destructive' as const,
      },
      {
        title: 'Completed Sales',
        icon: <CheckCircle className="h-4 w-4" />,
        listings: completedListings,
        variant: 'default' as const,
      },
      {
        title: 'Paused',
        icon: <PauseCircle className="h-4 w-4" />,
        listings: pausedListings,
        variant: 'outline' as const,
      },
      {
        title: 'Sold',
        icon: <CheckCircle className="h-4 w-4" />,
        listings: soldListings,
        variant: 'secondary' as const,
      },
    ].filter(section => section.listings.length > 0);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getDaysListed = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getEngagementBadge = (listing: Listing) => {
    const daysListed = getDaysListed(listing.created_at);

    if (listing.completed_transaction && getDaysListed(listing.created_at) <= 7) {
      return <Badge variant="default" className="bg-green-600">Quick Sale</Badge>;
    }
    if (listing.view_count >= 50 || (listing.favourite_count || 0) >= 10) {
      return <Badge variant="default">High Interest</Badge>;
    }
    if (daysListed >= 14 && listing.view_count < 10) {
      return <Badge variant="outline">Low Engagement</Badge>;
    }
    return null;
  };

  const getTransactionStatusBadge = (listing: Listing) => {
    if (!listing.active_transactions || listing.active_transactions.length === 0) return null;

    const transaction = listing.active_transactions[0];
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending_payment: { label: 'Awaiting Payment', variant: 'outline' },
      paid: { label: 'Awaiting Dispatch', variant: 'default' },
      dispatched: { label: 'In Transit', variant: 'default' },
      delivered: { label: 'Delivered', variant: 'default' },
    };

    const status = statusMap[transaction.status];
    if (!status) return null;

    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <MyListingSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No listings yet"
        description="You haven't created any listings. Start by creating your first listing."
        actionLabel="Create Listing"
        onAction={() => navigate('/sell')}
      />
    );
  }

  const sections = categorizeListings(listings);

  return (
    <>
      <div className="space-y-6">
        {sections.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections[section.title] !== false}
            onOpenChange={() => toggleSection(section.title)}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <Badge variant={section.variant}>
                        {section.listings.length}
                      </Badge>
                    </div>
                    {openSections[section.title] !== false ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {section.listings.map((listing) => (
                    <Card key={listing.id} className="overflow-hidden">
                      <div className="md:flex">
                        <div className="md:w-48 md:flex-shrink-0">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="h-48 w-full object-cover md:h-full"
                            />
                          ) : (
                            <div className="h-48 w-full bg-muted flex items-center justify-center md:h-full">
                              <span className="text-muted-foreground">No image</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                                  <p className="text-2xl font-bold text-primary mt-1">
                                    £{listing.price.toLocaleString()}
                                  </p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Listing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}/edit`)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {listing.status === 'active' && (
                                      <>
                                        <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'paused')}>
                                          <PauseCircle className="mr-2 h-4 w-4" />
                                          Pause Listing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'sold')}>
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Mark as Sold
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {listing.status === 'paused' && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'active')}>
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        Reactivate
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteListingId(listing.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{listing.location}</Badge>
                                <Badge variant="outline">{listing.condition}</Badge>
                                {getEngagementBadge(listing)}
                                {getTransactionStatusBadge(listing)}
                              </div>

                              {/* Analytics Row */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{listing.view_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{listing.favourite_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{listing.message_count || 0}</span>
                                  {(listing.unread_message_count || 0) > 0 && (
                                    <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                                      {listing.unread_message_count}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{getDaysListed(listing.created_at)}d listed</span>
                                </div>
                                {listing.view_count > 0 && (
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>
                                      {(listing.view_count / Math.max(getDaysListed(listing.created_at), 1)).toFixed(1)} views/day
                                    </span>
                                  </div>
                                )}
                              </div>

                              {listing.active_transactions && listing.active_transactions.length > 0 && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm font-medium mb-1">
                                    Active Transaction: {listing.active_transactions[0].status.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Started {formatDistanceToNow(new Date(listing.active_transactions[0].created_at), { addSuffix: true })}
                                  </p>
                                </div>
                              )}

                              {listing.completed_transaction && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-green-600 font-medium">
                                    Sold {formatDistanceToNow(new Date(listing.completed_transaction.completed_at), { addSuffix: true })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <AlertDialog open={!!deleteListingId} onOpenChange={() => setDeleteListingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyListings;
