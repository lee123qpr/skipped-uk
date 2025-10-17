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
        .limit(4);
      
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  if (isLoading || !otherItems || otherItems.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Other Items from {sellerUsername || 'this Seller'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {otherItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden hover:shadow-md cursor-pointer transition-all group"
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
                <h4 className="font-medium text-sm line-clamp-1 mb-1">{item.title}</h4>
                <div className="flex justify-between items-center gap-1">
                  <span className="font-bold text-primary text-sm">
                    {item.price === 0 ? 'Free' : `£${item.price.toLocaleString()}`}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.condition.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {otherItems.length >= 4 && (
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