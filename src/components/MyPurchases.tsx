import { useQuery } from "@tanstack/react-query";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Truck,
  AlertTriangle,
  Package,
  ShoppingBag,
  MessageCircle,
  Eye,
  Star,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Leaf,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MyListingSkeleton } from "./LoadingSkeletons";
import { EmptyState } from "./EmptyState";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import { getStatusConfig } from "@/utils/transactionStatus";
import { DisputeDialog } from "./DisputeDialog";
import { ReviewDialog } from "./ReviewDialog";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TransactionTimeline } from "./TransactionTimeline";
import { TransactionManager } from "./TransactionManager";

interface Purchase {
  id: string;
  status: string;
  amount: number;
  buyer_protection_fee?: number | null;
  delivery_cost?: number | null;
  delivery_method?: string | null;
  buyer_id: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  dispatch_confirmed_at: string | null;
  delivery_confirmed_at: string | null;
  completed_at: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  refunded_at: string | null;
  seller_id: string;
  listing_id: string;
  listing: {
    id: string;
    title: string;
    images: string[];
    location: string;
    seller_id: string;
  } | null;
  seller: {
    display_name: string;
    username: string;
    avatar_url: string;
    verified: boolean;
  };
  certificate: {
    id: string;
    certificate_reference: string;
    carbon_saved_kg: number;
    buyer_certificate_url: string;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
  } | null;
}

interface PurchaseSection {
  title: string;
  icon: React.ReactNode;
  purchases: Purchase[];
  variant: "default" | "destructive" | "outline" | "secondary";
  defaultOpen?: boolean;
}

// Helper function to format transaction breakdown for display
const formatPurchaseBreakdown = (p: Purchase) => {
  const item = Number(p.amount) || 0;
  const buyerProtection = Number(p.buyer_protection_fee || 0);
  const delivery = Number(p.delivery_cost || 0);
  const total = item + buyerProtection + delivery;
  const deliveryMethod = p.delivery_method === 'delivery' ? 'Delivery' : 'Collection';
  return {
    item: item.toFixed(2),
    buyerProtection: buyerProtection.toFixed(2),
    delivery: delivery.toFixed(2),
    total: total.toFixed(2),
    deliveryMethod,
    hasDeliveryCost: delivery > 0,
  };
};

const MyPurchases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Purchase | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedReviewPurchase, setSelectedReviewPurchase] = useState<Purchase | null>(null);

  const { data: purchases, isLoading, refetch, error } = useQuery({
    queryKey: ['myPurchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch transactions first
      const { data: purchasesData, error } = await supabase
        .from('transactions')
        .select(`
          *,
          listing:listings(id, title, images, location, seller_id),
          certificate:environmental_certificates!environmental_certificates_transaction_id_fkey(id, certificate_reference, carbon_saved_kg, buyer_certificate_url),
          review:reviews!transaction_id(id, rating, comment, reviewer_id)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get unique seller IDs
      const sellerIds = [...new Set(purchasesData?.map(tx => tx.seller_id).filter(Boolean))];
      
      // Fetch seller info from public_safe_profiles
      const { data: sellersData } = await supabase
        .from('public_safe_profiles')
        .select('user_id, username, display_name, avatar_url, verified')
        .in('user_id', sellerIds);
      
      // Create a map of seller info
      const sellersMap = new Map(sellersData?.map(s => [s.user_id, s]));
      
      // Transform the data to match Purchase interface
      const transformed = (purchasesData || []).map((tx: any) => ({
        ...tx,
        seller: sellersMap.get(tx.seller_id),
        listing: Array.isArray(tx.listing) ? tx.listing[0] : tx.listing,
        certificate: Array.isArray(tx.certificate) ? tx.certificate[0] : tx.certificate,
        review: Array.isArray(tx.review) ? tx.review.find((r: any) => r.reviewer_id === user.id) : tx.review,
      }));
      
      return transformed as Purchase[];
    },
    enabled: !!user,
  });

  const handleRaiseDispute = (purchase: Purchase) => {
    setSelectedTransaction(purchase);
    setDisputeDialogOpen(true);
  };

  // Helper function to get the most recent effective timestamp
  const getEffectiveTimestamp = (purchase: Purchase): number => {
    const timestamps = [
      purchase.completed_at,
      purchase.refunded_at,
      purchase.disputed_at,
      purchase.delivery_confirmed_at,
      purchase.dispatch_confirmed_at,
      purchase.paid_at,
      purchase.updated_at,
      purchase.created_at,
    ].filter(Boolean);
    
    if (timestamps.length === 0) return new Date(purchase.created_at).getTime();
    
    const mostRecent = timestamps.reduce((latest, current) => {
      const latestTime = new Date(latest).getTime();
      const currentTime = new Date(current!).getTime();
      return currentTime > latestTime ? current : latest;
    });
    
    return new Date(mostRecent!).getTime();
  };

  // Deduplicate purchases by listing_id, keeping only the latest transaction
  const dedupeLatestByListing = (purchases: Purchase[]): Purchase[] => {
    const listingMap = new Map<string, Purchase>();
    
    purchases.forEach(purchase => {
      const listingId = purchase.listing_id;
      const existing = listingMap.get(listingId);
      
      if (!existing) {
        listingMap.set(listingId, purchase);
      } else {
        // Keep the one with the most recent effective timestamp
        const existingTime = getEffectiveTimestamp(existing);
        const currentTime = getEffectiveTimestamp(purchase);
        
        if (currentTime > existingTime) {
          listingMap.set(listingId, purchase);
        }
      }
    });
    
    return Array.from(listingMap.values());
  };

  const categorizePurchases = (purchases: Purchase[]): PurchaseSection[] => {
    const sections: Record<string, Purchase[]> = {
      pending_payment: [],
      paid: [],
      dispatched: [],
      delivered: [],
      disputed: [],
      completed: [],
      refunded: [],
    };

    purchases.forEach(purchase => {
      if (purchase.status === 'disputed' || purchase.status === 'disputed_pending_review') {
        sections.disputed.push(purchase);
      } else if (purchase.status === 'refunded') {
        sections.refunded.push(purchase);
      } else if (purchase.status === 'completed') {
        sections.completed.push(purchase);
      } else if (purchase.status === 'delivered') {
        sections.delivered.push(purchase);
      } else if (purchase.status === 'dispatched') {
        sections.dispatched.push(purchase);
      } else if (purchase.status === 'paid') {
        sections.paid.push(purchase);
      } else if (purchase.status === 'pending_payment' || purchase.status === 'pending') {
        sections.pending_payment.push(purchase);
      }
    });

    return [
      {
        title: 'Awaiting Payment',
        icon: <CreditCard className="h-4 w-4" />,
        purchases: sections.pending_payment,
        variant: 'secondary' as const,
        defaultOpen: true,
      },
      {
        title: 'Payment in Escrow',
        icon: <Package className="h-4 w-4" />,
        purchases: sections.paid,
        variant: 'default' as const,
        defaultOpen: true,
      },
      {
        title: 'Item Dispatched',
        icon: <Truck className="h-4 w-4" />,
        purchases: sections.dispatched,
        variant: 'secondary' as const,
        defaultOpen: true,
      },
      {
        title: 'Delivered',
        icon: <CheckCircle2 className="h-4 w-4" />,
        purchases: sections.delivered,
        variant: 'default' as const,
      },
      {
        title: 'In Dispute',
        icon: <AlertTriangle className="h-4 w-4" />,
        purchases: sections.disputed,
        variant: 'destructive' as const,
        defaultOpen: true,
      },
      {
        title: 'Completed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        purchases: sections.completed,
        variant: 'default' as const,
      },
      {
        title: 'Refunded',
        icon: <AlertTriangle className="h-4 w-4" />,
        purchases: sections.refunded,
        variant: 'destructive' as const,
      },
    ].filter(section => section.purchases.length > 0);
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getTotalStats = () => {
    if (!purchases) return { count: 0, spent: 0, carbonSaved: 0 };
    
    // Use deduplicated purchases for stats, but only count paid transactions
    const dedupedPurchases = dedupeLatestByListing(purchases);
    const paidPurchases = dedupedPurchases.filter(p => 
      p.status !== 'pending' && p.status !== 'refunded'
    );
    
    return {
      count: paidPurchases.length,
      spent: paidPurchases.reduce((sum, p) => {
        const item = Number(p.amount) || 0;
        const buyerProtection = Number(p.buyer_protection_fee || 0);
        const delivery = Number(p.delivery_cost || 0);
        return sum + item + buyerProtection + delivery;
      }, 0),
      carbonSaved: paidPurchases.reduce((sum, p) => sum + (p.certificate?.carbon_saved_kg || 0), 0),
    };
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

  if (error) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Error loading purchases"
        description={`Failed to load your purchases: ${error.message}`}
        actionLabel="Try Again"
        onAction={() => refetch()}
      />
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No purchases yet"
        description="You haven't made any purchases. Browse available materials to get started."
        actionLabel="Browse Listings"
        onAction={() => navigate('/browse')}
      />
    );
  }

  // Deduplicate purchases by listing - keep only the latest transaction per listing
  const dedupedPurchases = dedupeLatestByListing(purchases);
  const sections = categorizePurchases(dedupedPurchases);
  const stats = getTotalStats();

  return (
    <>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Purchases</div>
              <div className="text-2xl font-bold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Spent</div>
              <div className="text-2xl font-bold">£{stats.spent.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">CO₂ Saved</div>
                  <div className="text-2xl font-bold">{stats.carbonSaved.toFixed(1)} kg</div>
                </div>
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Sections */}
        {sections.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections[section.title] !== false && section.defaultOpen !== false}
            onOpenChange={() => toggleSection(section.title)}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colours">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <Badge variant={section.variant}>
                        {section.purchases.length}
                      </Badge>
                    </div>
                    {openSections[section.title] !== false && section.defaultOpen !== false ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {section.purchases.map((purchase) => {
                    const statusConfig = getStatusConfig(purchase.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <Card key={purchase.id} className="overflow-hidden">
                        <div className="md:flex">
                          <div className="md:w-48 md:flex-shrink-0">
                            {purchase.listing?.images && purchase.listing.images.length > 0 ? (
                              <img
                                src={purchase.listing.images[0]}
                                alt={purchase.listing?.title || 'Listing'}
                                className="h-48 w-full object-cover md:h-full"
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-48 w-full bg-muted flex items-center justify-center md:h-full">
                                <span className="text-muted-foreground">Listing unavailable</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 p-4">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg">{purchase.listing?.title || 'Listing'}</h3>
                                </div>
                              </div>

                              {/* Seller Info */}
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={purchase.seller?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {purchase.seller?.display_name?.[0] || purchase.seller?.username?.[0] || 'S'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {purchase.seller?.display_name || purchase.seller?.username || 'Unknown seller'}
                                  </span>
                                  {purchase.seller?.verified && (
                                    <Badge variant="default" className="h-5 text-xs">
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Transaction Manager - handles all transaction actions consistently */}
                              <TransactionManager 
                                transaction={purchase}
                                userRole="buyer"
                                onUpdate={refetch}
                              />

                              {/* Additional Quick Actions */}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => navigate(`/dashboard?tab=messages&conversation=${purchase.seller ? purchase.listing?.seller_id : purchase.seller_id}&listing=${purchase.listing?.id || ''}`)}
                                  size="sm"
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Contact Seller
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  onClick={() => purchase.listing?.id && navigate(`/listing/${purchase.listing.id}`)}
                                  size="sm"
                                  disabled={!purchase.listing?.id}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Listing
                                </Button>

                                {purchase.status === 'completed' && !purchase.review && (
                                  <Button
                                    variant="default"
                                    onClick={() => {
                                      setSelectedReviewPurchase(purchase);
                                      setReviewDialogOpen(true);
                                    }}
                                    size="sm"
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    Leave Review
                                  </Button>
                                )}

                                {purchase.certificate && (
                                  <Button
                                    variant="outline"
                                    onClick={() => window.open(purchase.certificate!.buyer_certificate_url, '_blank')}
                                    size="sm"
                                  >
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    View Certificate
                                  </Button>
                                )}
                              </div>

                              {/* Environmental Impact */}
                              {purchase.certificate && (
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-400">
                                    <Leaf className="h-4 w-4" />
                                    <span className="font-medium">
                                      Environmental Impact: {purchase.certificate.carbon_saved_kg.toFixed(1)} kg CO₂ saved
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Purchase Date */}
                              <div className="text-sm text-muted-foreground">
                                Purchased {formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Dispute Dialog */}
      {selectedTransaction && (
        <DisputeDialog
          open={disputeDialogOpen}
          onOpenChange={setDisputeDialogOpen}
          transactionId={selectedTransaction.id}
          userRole="buyer"
          otherUserId={selectedTransaction.listing?.seller_id || selectedTransaction.seller_id}
          onSuccess={() => {
            refetch();
            setDisputeDialogOpen(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* Review Dialog */}
      {selectedReviewPurchase && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          transactionId={selectedReviewPurchase.id}
          listingId={selectedReviewPurchase.listing_id}
          sellerId={selectedReviewPurchase.seller_id}
          listingTitle={selectedReviewPurchase.listing?.title || "this item"}
          sellerName={selectedReviewPurchase.seller?.display_name}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
};

export default MyPurchases;
