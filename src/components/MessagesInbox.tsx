import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  PoundSterling, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Send
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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch all messages (sent and received)
  const { data: allMessagesData = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['allMessages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all messages where user is sender or receiver
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set([
        ...messages.map(m => m.sender_id),
        ...messages.map(m => m.receiver_id)
      ])].filter(id => id !== user.id);

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

      // Combine data
      return messages.map(message => ({
        ...message,
        sender_profile: profiles?.find(p => p.user_id === message.sender_id) || null,
        receiver_profile: profiles?.find(p => p.user_id === message.receiver_id) || null,
        listing: listings?.find(l => l.id === message.listing_id) || null
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
        lastMessage: message
      };
    }
    
    acc[key].messages.push(message);
    
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
          .then(() => refetchMessages());
      }
    }
  }, [selectedConversation, user]);

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

      refetchOffers();
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
        <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
          <TabsTrigger 
            value="messages" 
            className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs sm:text-sm"
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Messages</span>
            <span className="xs:hidden">Msg</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1 py-0 min-w-0 h-4">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="received-offers" 
            className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs sm:text-sm"
          >
            <PoundSterling className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Offers Received</span>
            <span className="xs:hidden">Recv</span>
            {pendingOffersCount > 0 && (
              <Badge variant="default" className="text-xs px-1 py-0 min-w-0 h-4">
                {pendingOffersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="made-offers" 
            className="flex flex-col sm:flex-row items-center gap-1 px-2 py-2 text-xs sm:text-sm"
          >
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Offers Made</span>
            <span className="xs:hidden">Made</span>
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
                <ScrollArea className="h-[400px] px-3 py-2">
                  <div className="space-y-2">
                    {selectedConversation.messages.map((message) => {
                      const isCurrentUser = message.sender_id === user?.id;
                      const displayProfile = isCurrentUser 
                        ? message.sender_profile 
                        : message.sender_profile;
                      const displayUsername = displayProfile?.username || 'Anonymous';
                      
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
                            <div
                              className={`inline-block rounded-lg px-3 py-2 ${
                                isCurrentUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm break-words">{message.content}</p>
                            </div>
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

        <TabsContent value="received-offers" className="space-y-4">
          {receivedOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <PoundSterling className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No offers received yet</p>
              </CardContent>
            </Card>
          ) : (
            receivedOffers.map((offer) => (
              <Card key={offer.id} className="shadow-soft hover:shadow-medium transition-shadow">
                 <CardContent className="p-4 sm:p-6">
                   <div className="flex flex-col sm:flex-row items-start gap-4"
                   >
                      <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-border">
                        <AvatarImage src={offer.buyer_profile?.avatar_url} />
                        <AvatarFallback className="border-2 border-border">
                          {offer.buyer_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                     
                     <div className="flex-1 min-w-0 w-full">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                         <div className="min-w-0 flex-1">
                           <p className="font-medium truncate">
                             @{offer.buyer_profile?.username || 'Anonymous'}
                           </p>
                           <p className="text-sm text-muted-foreground truncate">
                             Offer for: {offer.listing?.title}
                           </p>
                         </div>
                         <div className="flex-shrink-0 text-right">
                           <p className="text-lg font-bold">£{offer.amount.toLocaleString()}</p>
                           <Badge 
                             variant={offer.status === 'pending' ? 'default' : 
                                    offer.status === 'accepted' ? 'secondary' : 'destructive'}
                             className="text-xs"
                           >
                             {offer.status}
                           </Badge>
                         </div>
                       </div>
                       
                       {offer.message && (
                         <p className="mt-2 text-sm bg-muted p-2 rounded break-words">{offer.message}</p>
                       )}
                      
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                   <div className="text-xs text-muted-foreground space-y-1">
                     <p>Original price: £{offer.listing?.price?.toLocaleString()}</p>
                     <p>Created: {new Date(offer.created_at).toLocaleDateString('en-GB')}</p>
                     {offer.expires_at && (
                       <p>Expires: {new Date(offer.expires_at).toLocaleDateString('en-GB')}</p>
                     )}
                   </div>
                         {offer.status === 'pending' && (
                           <div className="flex flex-col xs:flex-row gap-2">
                             <Button 
                               size="sm" 
                               variant="destructive"
                               onClick={() => handleOfferAction(offer.id, 'declined')}
                               className="text-xs px-3"
                             >
                               <XCircle className="mr-1 h-3 w-3" />
                               <span className="hidden xs:inline">Decline</span>
                               <span className="xs:hidden">✗</span>
                             </Button>
                             <Button 
                               size="sm"
                               onClick={() => handleOfferAction(offer.id, 'accepted')}
                               className="text-xs px-3"
                             >
                               <CheckCircle className="mr-1 h-3 w-3" />
                               <span className="hidden xs:inline">Accept</span>
                               <span className="xs:hidden">✓</span>
                             </Button>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="made-offers" className="space-y-4">
          {madeOffers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't made any offers yet</p>
              </CardContent>
            </Card>
          ) : (
            madeOffers.map((offer) => (
              <Card key={offer.id}>
                 <CardContent className="p-4 sm:p-6">
                   <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                     <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                       {offer.listing?.images?.[0] ? (
                         <img 
                           src={offer.listing.images[0]} 
                           alt={offer.listing.title}
                           className="w-full h-full object-cover"
                           loading="lazy"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <PoundSterling className="h-4 w-4 text-muted-foreground" />
                         </div>
                       )}
                     </div>
                     
                     <div className="flex-1 min-w-0 w-full">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                         <div className="min-w-0 flex-1">
                           <p className="font-medium truncate">{offer.listing?.title}</p>
                           <p className="text-sm text-muted-foreground truncate">
                             Seller: @{offer.seller_profile?.username || 'Anonymous'}
                           </p>
                         </div>
                         <div className="flex-shrink-0">
                           <p className="text-lg font-bold">£{offer.amount.toLocaleString()}</p>
                           <Badge 
                             variant={offer.status === 'pending' ? 'default' : 
                                    offer.status === 'accepted' ? 'secondary' : 'destructive'}
                             className="text-xs"
                           >
                             {offer.status}
                           </Badge>
                         </div>
                       </div>
                      
                      {offer.message && (
                        <p className="mt-2 text-sm bg-muted p-2 rounded">{offer.message}</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-muted-foreground">
                          <p>Original price: £{offer.listing?.price?.toLocaleString()}</p>
                          <p>Created: {new Date(offer.created_at).toLocaleDateString('en-GB')}</p>
                          {offer.expires_at && (
                            <p>Expires: {new Date(offer.expires_at).toLocaleDateString('en-GB')}</p>
                          )}
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/listing/${offer.listing_id}`)}
                        >
                          View Listing
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagesInbox;