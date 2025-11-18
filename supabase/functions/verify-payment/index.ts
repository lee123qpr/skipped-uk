import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { validateString, ValidationException } from "../_shared/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting verify-payment");

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    logStep("User authenticated", { userId: user.id });

    // Parse and validate request body
    const body = await req.json();
    const sessionId = validateString(body.sessionId, 'sessionId', 10, 500);
    
    logStep("Session ID validated", { sessionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      paymentIntentId: session.payment_intent 
    });

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment not completed' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Retrieve payment intent to get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
    logStep("Payment intent retrieved", { paymentIntentId: paymentIntent.id });

    const metadata = paymentIntent.metadata;
    const { listing_id, buyer_id, seller_id, item_amount, buyer_protection_fee, delivery_cost, delivery_method, offer_id } = metadata;

    if (!listing_id || !buyer_id || !seller_id) {
      throw new Error('Missing required metadata');
    }

    // Check if transaction already exists for this payment intent
    const { data: existingTransaction } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .single();

    if (existingTransaction) {
      logStep("Transaction already exists", { transactionId: existingTransaction.id });
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Transaction already processed',
          transactionId: existingTransaction.id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Calculate amounts in pence for Stripe
    const itemAmountPence = parseInt(item_amount);
    const buyerProtectionFeePence = buyer_protection_fee ? parseInt(buyer_protection_fee) : 0;
    const deliveryCostPence = delivery_cost ? parseInt(delivery_cost) : 0;

    // Convert to pounds for database storage (store separately, not as total)
    const itemAmountPounds = itemAmountPence / 100;
    const buyerProtectionFeePounds = buyerProtectionFeePence / 100;
    const deliveryCostPounds = deliveryCostPence / 100;

    logStep("Creating new transaction", {
      listing_id,
      buyer_id,
      seller_id,
      itemAmountPounds,
      buyerProtectionFeePounds,
      deliveryCostPounds,
      deliveryMethod: delivery_method,
      paymentIntentId: paymentIntent.id
    });

    // Create new transaction with status 'paid' - store costs separately
    const { data: newTransaction, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        listing_id,
        buyer_id,
        seller_id,
        offer_id: offer_id || null,
        amount: itemAmountPounds, // Just the item cost
        buyer_protection_fee: buyerProtectionFeePounds,
        delivery_cost: deliveryCostPounds,
        delivery_method: delivery_method || 'collection',
        status: 'paid',
        stripe_payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      logStep("ERROR creating transaction", { error: transactionError });
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }
    logStep("Transaction created", { transactionId: newTransaction.id });

    // Update listing availability
    const { error: listingUpdateError } = await supabaseClient
      .from('listings')
      .update({ available: false })
      .eq('id', listing_id);

    if (listingUpdateError) {
      logStep("WARNING: Failed to update listing availability", { error: listingUpdateError });
    } else {
      logStep("Listing marked as unavailable");
    }

    // Fetch listing and user details for notifications
    const { data: listing } = await supabaseClient
      .from('listings')
      .select('title')
      .eq('id', listing_id)
      .single();

    const { data: buyerProfile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', buyer_id)
      .single();

    // Send system messages to both parties
    const messages = [
      {
        sender_id: seller_id,
        receiver_id: buyer_id,
        listing_id,
        transaction_id: newTransaction.id,
        content: `Payment received! Your payment of £${totalAmount.toFixed(2)} is securely held in escrow. The seller will now dispatch your item.`,
        message_type: 'system',
        read: false
      },
      {
        sender_id: buyer_id,
        receiver_id: seller_id,
        listing_id,
        transaction_id: newTransaction.id,
        content: `New order! ${buyerProfile?.display_name || 'A buyer'} has paid £${totalAmount.toFixed(2)} for "${listing?.title || 'your item'}". Please dispatch the item as soon as possible.`,
        message_type: 'system',
        read: false
      }
    ];

    const { error: messagesError } = await supabaseClient
      .from('messages')
      .insert(messages);

    if (messagesError) {
      logStep("ERROR: Failed to create messages", { error: messagesError });
      // Critical: Messages must be created for transaction visibility
      // Rollback transaction status to allow retry
      await supabaseClient
        .from('transactions')
        .update({ status: 'pending_payment' })
        .eq('id', newTransaction.id);
      throw new Error(`Failed to create system messages: ${messagesError.message}`);
    }
    logStep("System messages created");

    // Create notifications
    const notifications = [
      {
        user_id: buyer_id,
        type: 'transaction',
        title: 'Payment Successful',
        description: `Your payment of £${totalAmount.toFixed(2)} has been confirmed and is held securely.`,
        action_url: `/dashboard?tab=messages`,
        related_id: newTransaction.id,
        metadata: { listing_id, transaction_id: newTransaction.id }
      },
      {
        user_id: seller_id,
        type: 'transaction',
        title: 'New Order Received',
        description: `You received a new order for "${listing?.title || 'your item'}" worth £${totalAmount.toFixed(2)}.`,
        action_url: `/dashboard?tab=messages`,
        related_id: newTransaction.id,
        metadata: { listing_id, transaction_id: newTransaction.id }
      }
    ];

    const { error: notificationsError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (notificationsError) {
      logStep("WARNING: Failed to create notifications", { error: notificationsError });
    } else {
      logStep("Notifications created");
    }

    logStep("Payment verification completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Payment verified and transaction created',
        transactionId: newTransaction.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    
    // Handle validation errors with 400 status
    if (error instanceof ValidationException) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: error.errors
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
