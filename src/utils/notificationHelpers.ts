import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  description: string;
  action_url?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

export const createNotification = async (data: NotificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert(data);
    
    if (error) throw error;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const createTransactionNotification = async (
  userId: string,
  transactionId: string,
  listingId: string,
  title: string,
  description: string,
  actionUrl?: string
) => {
  return createNotification({
    user_id: userId,
    type: 'transaction',
    title,
    description,
    action_url: actionUrl || `/dashboard?tab=transactions&id=${transactionId}`,
    related_id: transactionId,
    metadata: { listing_id: listingId }
  });
};

export const createOfferNotification = async (
  userId: string,
  offerId: string,
  listingId: string,
  title: string,
  description: string
) => {
  return createNotification({
    user_id: userId,
    type: 'offer',
    title,
    description,
    action_url: `/dashboard?tab=messages&listing=${listingId}`,
    related_id: offerId,
    metadata: { listing_id: listingId }
  });
};

export const createDisputeNotification = async (
  userId: string,
  disputeId: string,
  transactionId: string,
  title: string,
  description: string
) => {
  return createNotification({
    user_id: userId,
    type: 'dispute',
    title,
    description,
    action_url: `/dashboard?tab=transactions&id=${transactionId}`,
    related_id: disputeId,
    metadata: { transaction_id: transactionId }
  });
};

export const createReviewReminderNotification = async (
  userId: string,
  transactionId: string,
  listingTitle: string
) => {
  return createNotification({
    user_id: userId,
    type: 'review_reminder',
    title: 'Leave a Review',
    description: `Don't forget to review your transaction for "${listingTitle}"`,
    action_url: `/dashboard?tab=reviews`,
    related_id: transactionId
  });
};
