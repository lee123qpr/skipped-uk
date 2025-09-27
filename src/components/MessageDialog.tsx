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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { z } from 'zod';

const messageSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message must be less than 2000 characters'),
});

interface MessageDialogProps {
  listingId: string;
  sellerId: string;
  listingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessageDialog = ({ listingId, sellerId, listingTitle, open, onOpenChange }: MessageDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!user) return;

    try {
      const validatedData = messageSchema.parse({ message });
      setIsLoading(true);

      const { error } = await supabase
        .from('messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          receiver_id: sellerId,
          content: validatedData.message,
        });

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: 'Your message has been sent to the seller.',
      });

      onOpenChange(false);
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
          title: 'Error sending message',
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
          <DialogTitle>Contact Seller</DialogTitle>
          <DialogDescription>
            Send a message about "{listingTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="Hi, I'm interested in this item. Is it still available?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
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
              onClick={handleSendMessage} 
              className="flex-1"
              disabled={isLoading || message.length < 10}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;