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

const counterOfferSchema = z.object({
  amount: z.number().positive('Counter offer amount must be positive').max(999999, 'Amount must be less than £1,000,000'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
});

interface CounterOfferDialogProps {
  originalOfferId: string;
  buyerId: string;
  listingId: string;
  listingTitle: string;
  originalAmount: number;
  listingPrice: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CounterOfferDialog = ({ 
  originalOfferId,
  buyerId,
  listingId,
  listingTitle,
  originalAmount,
  listingPrice,
  open,
  onOpenChange,
  onSuccess
}: CounterOfferDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const counterPercentage = amount ? Math.round((parseFloat(amount) / listingPrice) * 100) : 0;

  const handleCounterOffer = async () => {
    if (!user) return;

    try {
      const validatedData = counterOfferSchema.parse({ 
        amount: parseFloat(amount),
        message: message || undefined,
      });

      setIsLoading(true);

      // Create the counter offer
      const { data: counterOfferData, error: offerError } = await supabase
        .from('offers')
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: user.id,
          amount: validatedData.amount,
          message: validatedData.message,
          parent_offer_id: originalOfferId,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Update original offer status to 'countered'
      const { error: updateError } = await supabase
        .from('offers')
        .update({ status: 'countered' })
        .eq('id', originalOfferId);

      if (updateError) throw updateError;

      // Create a message in the conversation thread
      const counterMessage = validatedData.message 
        ? `Counter offer: £${validatedData.amount}\n\n${validatedData.message}`
        : `Counter offer: £${validatedData.amount}`;

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: buyerId,
          listing_id: listingId,
          content: counterMessage,
          message_type: 'offer',
          offer_id: counterOfferData.id,
          read: false
        });

      if (messageError) throw messageError;

      toast({
        title: 'Counter offer sent!',
        description: 'Your counter offer has been sent to the buyer.',
      });

      onOpenChange(false);
      setAmount('');
      setMessage('');
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error making counter offer',
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
          <DialogTitle>Make Counter Offer</DialogTitle>
          <DialogDescription>
            Counter the buyer's offer for "{listingTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Asking price:</span>
              <span className="font-semibold">£{listingPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Buyer's offer:</span>
              <span className="font-semibold text-primary">£{originalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-amount">Your Counter Offer *</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="counter-amount"
                type="number"
                step="0.01"
                min={originalAmount}
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
                Your counter offer is {counterPercentage}% of the asking price
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-message">Message (optional)</Label>
            <Textarea
              id="counter-message"
              placeholder="Explain your counter offer to the buyer..."
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
              onClick={handleCounterOffer} 
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
                  Send Counter Offer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CounterOfferDialog;
