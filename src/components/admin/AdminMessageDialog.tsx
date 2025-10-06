import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { MessageCircle } from 'lucide-react';

interface AdminMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export const AdminMessageDialog = ({ open, onOpenChange, userId, userName }: AdminMessageDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim()) return;

    if (message.length < 10) {
      toast({
        title: "Message too short",
        description: "Please write at least 10 characters",
        variant: "destructive"
      });
      return;
    }

    if (message.length > 2000) {
      toast({
        title: "Message too long",
        description: "Please keep your message under 2000 characters",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          listing_id: null, // Admin messages have no listing
          content: message.trim(),
          message_type: 'system',
          read: false
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: `Your message to ${userName} has been delivered`,
      });

      setMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending admin message:', error);
      toast({
        title: "Failed to send message",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Message User
          </DialogTitle>
          <DialogDescription>
            Send a system message to {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters (minimum 10)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || message.trim().length < 10}
          >
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
