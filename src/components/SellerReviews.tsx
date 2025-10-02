import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer_type: string | null;
  seller_reply: string | null;
  seller_reply_created_at: string | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface SellerReviewsProps {
  sellerId: string;
  limit?: number;
}

export function SellerReviews({ sellerId, limit }: SellerReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    fetchReviews();
  }, [sellerId, limit]);

  const fetchReviews = async () => {
    try {
      let query = supabase
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
          profiles!reviews_reviewer_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReviews(data || []);
      
      // Calculate average rating
      if (data && data.length > 0) {
        const average = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(average * 10) / 10);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No reviews yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-3xl font-bold">{averageRating}</div>
        <div>
          <StarRating rating={Math.round(averageRating)} readonly size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={review.profiles?.avatar_url || ""} />
                    <AvatarFallback className="border-2 border-border">
                      {(review.profiles?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        @{review.profiles?.username || "Anonymous"}
                      </p>
                      {review.reviewer_type && (
                        <Badge variant="outline" className="text-xs">
                          {review.reviewer_type === 'buyer' ? 'Buyer' : 'Seller'}
                        </Badge>
                      )}
                    </div>
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
              {review.title && (
                <h4 className="font-medium">{review.title}</h4>
              )}
              {review.comment && (
                <p className="text-muted-foreground text-sm">{review.comment}</p>
              )}
              
              {review.seller_reply && (
                <div className="mt-4 pl-4 border-l-2 border-primary/20 bg-muted/30 p-3 rounded-r">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Seller's response • {format(new Date(review.seller_reply_created_at!), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm">{review.seller_reply}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
