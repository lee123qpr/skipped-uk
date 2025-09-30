import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Shared hook for fetching categories across the application
 * Implements caching to avoid duplicate API calls
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch categories with live listing counts
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      
      // Fetch live counts for each category
      const categoriesWithCounts = await Promise.all(
        (categories || []).map(async (category) => {
          const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');
          
          return {
            ...category,
            item_count: count || 0
          };
        })
      );
      
      return categoriesWithCounts;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
