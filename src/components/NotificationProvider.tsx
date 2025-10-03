import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, PoundSterling, Package, AlertCircle } from 'lucide-react';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  action_url: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
  metadata: any;
}

interface NotificationCounts {
  unreadMessages: number;
  pendingOffers: number;
  newOffers: number;
  unreadNotifications: number;
}

interface NotificationContextType {
  counts: NotificationCounts;
  notifications: Notification[];
  refreshCounts: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  counts: { unreadMessages: 0, pendingOffers: 0, newOffers: 0, unreadNotifications: 0 },
  notifications: [],
  refreshCounts: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingOffers: 0,
    newOffers: 0,
    unreadNotifications: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchCounts = async () => {
    if (!user) {
      setCounts({ unreadMessages: 0, pendingOffers: 0, newOffers: 0, unreadNotifications: 0 });
      setNotifications([]);
      return;
    }

    try {
      // Fetch unread messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      // Fetch pending offers count (offers received by user)
      const { count: pendingOffersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'pending');

      // Fetch new offers count (offers made by user that got responses)
      const { count: newOffersCount } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', user.id)
        .in('status', ['accepted', 'declined']);

      // Fetch unread notifications
      const { data: notificationsData, count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(20);

      setCounts({
        unreadMessages: messagesCount || 0,
        pendingOffers: pendingOffersCount || 0,
        newOffers: newOffersCount || 0,
        unreadNotifications: notificationsCount || 0,
      });

      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setCounts(prev => ({
        ...prev,
        unreadNotifications: Math.max(0, prev.unreadNotifications - 1),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setCounts(prev => ({ ...prev, unreadNotifications: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const refreshCounts = fetchCounts;

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchCounts();

    // Set up real-time subscriptions for notifications
    const notificationChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev].slice(0, 20));
          
          // Update counts
          setCounts(prev => ({
            ...prev,
            unreadNotifications: prev.unreadNotifications + 1,
          }));

          // Show toast
          const icon = 
            newNotification.type === 'transaction' ? <Package className="h-4 w-4" /> :
            newNotification.type === 'dispute' ? <AlertCircle className="h-4 w-4" /> :
            newNotification.type === 'offer' ? <PoundSterling className="h-4 w-4" /> :
            <MessageCircle className="h-4 w-4" />;

          toast({
            title: newNotification.title,
            description: newNotification.description,
            action: icon,
          });
        }
      )
      .subscribe();

    const messageChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch sender details and listing info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.sender_id)
            .single();

          const { data: listingData } = await supabase
            .from('listings')
            .select('title')
            .eq('id', payload.new.listing_id)
            .single();

          const senderName = senderData?.display_name || senderData?.username || 'Someone';
          const listingTitle = listingData?.title || 'your listing';

          toast({
            title: 'New message received',
            description: `${senderName} sent you a message about ${listingTitle}`,
            action: (
              <MessageCircle className="h-4 w-4" />
            ),
          });

          // Update counts
          setCounts(prev => ({
            ...prev,
            unreadMessages: prev.unreadMessages + 1,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Message was marked as read
          if (payload.old.read === false && payload.new.read === true) {
            setCounts(prev => ({
              ...prev,
              unreadMessages: Math.max(0, prev.unreadMessages - 1),
            }));
          }
        }
      )
      .subscribe();

    const offerChannel = supabase
      .channel('offers-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
          filter: `seller_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch buyer details and listing info
          const { data: buyerData } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('user_id', payload.new.buyer_id)
            .single();

          const { data: listingData } = await supabase
            .from('listings')
            .select('title')
            .eq('id', payload.new.listing_id)
            .single();

          const buyerName = buyerData?.display_name || buyerData?.username || 'Someone';
          const listingTitle = listingData?.title || 'your listing';
          const offerAmount = payload.new.amount;

          toast({
            title: 'New offer received',
            description: `${buyerName} made an offer of £${offerAmount} on ${listingTitle}`,
            action: (
              <PoundSterling className="h-4 w-4" />
            ),
          });

          // Update counts
          setCounts(prev => ({
            ...prev,
            pendingOffers: prev.pendingOffers + 1,
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `buyer_id=eq.${user.id}`,
        },
        async (payload) => {
          // Offer status was updated (accepted/declined)
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            // Fetch listing info
            const { data: listingData } = await supabase
              .from('listings')
              .select('title')
              .eq('id', payload.new.listing_id)
              .single();

            const listingTitle = listingData?.title || 'a listing';
            const status = payload.new.status;
            const offerAmount = payload.new.amount;

            toast({
              title: `Offer ${status}`,
              description: `Your offer of £${offerAmount} on ${listingTitle} was ${status}`,
              variant: status === 'accepted' ? 'default' : 'destructive',
              action: (
                <Package className="h-4 w-4" />
              ),
            });

            // Update counts
            setCounts(prev => ({
              ...prev,
              newOffers: prev.newOffers + 1,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'offers',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          // Offer was processed (no longer pending)
          if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
            setCounts(prev => ({
              ...prev,
              pendingOffers: Math.max(0, prev.pendingOffers - 1),
            }));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(offerChannel);
    };
  }, [user, toast]);

  return (
    <NotificationContext.Provider value={{ counts, notifications, refreshCounts, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};