import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquare, Calendar, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  listing: {
    id: string;
    title: string;
  } | null;
  buyer_profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  seller_profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  buyer_review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
  } | null;
  seller_review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
  } | null;
}

interface ReviewForm {
  rating: number;
  title: string;
  comment: string;
}

const TransactionReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<{ [key: string]: ReviewForm }>({});

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      // Fetch completed transactions where user is buyer or seller
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          status,
          completed_at,
          created_at,
          buyer_id,
          seller_id,
          listing_id
        `)
        .eq('status', 'completed')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('completed_at', { ascending: false });

      if (transactionError) {
        console.error('Error fetching transactions:', transactionError);
        return;
      }

      // Fetch profiles, listings, and reviews for each transaction
      const transactionsWithData = await Promise.all(
        (transactionData || []).map(async (transaction) => {
          const [buyerProfileResult, sellerProfileResult, listingResult, reviewsResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('username, display_name, avatar_url, verified')
              .eq('user_id', transaction.buyer_id)
              .single(),
            supabase
              .from('profiles')
              .select('username, display_name, avatar_url, verified')
              .eq('user_id', transaction.seller_id)
              .single(),
            supabase
              .from('listings')
              .select('id, title')
              .eq('id', transaction.listing_id)
              .single(),
            supabase
              .from('reviews')
              .select('id, rating, title, comment, created_at, reviewer_type')
              .eq('transaction_id', transaction.id)
          ]);

          const reviews = reviewsResult.data || [];
          const buyerReview = reviews.find(r => r.reviewer_type === 'buyer');
          const sellerReview = reviews.find(r => r.reviewer_type === 'seller');

          return {
            ...transaction,
            listing: listingResult.data,
            buyer_profile: buyerProfileResult.data,
            seller_profile: sellerProfileResult.data,
            buyer_review: buyerReview || null,
            seller_review: sellerReview || null
          };
        })
      );

      setTransactions(transactionsWithData);
    } catch (error) {
      console.error('Error fetching transaction reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (transactionId: string, reviewerType: 'buyer' | 'seller') => {
    if (!user) return;

    const form = reviewForms[transactionId];
    if (!form || form.rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingReview(transactionId);

    try {
      const transaction = transactions.find(t => t.id === transactionId);
      const otherUserId = reviewerType === 'buyer' ? transaction?.seller_id : transaction?.buyer_id;

      const { error } = await supabase
        .from('reviews')
        .insert({
          transaction_id: transactionId,
          reviewer_id: user.id,
          seller_id: otherUserId, // The person being reviewed
          listing_id: transaction?.listing?.id,
          reviewer_type: reviewerType,
          rating: form.rating,
          title: form.title.trim() || null,
          comment: form.comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Review submitted!',
        description: 'Thank you for your feedback.',
      });

      // Clear form and refresh data
      setReviewForms(prev => ({ ...prev, [transactionId]: { rating: 0, title: '', comment: '' } }));
      fetchTransactions();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error submitting review',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  const updateReviewForm = (transactionId: string, field: keyof ReviewForm, value: string | number) => {
    setReviewForms(prev => ({
      ...prev,
      [transactionId]: {
        ...prev[transactionId] || { rating: 0, title: '', comment: '' },
        [field]: value
      }
    }));
  };

  const renderStars = (rating: number, interactive = false, transactionId?: string) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-500 fill-current' 
            : 'text-muted-foreground'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && transactionId ? () => updateReviewForm(transactionId, 'rating', i + 1) : undefined}
      />
    ));
  };

  const canLeaveReview = (transaction: Transaction, reviewerType: 'buyer' | 'seller') => {
    const isCorrectUser = reviewerType === 'buyer' ? user?.id === transaction.buyer_id : user?.id === transaction.seller_id;
    const hasNotReviewed = reviewerType === 'buyer' ? !transaction.buyer_review : !transaction.seller_review;
    
    // Check if 30-day deadline has passed
    if (transaction.completed_at) {
      const completedDate = new Date(transaction.completed_at);
      const daysSinceCompletion = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCompletion > 30) return false;
    }
    
    return isCorrectUser && hasNotReviewed;
  };

  const getReviewDeadlineMessage = (transaction: Transaction) => {
    if (!transaction.completed_at) return null;
    
    const completedDate = new Date(transaction.completed_at);
    const daysSinceCompletion = Math.floor((Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = 30 - daysSinceCompletion;
    
    if (daysRemaining <= 0) {
      return "Review period has ended (30 days after completion)";
    } else if (daysRemaining <= 7) {
      return `⏰ ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to leave a review`;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Transaction Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Transaction Reviews
        </CardTitle>
        <CardDescription>
          Leave reviews for completed transactions and see reviews you've received
        </CardDescription>
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No completed transactions</h3>
            <p className="text-muted-foreground">
              Complete a purchase or sale to leave and receive reviews
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map((transaction) => {
              const isBuyer = user?.id === transaction.buyer_id;
              const isSeller = user?.id === transaction.seller_id;
              const otherUser = isBuyer ? transaction.seller_profile : transaction.buyer_profile;
              const myReviewType = isBuyer ? 'buyer' : 'seller';
              const theirReviewType = isBuyer ? 'seller' : 'buyer';
              const myReview = isBuyer ? transaction.buyer_review : transaction.seller_review;
              const theirReview = isBuyer ? transaction.seller_review : transaction.buyer_review;
              const canReview = canLeaveReview(transaction, myReviewType);
              const form = reviewForms[transaction.id] || { rating: 0, title: '', comment: '' };

              return (
                <div key={transaction.id} className="border border-border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={otherUser?.avatar_url || ""} />
                        <AvatarFallback className="border-2 border-border">
                          {(otherUser?.display_name || otherUser?.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {transaction.listing?.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isBuyer ? 'Purchased from' : 'Sold to'} {otherUser?.display_name || `@${otherUser?.username}` || 'Anonymous'}
                          {otherUser?.verified && (
                            <Badge variant="secondary" className="ml-2 text-xs">Verified</Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          £{transaction.amount.toLocaleString()} • {format(new Date(transaction.completed_at!), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={transaction.status === 'completed' ? 'secondary' : 'outline'}>
                      {transaction.status === 'completed' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          {transaction.status}
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* My review section */}
                  {myReview ? (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">Your Review:</span>
                        <div className="flex">{renderStars(myReview.rating)}</div>
                      </div>
                      {myReview.title && <h4 className="font-medium mb-1">{myReview.title}</h4>}
                      {myReview.comment && <p className="text-sm text-muted-foreground">{myReview.comment}</p>}
                    </div>
                  ) : canReview ? (
                    <div className="bg-primary/5 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Leave a review:</Label>
                        {getReviewDeadlineMessage(transaction) && (
                          <span className="text-xs text-muted-foreground">{getReviewDeadlineMessage(transaction)}</span>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Rating *</Label>
                          <div className="flex gap-1">
                            {renderStars(form.rating, true, transaction.id)}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`title-${transaction.id}`} className="text-xs text-muted-foreground">
                            Title (optional)
                          </Label>
                          <input
                            id={`title-${transaction.id}`}
                            type="text"
                            placeholder="Great transaction!"
                            value={form.title}
                            onChange={(e) => updateReviewForm(transaction.id, 'title', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            maxLength={100}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`comment-${transaction.id}`} className="text-xs text-muted-foreground">
                            Comment (optional)
                          </Label>
                          <Textarea
                            id={`comment-${transaction.id}`}
                            placeholder="Share your experience..."
                            value={form.comment}
                            onChange={(e) => updateReviewForm(transaction.id, 'comment', e.target.value)}
                            rows={3}
                            className="text-sm"
                            maxLength={500}
                          />
                        </div>

                        <Button
                          onClick={() => handleReviewSubmit(transaction.id, myReviewType)}
                          disabled={form.rating === 0 || submittingReview === transaction.id}
                          size="sm"
                        >
                          {submittingReview === transaction.id ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </div>
                  ) : !myReview && !canReview ? (
                    <div className="bg-muted/30 rounded-lg p-4 mb-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Review period has ended (30 days after completion)
                      </p>
                    </div>
                  ) : null}

                  {/* Their review section */}
                  {theirReview && (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          Review from {otherUser?.display_name || `@${otherUser?.username}` || 'them'}:
                        </span>
                        <div className="flex">{renderStars(theirReview.rating)}</div>
                      </div>
                      {theirReview.title && <h4 className="font-medium mb-1">{theirReview.title}</h4>}
                      {theirReview.comment && <p className="text-sm text-muted-foreground">{theirReview.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(theirReview.created_at), 'dd MMM yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionReviews;