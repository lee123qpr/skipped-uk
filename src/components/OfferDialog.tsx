import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PoundSterling } from 'lucide-react';
import { z } from 'zod';

const offerSchema = z.object({
  amount: z.number().positive('Offer amount must be positive').max(999999, 'Offer amount must be less than £1,000,000'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

interface OfferDialogProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
  listingPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OfferDialog = ({ 
  listingId, 
  sellerId, 
  listingTitle, 
  listingPrice, 
  open, 
  onOpenChange 
}: OfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const offerPercentage = amount ? Math.round((parseFloat(amount) / listingPrice) * 100) : 0;

  const handleMakeOffer = async () => {
    if (!user) return;

    try {
      const validatedData = offerSchema.parse({ 
        amount: parseFloat(amount),
        message: message || undefined,
      });

      setIsLoading(true);

      const { error } = await supabase
        .from('offers')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          amount: validatedData.amount,
          message: validatedData.message,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        });

      if (error) throw error;

      toast({
        title: 'Offer sent!',
        description: 'Your offer has been sent to the seller.',
      });

      onOpenChange(false);
      setAmount('');
      setMessage('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error making offer',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            Make an offer for "{listingTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>Asking price:</span>
              <span className="font-semibold">£{listingPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Your Offer *</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={listingPrice}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {amount && (
              <p className="text-xs text-muted-foreground">
                Your offer is {offerPercentage}% of the asking price
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-message">Message (optional)</Label>
            <Textarea
              id="offer-message"
              placeholder="Add a personal message to strengthen your offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMakeOffer} 
              className="flex-1"
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PoundSterling className="mr-2 h-4 w-4" />
                  Make Offer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDialog;