import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  listing_id: string;
  reviewer_profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    verified: boolean;
  } | null;
  listing: {
    id: string;
    title: string;
  } | null;
}

interface UserReviewsProps {
  className?: string;
}

const UserReviews = ({ className }: UserReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchUserReviews();
    }
  }, [user]);

  const fetchUserReviews = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          title,
          comment,
          created_at,
          reviewer_id,
          listing_id
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Fetch reviewer profiles and listing details separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const [profileResult, listingResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('username, display_name, avatar_url, verified')
              .eq('user_id', review.reviewer_id)
              .single(),
            supabase
              .from('listings')
              .select('id, title')
              .eq('id', review.listing_id)
              .single()
          ]);

          return {
            ...review,
            reviewer_profile: profileResult.data,
            listing: listingResult.data
          };
        })
      );

      setReviews(reviewsWithProfiles);
      setTotalReviews(reviewsWithProfiles.length);
      
      // Calculate average rating
      if (reviewsWithProfiles.length > 0) {
        const sum = reviewsWithProfiles.reduce((acc, review) => acc + review.rating, 0);
        setAverageRating(sum / reviewsWithProfiles.length);
      } else {
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          My Reviews as Seller
        </CardTitle>
        <CardDescription>
          Reviews and ratings from buyers who purchased your items
        </CardDescription>
        
        {/* Overall Rating Summary */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="text-lg font-semibold">
              {averageRating > 0 ? averageRating.toFixed(1) : 'No rating'}
            </span>
          </div>
          <Badge variant="secondary">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground">
              Start selling items to receive reviews from buyers
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={review.reviewer_profile?.avatar_url || ""} />
                    <AvatarFallback className="border-2 border-border">
                      {(review.reviewer_profile?.display_name || review.reviewer_profile?.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {review.reviewer_profile?.display_name || `@${review.reviewer_profile?.username}` || 'Anonymous'}
                        </span>
                        {review.reviewer_profile?.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(review.created_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm text-muted-foreground">
                        {review.rating}/5 stars
                      </span>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium mb-2">{review.title}</h4>
                    )}
                    
                    {review.comment && (
                      <p className="text-muted-foreground mb-3">{review.comment}</p>
                    )}
                    
                    {review.listing && (
                      <div className="text-sm text-muted-foreground">
                        Review for: <span className="font-medium">{review.listing.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserReviews;