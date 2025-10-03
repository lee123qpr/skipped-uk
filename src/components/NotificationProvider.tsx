import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, PoundSterling, Package, AlertCircle, Check } from 'lucide-react';

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

          // Show toast with enhanced variants and icons
          const getToastVariant = (type: string, metadata: any) => {
            if (type === 'dispute') return 'destructive';
            if (type === 'transaction') {
              if (metadata?.status === 'completed') return 'success';
              if (metadata?.status === 'disputed') return 'destructive';
            }
            if (type === 'offer' && metadata?.status === 'accepted') return 'success';
            if (type === 'offer' && metadata?.status === 'declined') return 'destructive';
            return 'default';
          };

          const getNotificationIcon = (type: string, metadata: any) => {
            if (type === 'transaction') {
              if (metadata?.action === 'payment') return <PoundSterling className="h-4 w-4" />;
              if (metadata?.action === 'dispatch') return <Package className="h-4 w-4" />;
              if (metadata?.action === 'delivery') return <Check className="h-4 w-4" />;
              return <Package className="h-4 w-4" />;
            }
            if (type === 'dispute') return <AlertCircle className="h-4 w-4" />;
            if (type === 'offer') return <PoundSterling className="h-4 w-4" />;
            return <MessageCircle className="h-4 w-4" />;
          };

          toast({
            title: newNotification.title,
            description: newNotification.description,
            variant: getToastVariant(newNotification.type, newNotification.metadata),
            action: getNotificationIcon(newNotification.type, newNotification.metadata),
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user, toast]);

  return (
    <NotificationContext.Provider value={{ counts, notifications, refreshCounts, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};