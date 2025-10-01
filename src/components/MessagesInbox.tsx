import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/components/NotificationProvider';
import { TransactionManager } from '@/components/TransactionManager';
import CounterOfferDialog from '@/components/CounterOfferDialog';
import { 
  MessageCircle, 
  PoundSterling, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Send,
  Mail,
  ArrowRightLeft,
  ShoppingCart,
  CreditCard,
  Package,
  Truck,
  Star,
  PartyPopper,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  message_type?: 'message' | 'offer' | 'system';
  offer_id?: string;
  sender_profile?: {
    username: string;
    avatar_url: string;
  };
  receiver_profile?: {
    username: string;
    avatar_url: string;
  };
  listing?: {
    title: string;
    price: number;
    images: string[];
  };
  offer?: {
    id: string;
    amount: number;
    status: string;
    message: string;
    buyer_id: string;
    seller_id: string;
  };
}

interface Conversation {
  otherUserId: string;
  otherUserProfile: {
    username: string;
    avatar_url: string;
  };
  listingId: string;
  listing: {
    title: string;
    price: number;
    images: string[];
  };
  messages: Message[];
  unreadCount: number;
  lastMessage: Message;
  transaction?: {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    status: string;
    stripe_payment_intent_id: string | null;
    dispatch_confirmed_at: string | null;
    delivery_confirmed_at: string | null;
    dispute_reason: string | null;
  };
}

interface ConversationStatus {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  bgColor: string;
}

interface Offer {
  id: string;
  amount: number;
  message: string;
  status: string;
  created_at: string;
  expires_at: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  buyer_profile: {
    username: string;
    avatar_url: string;
  };
  seller_profile: {
    username: string;
    avatar_url: string;
  };
  listing: {
    title: string;
    price: number;
    images: string[];
  };
}

const MessagesInbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshCounts } = useNotifications();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [counterOfferDialog, setCounterOfferDialog] = useState<{
    open: boolean;
    offerId: string;
    buyerId: string;
    listingId: string;
    listingTitle: string;
    originalAmount: number;
    listingPrice: number;
  } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Determine conversation status based on offer and transaction state
  const getConversationStatus = (conversation: Conversation, userId: string): ConversationStatus | null => {
    const { transaction } = conversation;
    const latestOffer = conversation.messages
      .filter(m => m.offer)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.offer;
    
    const isBuyer = transaction?.buyer_id === userId || latestOffer?.buyer_id === userId;
    
    // Priority 1: Disputes
    if (transaction?.status === 'disputed') {
      return {
        label: 'Disputed',
        icon: AlertTriangle,
        variant: 'destructive',
        bgColor: 'bg-destructive/10'
      };
    }
    
    // Priority 2: Completed transaction
    if (transaction?.status === 'completed') {
      return {
        label: 'Completed',
        icon: PartyPopper,
        variant: 'secondary',
        bgColor: 'bg-secondary/10'
      };
    }
    
    // Priority 3: Active transaction states
    if (transaction) {
      if (transaction.status === 'delivered') {
        return isBuyer 
          ? {
              label: 'Ready to Complete',
              icon: Star,
              variant: 'default',
              bgColor: 'bg-primary/10'
            }
          : {
              label: 'Item Delivered',
              icon: CheckCircle,
              variant: 'secondary',
              bgColor: 'bg-secondary/10'
            };
      }
      
      if (transaction.status === 'dispatched') {
        return {
          label: 'Item Shipped',
          icon: Truck,
          variant: 'secondary',
          bgColor: 'bg-secondary/10'
        };
      }
      
      if (transaction.status === 'paid') {
        return isBuyer 
          ? {
              label: 'Payment Made',
              icon: CheckCircle,
              variant: 'secondary',
              bgColor: 'bg-secondary/10'
            }
          : {
              label: 'Payment Received',
              icon: CreditCard,
              variant: 'default',
              bgColor: 'bg-primary/10'
            };
      }
      
      if (transaction.status === 'pending_payment') {
        return isBuyer 
          ? {
              label: 'Payment Required',
              icon: CreditCard,
              variant: 'default',
              bgColor: 'bg-primary/10'
            }
          : {
              label: 'Awaiting Payment',
              icon: Clock,
              variant: 'outline',
              bgColor: 'bg-muted/50'
            };
      }
      
      if (transaction.status === 'pending') {
        return {
          label: 'Transaction Pending',
          icon: Clock,
          variant: 'outline',
          bgColor: 'bg-muted/50'
        };
      }
    }
    
    // Priority 4: Offer states
    if (latestOffer) {
      if (latestOffer.status === 'accepted') {
        return isBuyer 
          ? {
              label: 'Offer Accepted',
              icon: CheckCircle,
              variant: 'default',
              bgColor: 'bg-primary/10'
            }
          : {
              label: 'Offer Accepted',
              icon: CheckCircle,
              variant: 'secondary',
              bgColor: 'bg-secondary/10'
            };
      }
      
      if (latestOffer.status === 'declined') {
        return {
          label: 'Offer Declined',
          icon: XCircle,
          variant: 'destructive',
          bgColor: 'bg-destructive/10'
        };
      }
      
      if (latestOffer.status === 'countered') {
        return {
          label: 'Counter Offer',
          icon: ArrowRightLeft,
          variant: 'default',
          bgColor: 'bg-primary/10'
        };
      }
      
      if (latestOffer.status === 'pending') {
        return isBuyer 
          ? {
              label: 'Offer Sent',
              icon: Clock,
              variant: 'outline',
              bgColor: 'bg-muted/50'
            }
          : {
              label: 'Offer Received',
              icon: Inbox,
              variant: 'default',
              bgColor: 'bg-primary/10'
            };
      }
    }
    
    return null;
  };

  // Scroll to show latest messages when conversation loads
  useEffect(() => {
    if (selectedConversation && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Scroll to 75% of the way down to show recent messages while keeping older ones visible
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;
        const scrollPosition = Math.max(0, scrollHeight - clientHeight - 100);
        scrollContainer.scrollTop = scrollPosition;
      }
    }
  }, [selectedConversation?.messages.length, selectedConversation?.listingId]);

  // Fetch all messages (sent and received)
  const { data: allMessagesData = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['allMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all messages where user is sender or receiver
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*, offer_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return [];

      // Get offers for messages that have offer_id
      const offerIds = messages.filter(m => m.offer_id).map(m => m.offer_id);
      let offers: any[] = [];
      if (offerIds.length > 0) {
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('id, amount, status, message, buyer_id, seller_id')
          .in('id', offerIds);
        
        if (offersError) throw offersError;
        offers = offersData || [];
      }

      // Get all unique user IDs (including current user for their own messages)
      const userIds = [...new Set([
        ...messages.map(m => m.sender_id),
        ...messages.map(m => m.receiver_id)
      ])];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', userIds);
      
      if (profilesError) throw profilesError;

      // Get listings
      const listingIds = [...new Set(messages.map(m => m.listing_id))];
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, images')
        .in('id', listingIds);
      
      if (listingsError) throw listingsError;

      // Get transactions for these listings and involving the current user
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .in('listing_id', listingIds)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      
      if (transactionsError) console.error('Error fetching transactions:', transactionsError);

      // Combine data
      return messages.map(message => ({
        ...message,
        sender_profile: profiles?.find(p => p.user_id === message.sender_id) || null,
        receiver_profile: profiles?.find(p => p.user_id === message.receiver_id) || null,
        listing: listings?.find(l => l.id === message.listing_id) || null,
        offer: message.offer_id ? offers?.find(o => o.id === message.offer_id) || null : null,
        transaction: transactions?.find(t => 
          t.listing_id === message.listing_id &&
          ((t.buyer_id === user.id && t.seller_id === message.receiver_id) ||
           (t.seller_id === user.id && t.buyer_id === message.receiver_id))
        ) || null
      }));
    },
    enabled: !!user,
  });

  // Group messages into conversations
  const conversations: Record<string, Conversation> = allMessagesData.reduce((acc, message) => {
    const otherUserId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
    const key = `${message.listing_id}-${otherUserId}`;
    
    if (!acc[key]) {
      acc[key] = {
        otherUserId,
        otherUserProfile: message.sender_id === user?.id 
          ? message.receiver_profile 
          : message.sender_profile,
        listingId: message.listing_id,
        listing: message.listing,
        messages: [],
        unreadCount: 0,
        lastMessage: message,
        transaction: message.transaction || undefined
      };
    }
    
    acc[key].messages.push(message);
    
    // Update transaction if found in message
    if (message.transaction && !acc[key].transaction) {
      acc[key].transaction = message.transaction;
    }
    
    // Count unread messages received by current user
    if (message.receiver_id === user?.id && !message.read) {
      acc[key].unreadCount++;
    }
    
    // Update last message if this is newer
    if (new Date(message.created_at) > new Date(acc[key].lastMessage.created_at)) {
      acc[key].lastMessage = message;
    }
    
    return acc;
  }, {} as Record<string, Conversation>);

  const conversationsList = Object.values(conversations).sort((a, b) => 
    new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );

  // Fetch offers (received) with buyer profile
  const { data: receivedOffersData = [], isLoading: offersLoading, refetch: refetchOffers } = useQuery({
    queryKey: ['receivedOffers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get offers
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (offersError) throw offersError;
      if (!offers || offers.length === 0) return [];

      // Get buyer profiles
      const buyerIds = [...new Set(offers.map(o => o.buyer_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', buyerIds);
      
      if (profilesError) throw profilesError;

      // Get listings
      const listingIds = [...new Set(offers.map(o => o.listing_id))];
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, images')
        .in('id', listingIds);
      
      if (listingsError) throw listingsError;

      // Combine data
      return offers.map(offer => ({
        ...offer,
        buyer_profile: profiles?.find(p => p.user_id === offer.buyer_id) || null,
        listing: listings?.find(l => l.id === offer.listing_id) || null
      }));
    },
    enabled: !!user,
  });

  // Fetch offers (made) with seller profile
  const { data: madeOffersData = [] } = useQuery({
    queryKey: ['madeOffers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get offers
      const { data: offers, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (offersError) throw offersError;
      if (!offers || offers.length === 0) return [];

      // Get seller profiles
      const sellerIds = [...new Set(offers.map(o => o.seller_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', sellerIds);
      
      if (profilesError) throw profilesError;

      // Get listings
      const listingIds = [...new Set(offers.map(o => o.listing_id))];
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price, images')
        .in('id', listingIds);
      
      if (listingsError) throw listingsError;

      // Combine data
      return offers.map(offer => ({
        ...offer,
        seller_profile: profiles?.find(p => p.user_id === offer.seller_id) || null,
        listing: listings?.find(l => l.id === offer.listing_id) || null
      }));
    },
    enabled: !!user,
  });

  const receivedOffers = receivedOffersData;
  const madeOffers = madeOffersData;
  const unreadCount = conversationsList.reduce((sum, conv) => sum + conv.unreadCount, 0);

  // Realtime subscription for instant message updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${user.id}`
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchMessages]);

  // Mark all messages in conversation as read
  useEffect(() => {
    if (selectedConversation && user) {
      const unreadMessageIds = selectedConversation.messages
        .filter(m => m.receiver_id === user.id && !m.read)
        .map(m => m.id);
      
      if (unreadMessageIds.length > 0) {
        supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessageIds)
          .then(async () => {
            await refetchMessages();
            // Refresh notification counts to ensure badges update
            await refreshCounts();
          });
      }
    }
  }, [selectedConversation, user, refreshCounts]);

  const handleSendReply = async () => {
    if (!selectedConversation || !user || !replyContent.trim()) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.otherUserId,
          listing_id: selectedConversation.listingId,
          content: replyContent.trim(),
          read: false
        });

      if (error) throw error;

      setReplyContent('');
      await refetchMessages();
      
      toast({
        title: 'Message sent',
        description: 'Your reply has been sent successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: action })
        .eq('id', offerId);

      if (error) throw error;

      toast({
        title: `Offer ${action}`,
        description: `The offer has been ${action}.`,
      });

      // Refetch messages to update offer status in the conversation
      await refetchMessages();
      await refetchOffers();
    } catch (error) {
      toast({
        title: 'Error updating offer',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const pendingOffersCount = receivedOffers.filter(o => o.status === 'pending').length;

  if (messagesLoading || offersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Messages & Offers</h2>
          <p className="text-sm text-muted-foreground">
            Manage your communications and offers
          </p>
        </div>
      </div>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-1 gap-1 h-auto p-1">
          <TabsTrigger 
            value="messages" 
            className="flex items-center gap-2 px-4 py-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Messages & Offers</span>
            {(unreadCount > 0 || pendingOffersCount > 0) && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount + pendingOffersCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          {conversationsList.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </CardContent>
            </Card>
          ) : selectedConversation ? (
            <Card className="shadow-soft">
              <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarImage src={selectedConversation.otherUserProfile?.avatar_url} />
                    <AvatarFallback>
                      {selectedConversation.otherUserProfile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      @{selectedConversation.otherUserProfile?.username || 'Anonymous'}
                    </p>
                    <button
                      onClick={() => navigate(`/listing/${selectedConversation.listingId}`)}
                      className="text-sm text-primary hover:underline"
                    >
                      {selectedConversation.listing?.title}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea ref={scrollAreaRef} className="h-[400px] px-3 py-2">
                  <div className="space-y-2">
                    {selectedConversation.messages.map((message) => {
                      const isCurrentUser = message.sender_id === user?.id;
                      const displayProfile = isCurrentUser 
                        ? message.sender_profile 
                        : message.sender_profile;
                      const displayUsername = displayProfile?.username || 'Anonymous';
                      const isOfferMessage = message.message_type === 'offer';
                      const isSystemMessage = message.message_type === 'system';
                      
                      // System messages (offer status updates)
                      if (isSystemMessage) {
                        return (
                          <div key={message.id} className="flex justify-center my-2">
                            <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs">
                              {message.content}
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar className="w-7 h-7 flex-shrink-0 border border-border">
                            <AvatarImage src={displayProfile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {displayUsername.charAt(0)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            <p className={`text-xs font-medium mb-0.5 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                              @{displayUsername}
                            </p>
                            
                            {/* Offer message bubble */}
                            {isOfferMessage && message.offer ? (
                              <div className={`inline-block rounded-lg px-3 py-3 border-2 ${
                                isCurrentUser
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-accent/10 border-accent'
                              } max-w-full`}>
                                 <p className="text-xs font-semibold mb-2">
                                   {selectedConversation.listing?.title}
                                 </p>
                                 <div className="flex items-center gap-2 mb-2">
                                   <PoundSterling className="h-4 w-4" />
                                   <span className="text-lg font-bold">£{message.offer.amount.toLocaleString()}</span>
                                    <Badge variant={
                                      message.offer.status === 'pending' ? 'default' : 
                                      message.offer.status === 'accepted' ? 'secondary' :
                                      message.offer.status === 'countered' ? 'outline' :
                                      'destructive'
                                    } className="text-xs">
                                      {message.offer.status.charAt(0).toUpperCase() + message.offer.status.slice(1)}
                                    </Badge>
                                 </div>
                                
                                {message.offer.message && (
                                  <p className="text-sm mb-2 break-words">{message.offer.message}</p>
                                )}
                                
                                {/* Accept/Decline/Counter buttons for seller on pending offers */}
                                {!isCurrentUser && message.offer.status === 'pending' && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleOfferAction(message.offer!.id, 'declined')}
                                      className="text-xs h-7"
                                    >
                                      <XCircle className="mr-1 h-3 w-3" />
                                      Decline
                                    </Button>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setCounterOfferDialog({
                                          open: true,
                                          offerId: message.offer!.id,
                                          buyerId: selectedConversation.otherUserId,
                                          listingId: selectedConversation.listingId,
                                          listingTitle: selectedConversation.listing.title,
                                          originalAmount: message.offer!.amount,
                                          listingPrice: selectedConversation.listing.price
                                        });
                                      }}
                                      className="text-xs h-7"
                                    >
                                      <PoundSterling className="mr-1 h-3 w-3" />
                                      Counter
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleOfferAction(message.offer!.id, 'accepted')}
                                      className="text-xs h-7"
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Accept
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Regular message bubble */
                              <div
                                className={`inline-block rounded-lg px-3 py-2 ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm break-words">{message.content}</p>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(message.created_at).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Transaction Management */}
                {selectedConversation.transaction && (
                  <div className="border-t p-3">
                    <TransactionManager
                      transaction={{
                        ...selectedConversation.transaction,
                        listings: selectedConversation.listing
                      }}
                      userRole={selectedConversation.transaction.buyer_id === user?.id ? 'buyer' : 'seller'}
                      onUpdate={() => {
                        refetchMessages();
                        refetchOffers();
                      }}
                    />
                  </div>
                )}

                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendReply}
                      disabled={isSending || !replyContent.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            conversationsList.map((conversation) => (
              <Card
                key={`${conversation.listingId}-${conversation.otherUserId}`}
                className={`shadow-soft hover:shadow-medium transition-shadow cursor-pointer ${
                  conversation.unreadCount > 0 ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-border">
                      <AvatarImage src={conversation.otherUserProfile?.avatar_url} />
                      <AvatarFallback>
                        {conversation.otherUserProfile?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            @{conversation.otherUserProfile?.username || 'Anonymous'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.listing?.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(conversation.lastMessage.created_at).toLocaleDateString('en-GB')}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      {(() => {
                        const status = getConversationStatus(conversation, user?.id || '');
                        if (status) {
                          const StatusIcon = status.icon;
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full mb-2 ${status.bgColor}`}>
                              <StatusIcon className="h-3 w-3" />
                              <span className="text-xs font-medium">{status.label}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.sender_id === user?.id ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>

      {/* Counter Offer Dialog */}
      {counterOfferDialog && (
        <CounterOfferDialog
          originalOfferId={counterOfferDialog.offerId}
          buyerId={counterOfferDialog.buyerId}
          listingId={counterOfferDialog.listingId}
          listingTitle={counterOfferDialog.listingTitle}
          originalAmount={counterOfferDialog.originalAmount}
          listingPrice={counterOfferDialog.listingPrice}
          open={counterOfferDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setCounterOfferDialog(null);
            }
          }}
          onSuccess={() => {
            refetchMessages();
            refetchOffers();
          }}
        />
      )}
    </div>
  );
};

export default MessagesInbox;