import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface SellerOtherItemsProps {
  sellerId: string;
  currentListingId: string;
  sellerUsername?: string;
}

export function SellerOtherItems({ sellerId, currentListingId, sellerUsername }: SellerOtherItemsProps) {
  const navigate = useNavigate();

  const { data: otherItems, isLoading } = useQuery({
    queryKey: ['sellerOtherItems', sellerId, currentListingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, price, images, condition, status')
        .eq('seller_id', sellerId)
        .neq('id', currentListingId)
        .eq('status', 'active')
        .eq('available', true)
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  if (isLoading || !otherItems || otherItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Other Items from {sellerUsername || 'this Seller'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {otherItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-40 border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-all group"
                onClick={() => navigate(`/listing/${item.id}`)}
              >
                <div className="aspect-square bg-muted overflow-hidden">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h4 className="font-medium text-xs line-clamp-2 mb-1 min-h-[2.5rem]">{item.title}</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-primary text-sm">
                      {item.price === 0 ? 'Free' : `£${item.price.toLocaleString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.condition.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {otherItems.length > 3 && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          )}
        </div>
        {otherItems.length >= 10 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate(`/browse?seller=${sellerId}`)}
          >
            View All Items
          </Button>
        )}
      </CardContent>
    </Card>
  );
}