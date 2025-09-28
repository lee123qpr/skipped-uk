import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "@/hooks/use-toast";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000, "Comment must be less than 1000 characters")
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  listingId: string;
  sellerId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ listingId, sellerId, onReviewSubmitted }: ReviewFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: "",
      comment: ""
    }
  });

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive"
      });
      return;
    }

    if (user.id === sellerId) {
      toast({
        title: "Cannot review own listing",
        description: "You cannot leave a review for your own listing",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          listing_id: listingId,
          reviewer_id: user.id,
          seller_id: sellerId,
          rating: data.rating,
          title: data.title.trim(),
          comment: data.comment.trim()
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Review already exists",
            description: "You have already reviewed this listing",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!"
        });
        form.reset();
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to leave a review
          </p>
        </CardContent>
      </Card>
    );
  }

  if (user.id === sellerId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRating
                      rating={field.value}
                      onRatingChange={field.onChange}
                      size="lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Summarise your experience..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about your experience with this item and seller..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}