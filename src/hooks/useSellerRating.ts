import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SellerRating {
  averageRating: number;
  totalReviews: number;
}

export function useSellerRating(sellerId: string | undefined) {
  return useQuery({
    queryKey: ['sellerRating', sellerId],
    queryFn: async (): Promise<SellerRating> => {
      if (!sellerId) return { averageRating: 0, totalReviews: 0 };

      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { averageRating: 0, totalReviews: 0 };
      }

      const totalReviews = data.length;
      const averageRating = data.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews
      };
    },
    enabled: !!sellerId,
  });
}