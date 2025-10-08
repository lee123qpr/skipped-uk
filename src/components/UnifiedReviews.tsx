import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Star, Clock } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer_type: string | null;
  seller_reply: string | null;
  seller_reply_created_at: string | null;
  reviewer_id: string;
  seller_id: string;
  transaction_id: string | null;
  listing_id: string;
  listings: {
    title: string;
  } | null;
  reviewer_profile?: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
  seller_profile?: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

interface PendingTransaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  completed_at: string;
  amount: number;
  listings: {
    title: string;
  } | null;
  buyer_profile: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
  seller_profile: {
    username: string | null;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
}

interface UnifiedReviewsProps {
  userId: string;
}

function UnifiedReviews({ userId }: UnifiedReviewsProps) {
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviewForms, setReviewForms] = useState<{ [key: string]: ReviewFormData }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchAllReviews();
  }, [userId]);

  const fetchAllReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews received (where user is the seller)
      const { data: received, error: receivedError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          comment,
          created_at,
          reviewer_type,
          seller_reply,
          seller_reply_created_at,
          reviewer_id,
          seller_id,
          transaction_id,
          listing_id,
          listings:listing_id (title),
          reviewer_profile:profiles!reviews_reviewer_id_fkey (username, avatar_url, display_name)
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch reviews given (where user is the reviewer)
      const { data: given, error: givenError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          comment,
          created_at,
          reviewer_type,
          seller_reply,
          seller_reply_created_at,
          reviewer_id,
          seller_id,
          transaction_id,
          listing_id,
          listings:listing_id (title),
          seller_profile:profiles!reviews_seller_id_fkey (username, avatar_url, display_name)
        `)
        .eq('reviewer_id', userId)
        .order('created_at', { ascending: false });

      if (givenError) throw givenError;

      // Fetch pending transactions (completed within 30 days, no review yet)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          listing_id,
          buyer_id,
          seller_id,
          completed_at,
          amount,
          listings!transactions_listing_id_fkey (title),
          buyer:profiles!transactions_buyer_id_fkey (username, avatar_url, display_name),
          seller:profiles!transactions_seller_id_fkey (username, avatar_url, display_name)
        `)
        .eq('status', 'completed')
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (transactionsError) throw transactionsError;

      // Filter out transactions where user has already left a review
      const existingReviewTransactionIds = new Set(given?.map(r => r.transaction_id) || []);
      const pending = (transactions || []).filter(t => !existingReviewTransactionIds.has(t.id));

      setReceivedReviews(received || []);
      setGivenReviews(given || []);
      setPendingTransactions(pending as any);

      // Calculate overall stats
      if (received && received.length > 0) {
        const average = received.reduce((sum, review) => sum + review.rating, 0) / received.length;
        setAverageRating(Math.round(average * 10) / 10);
      }
      setTotalReviews((received?.length || 0) + (given?.length || 0));

    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (transactionId: string) => {
    const formData = reviewForms[transactionId];
    if (!formData || formData.rating === 0) {
      toast({
        title: "Error",
        description: "Please provide a rating",
        variant: "destructive",
      });
      return;
    }

    const transaction = pendingTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const isUserBuyer = transaction.buyer_id === userId;
    const reviewerType = isUserBuyer ? 'buyer' : 'seller';
    const sellerId = transaction.seller_id;

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          transaction_id: transactionId,
          listing_id: transaction.listing_id,
          reviewer_id: userId,
          seller_id: sellerId,
          reviewer_type: reviewerType,
          rating: formData.rating,
          title: formData.title || null,
          comment: formData.comment || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully",
      });

      // Reset form and refresh
      setReviewForms(prev => {
        const newForms = { ...prev };
        delete newForms[transactionId];
        return newForms;
      });
      fetchAllReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const updateReviewForm = (transactionId: string, field: keyof ReviewFormData, value: any) => {
    setReviewForms(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId],
        rating: prev[transactionId]?.rating || 0,
        title: prev[transactionId]?.title || '',
        comment: prev[transactionId]?.comment || '',
        [field]: value,
      },
    }));
  };

  const getDeadlineMessage = (completedAt: string) => {
    const completed = new Date(completedAt);
    const deadline = new Date(completed);
    deadline.setDate(deadline.getDate() + 30);
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return "Expired";
    if (daysLeft === 1) return "1 day left";
    return `${daysLeft} days left`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold">{averageRating > 0 ? averageRating : "—"}</div>
              <div>
                <StarRating rating={Math.round(averageRating)} readonly size="md" />
                <p className="text-sm text-muted-foreground mt-1">
                  {receivedReviews.length} {receivedReviews.length === 1 ? 'review' : 'reviews'} received
                </p>
              </div>
            </div>
            <div className="border-l pl-6 space-y-1">
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-semibold">{totalReviews}</p>
            </div>
            <div className="border-l pl-6 space-y-1">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold">{pendingTransactions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received">
                Received ({receivedReviews.length})
              </TabsTrigger>
              <TabsTrigger value="given">
                Given ({givenReviews.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingTransactions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4 mt-4">
              {receivedReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reviews received yet
                </p>
              ) : (
                receivedReviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-border">
                            <AvatarImage src={review.reviewer_profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {(review.reviewer_profile?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {review.reviewer_profile?.display_name || `@${review.reviewer_profile?.username}` || "Anonymous"}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {review.reviewer_type === 'buyer' ? 'Buyer' : 'Seller'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.listings?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={review.rating} readonly size="sm" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {review.title && <h4 className="font-medium">{review.title}</h4>}
                      {review.comment && (
                        <p className="text-muted-foreground text-sm">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="given" className="space-y-4 mt-4">
              {givenReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No reviews given yet
                </p>
              ) : (
                givenReviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-border">
                            <AvatarImage src={review.seller_profile?.avatar_url || ""} />
                            <AvatarFallback>
                              {(review.seller_profile?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                To: {review.seller_profile?.display_name || `@${review.seller_profile?.username}` || "Anonymous"}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                You as {review.reviewer_type === 'buyer' ? 'Buyer' : 'Seller'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.listings?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StarRating rating={review.rating} readonly size="sm" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(review.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {review.title && <h4 className="font-medium">{review.title}</h4>}
                      {review.comment && (
                        <p className="text-muted-foreground text-sm">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending reviews
                </p>
              ) : (
                pendingTransactions.map((transaction) => {
                  const isUserBuyer = transaction.buyer_id === userId;
                  const otherParty = isUserBuyer ? transaction.seller_profile : transaction.buyer_profile;
                  const formData = reviewForms[transaction.id] || { rating: 0, title: '', comment: '' };
                  
                  return (
                    <Card key={transaction.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{transaction.listings?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {isUserBuyer ? 'Purchased from' : 'Sold to'}: {otherParty?.display_name || `@${otherParty?.username}` || "User"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {getDeadlineMessage(transaction.completed_at)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rating *</label>
                          <StarRating
                            rating={formData.rating}
                            onRatingChange={(rating) => updateReviewForm(transaction.id, 'rating', rating)}
                            size="lg"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Title (optional)</label>
                          <Input
                            value={formData.title}
                            onChange={(e) => updateReviewForm(transaction.id, 'title', e.target.value)}
                            placeholder="Summarise your experience"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                          <Textarea
                            value={formData.comment}
                            onChange={(e) => updateReviewForm(transaction.id, 'comment', e.target.value)}
                            placeholder="Share your experience with this transaction..."
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() => handleReviewSubmit(transaction.id)}
                          className="w-full"
                          disabled={formData.rating === 0}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Submit Review
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default UnifiedReviews;
