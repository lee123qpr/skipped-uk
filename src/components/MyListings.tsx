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
  Clock,
  Leaf,
  FileCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MyListingSkeleton } from "./LoadingSkeletons";
import { EmptyState } from "./EmptyState";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { formatConditionBadge } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { HolidayBanner } from "@/components/HolidayBanner";

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
  available: boolean | null;
  favourite_count?: number;
  message_count?: number;
  unread_message_count?: number;
  transactions?: Array<{
    id: string;
    status: string;
    buyer_id: string;
    created_at: string;
    completed_at?: string;
  }>;
  certificate?: {
    id: string;
    certificate_reference: string;
    carbon_saved_kg: number;
    seller_certificate_url: string;
  } | null;
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

  // Fetch user profile to check holiday status
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('on_holiday, holiday_start_date, holiday_end_date, holiday_message')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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

      // Fetch favourite counts using secure RPC
      const { data: favouriteCountsData, error: favCountError } = await supabase
        .rpc('get_favourite_counts_for_seller', { _seller_id: user.id });
      if (favCountError) throw favCountError;
      const favCountMap = new Map((favouriteCountsData || []).map((r: { listing_id: string, favourite_count: number }) => [r.listing_id, Number(r.favourite_count)]));

      // Fetch certificates for completed transactions
      const completedTransactionIds = transactionsData?.filter(t => t.status === 'completed').map(t => t.id) || [];
      let certificatesData = [];
      if (completedTransactionIds.length > 0) {
        const { data } = await supabase
          .from('environmental_certificates')
          .select('id, transaction_id, certificate_reference, carbon_saved_kg, seller_certificate_url')
          .in('transaction_id', completedTransactionIds);
        certificatesData = data || [];
      }

      // Enrich listings with analytics
      return listingsData.map(listing => {
        const transactions = transactionsData?.filter(t => t.listing_id === listing.id) || [];
        const messages = messagesData?.filter(m => m.listing_id === listing.id) || [];
        
        // Find certificate for completed transaction
        const completedTx = transactions.find(t => t.status === 'completed');
        const certificate = completedTx 
          ? certificatesData?.find(c => c.transaction_id === completedTx.id)
          : null;

        return {
          ...listing,
          view_count: listing.view_count || 0,
          favourite_count: favCountMap.get(listing.id) ?? 0,
          message_count: messages.length,
          unread_message_count: messages.filter(m => !m.read).length,
          transactions: transactions,
          certificate: certificate,
        };
      });
    },
    enabled: !!user,
  });

  // Realtime updates: refresh on listing updates (e.g., view_count changes)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`listing-stats-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'listings',
        filter: `seller_id=eq.${user.id}`,
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Realtime updates: refresh on favourite changes
  useEffect(() => {
    if (!user || !listings) return;
    const myIds = new Set(listings.map(l => l.id));

    const channel = supabase
      .channel(`favourites-stats-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favourites',
      }, (payload) => {
        const listingId = (payload.new as any)?.listing_id || (payload.old as any)?.listing_id;
        if (listingId && myIds.has(listingId)) {
          refetch();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, listings?.length, refetch]);

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

  const handleStatusChange = async (listingId: string, isPaused: boolean) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ available: !isPaused })
        .eq('id', listingId)
        .eq('seller_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Listing ${isPaused ? 'paused' : 'reactivated'} successfully.`,
      });

      // Invalidate both my listings and browse listings queries
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      refetch();
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast({
        title: 'Error updating status',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = () => {
    if (deleteListingId) {
      handleDeleteListing(deleteListingId);
    }
  };

  // Categorise listings into sections based on transaction status
  const categorizeListings = (listings: Listing[]): ListingSection[] => {
    const sections: Record<string, Listing[]> = {
      disputed: [],
      completed: [],
      refunded: [],
      inProgress: [],
      paused: [],
      active: [],
    };

    listings.forEach(listing => {
      const transactions = listing.transactions || [];
      
      // Priority order: disputed > completed > refunded > in progress > paused > active
      const hasDispute = transactions.some(t => 
        t.status === 'disputed' || t.status === 'disputed_pending_review'
      );
      const hasCompleted = transactions.some(t => t.status === 'completed');
      const hasRefunded = transactions.some(t => t.status === 'refunded');
      const hasActiveTransaction = transactions.some(t => 
        ['paid', 'dispatched', 'delivered'].includes(t.status)
      );

      if (hasDispute) {
        sections.disputed.push(listing);
      } else if (hasCompleted) {
        sections.completed.push(listing);
      } else if (hasRefunded) {
        sections.refunded.push(listing);
      } else if (hasActiveTransaction) {
        sections.inProgress.push(listing);
      } else if (listing.available === false) {
        sections.paused.push(listing);
      } else {
        sections.active.push(listing);
      }
    });

    return [
      {
        title: 'Active Listings',
        icon: <Package className="h-4 w-4" />,
        listings: sections.active,
        variant: 'default' as const,
      },
      {
        title: 'In Progress',
        icon: <Clock className="h-4 w-4" />,
        listings: sections.inProgress,
        variant: 'secondary' as const,
      },
      {
        title: 'In Dispute',
        icon: <AlertTriangle className="h-4 w-4" />,
        listings: sections.disputed,
        variant: 'destructive' as const,
      },
      {
        title: 'Completed Sales',
        icon: <CheckCircle className="h-4 w-4" />,
        listings: sections.completed,
        variant: 'default' as const,
      },
      {
        title: 'Paused',
        icon: <PauseCircle className="h-4 w-4" />,
        listings: sections.paused,
        variant: 'outline' as const,
      },
      {
        title: 'Refunded',
        icon: <RefreshCw className="h-4 w-4" />,
        listings: sections.refunded,
        variant: 'destructive' as const,
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
    const hasCompleted = listing.transactions?.some(t => t.status === 'completed');

    if (hasCompleted && daysListed <= 7) {
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
    const transactions = listing.transactions || [];
    const activeTransaction = transactions.find(t => 
      ['paid', 'dispatched', 'delivered'].includes(t.status)
    );
    
    if (!activeTransaction) return null;

    const statusMap: Record<string, { label: string; variant: any }> = {
      paid: { label: 'Awaiting Dispatch', variant: 'default' },
      dispatched: { label: 'In Transit', variant: 'default' },
      delivered: { label: 'Awaiting Confirmation', variant: 'default' },
    };

    const status = statusMap[activeTransaction.status];
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
      {/* Holiday Mode Banner */}
      {userProfile?.on_holiday && (
        <div className="mb-6">
          <HolidayBanner 
            holidayMessage={userProfile.holiday_message || undefined}
            holidayStartDate={userProfile.holiday_start_date || undefined}
            holidayEndDate={userProfile.holiday_end_date || undefined}
            variant="listing"
          />
        </div>
      )}
      
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
                        <div className="md:w-48 md:flex-shrink-0 md:h-48 relative">
                          {listing.images && listing.images.length > 0 ? (
                            <>
                              <img
                                src={listing.images[0]}
                                alt={listing.title}
                                className="h-48 w-full object-cover"
                              />
                              {listing.available === false && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                                  <PauseCircle className="h-10 w-10 text-muted-foreground" />
                                  <div className="text-center px-4">
                                    <p className="font-semibold text-sm text-foreground">Paused</p>
                                    <p className="text-xs text-muted-foreground">Not visible to others</p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-48 w-full bg-muted flex items-center justify-center">
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
                                    <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`, { state: { fromDashboard: true } })}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Listing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}/edit`)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {listing.available !== false && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(listing.id, true)}>
                                        <PauseCircle className="mr-2 h-4 w-4" />
                                        Pause Listing
                                      </DropdownMenuItem>
                                    )}
                                    {listing.available === false && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(listing.id, false)}>
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
                                <Badge variant="outline">{formatConditionBadge(listing.condition)}</Badge>
                                {listing.available === false && (
                                  <Badge variant="secondary" className="bg-muted text-foreground border-border">
                                    <PauseCircle className="h-3 w-3 mr-1" />
                                    Paused
                                  </Badge>
                                )}
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

                              {/* Transaction Info */}
                              {(() => {
                                const transactions = listing.transactions || [];
                                const activeTransaction = transactions.find(t => 
                                  ['paid', 'dispatched', 'delivered'].includes(t.status)
                                );
                                const completedTransaction = transactions.find(t => t.status === 'completed');
                                const disputedTransaction = transactions.find(t => 
                                  t.status === 'disputed' || t.status === 'disputed_pending_review'
                                );
                                const refundedTransaction = transactions.find(t => t.status === 'refunded');

                                if (disputedTransaction) {
                                  return (
                                    <div className="pt-2 mt-2 border-t text-sm">
                                      <p className="text-destructive font-medium">
                                        In Dispute • Raised {formatDistanceToNow(new Date(disputedTransaction.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  );
                                }

                                if (completedTransaction && completedTransaction.completed_at) {
                                  const daysToSell = getDaysListed(listing.created_at);
                                  return (
                                    <div className="pt-2 mt-2 border-t space-y-3">
                                      <p className="text-muted-foreground text-sm">
                                        Sold {formatDistanceToNow(new Date(completedTransaction.completed_at), { addSuffix: true })} • {daysToSell} {daysToSell === 1 ? 'day' : 'days'} to sell
                                      </p>
                                      
                                      {/* Environmental Certificate */}
                                      {listing.certificate && (
                                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 space-y-2">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Leaf className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-green-800 dark:text-green-400">
                                              Environmental Impact: {listing.certificate.carbon_saved_kg.toFixed(1)} kg CO₂ saved
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">
                                              {listing.certificate.certificate_reference}
                                            </Badge>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => window.open(listing.certificate!.seller_certificate_url, '_blank')}
                                              className="h-7 text-xs"
                                            >
                                              <FileCheck className="mr-1 h-3 w-3" />
                                              Download Certificate
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                if (refundedTransaction) {
                                  return (
                                    <div className="pt-2 mt-2 border-t text-sm">
                                      <p className="text-muted-foreground">
                                        Refunded {formatDistanceToNow(new Date(refundedTransaction.created_at), { addSuffix: true })}
                                      </p>
                                    </div>
                                  );
                                }

                                if (activeTransaction) {
                                  const daysSinceStart = Math.floor(
                                    (Date.now() - new Date(activeTransaction.created_at).getTime()) / (1000 * 60 * 60 * 24)
                                  );
                                  return (
                                    <div className="pt-2 mt-2 border-t text-sm">
                                      <p className="text-muted-foreground">
                                        Transaction in progress • {daysSinceStart} {daysSinceStart === 1 ? 'day' : 'days'} ago
                                      </p>
                                    </div>
                                  );
                                }

                                return null;
                              })()}
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
