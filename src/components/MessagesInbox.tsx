import { useState } from 'react';
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
  Eye,
  Calendar,
  Reply
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import MessageDialog from '@/components/MessageDialog';

interface Message {
  id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  sender_profile: {
    username: string;
    avatar_url: string;
  };
  listing: {
    title: string;
    price: number;
    images: string[];
  };
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
  const [replyMessage, setReplyMessage] = useState<{
    senderId: string;
    listingId: string;
    listingTitle: string;
  } | null>(null);

  // Fetch messages with sender profile
  const { data: messagesData = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      if (!messages || messages.length === 0) return [];

      // Get sender profiles
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', senderIds);
      
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
        listing: listings?.find(l => l.id === message.listing_id) || null
      }));
    },
    enabled: !!user,
  });

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

  const messages = messagesData;
  const receivedOffers = receivedOffersData;
  const madeOffers = madeOffersData;

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      refetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
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

  const unreadCount = messages.filter(m => !m.read).length;
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
          {messages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className={`shadow-soft hover:shadow-medium transition-shadow ${!message.read ? 'border-primary' : ''}`}>
                 <CardContent className="p-4 sm:p-6">
                   <div className="flex flex-col sm:flex-row items-start gap-4">
                      <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-border">
                        <AvatarImage src={message.sender_profile?.avatar_url} />
                         <AvatarFallback className="border-2 border-border">
                           {message.sender_profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                         </AvatarFallback>
                      </Avatar>
                     
                     <div className="flex-1 min-w-0 w-full">
                       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                         <div className="min-w-0 flex-1">
                           <p className="font-semibold text-base">
                             @{message.sender_profile?.username || 'Anonymous'}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             About:{' '}
                             <button
                               onClick={() => navigate(`/listing/${message.listing_id}`)}
                               className="text-primary hover:underline font-medium"
                             >
                               {message.listing?.title}
                             </button>
                           </p>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                           <p className="text-xs text-muted-foreground whitespace-nowrap">
                             {new Date(message.created_at).toLocaleDateString('en-GB', {
                               day: '2-digit',
                               month: '2-digit',
                               year: 'numeric'
                             })}
                           </p>
                           {!message.read && (
                             <Badge variant="default" className="text-xs">New</Badge>
                           )}
                         </div>
                       </div>
                       
                       <div className="bg-muted/50 rounded-lg p-3 mb-3">
                         <p className="text-sm break-words">{message.content}</p>
                       </div>
                       
                       <div className="flex flex-wrap gap-2">
                         <Button 
                           size="sm" 
                           onClick={() => setReplyMessage({
                             senderId: message.sender_id,
                             listingId: message.listing_id,
                             listingTitle: message.listing?.title || 'Listing'
                           })}
                         >
                           <Reply className="mr-2 h-4 w-4" />
                           Reply
                         </Button>
                         {!message.read && (
                           <Button 
                             size="sm" 
                             variant="outline"
                             onClick={() => handleMarkAsRead(message.id)}
                           >
                             Mark as Read
                           </Button>
                         )}
                       </div>
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
                          <Eye className="mr-2 h-3 w-3" />
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

      {/* Reply Dialog */}
      {replyMessage && (
        <MessageDialog
          listingId={replyMessage.listingId}
          sellerId={replyMessage.senderId}
          listingTitle={replyMessage.listingTitle}
          open={!!replyMessage}
          onOpenChange={(open) => {
            if (!open) {
              setReplyMessage(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default MessagesInbox;