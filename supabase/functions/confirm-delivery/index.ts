import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId } = await req.json();
    
    console.log("[CONFIRM-DELIVERY] Request received", { transactionId });

    if (!transactionId) {
      throw new Error("Missing required field: transactionId");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    console.log("[CONFIRM-DELIVERY] User authenticated", { userId: user.id });

    // Get transaction and verify user is the buyer
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("buyer_id", user.id)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or unauthorized");
    }

    if (transaction.status !== "dispatched") {
      throw new Error("Transaction must be dispatched before confirming delivery");
    }

    console.log("[CONFIRM-DELIVERY] Transaction verified", { 
      transactionId: transaction.id,
      hasPaymentIntent: !!transaction.stripe_payment_intent_id 
    });

    let transferId = null;
    let itemAmount = transaction.amount;

    // Only process Stripe payment if payment intent exists
    if (transaction.stripe_payment_intent_id) {
      // Initialize Stripe
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2024-06-20",
      });

      // Get payment intent to retrieve seller account ID from metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(
        transaction.stripe_payment_intent_id
      );

      if (!paymentIntent.transfer_data?.destination) {
        throw new Error("No destination account found for transfer");
      }

      console.log("[CONFIRM-DELIVERY] Payment intent retrieved", {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        destination: paymentIntent.transfer_data.destination
      });

      // Payment was already captured to platform at purchase time
      // Now create Transfer to seller's Connect account
      itemAmount = parseFloat(paymentIntent.metadata.item_amount) * 100;
      
      const transfer = await stripe.transfers.create({
        amount: itemAmount, // Transfer item price only (platform keeps protection fee)
        currency: "gbp",
        destination: paymentIntent.transfer_data.destination,
        transfer_group: transaction.id,
        metadata: {
          transaction_id: transaction.id,
          listing_id: transaction.listing_id,
          buyer_id: transaction.buyer_id,
          seller_id: transaction.seller_id,
        },
        description: `Payout for transaction ${transaction.id}`,
      });

      transferId = transfer.id;

      console.log("[CONFIRM-DELIVERY] Transfer created", {
        transferId: transfer.id,
        amount: transfer.amount / 100,
        destination: transfer.destination
      });
    } else {
      console.log("[CONFIRM-DELIVERY] No payment intent - completing without Stripe transfer");
    }

    // Update transaction status to completed with transfer ID (if exists)
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "completed",
        stripe_transfer_id: transferId,
        delivery_confirmed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[CONFIRM-DELIVERY] Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    // Mark listing as sold
    await supabaseClient
      .from("listings")
      .update({ 
        status: "sold",
        available: false 
      })
      .eq("id", transaction.listing_id);

    // Create system messages for both parties with role-specific content
    const hasPayment = !!transaction.stripe_payment_intent_id;
    await supabaseClient
      .from("messages")
      .insert([
        {
          sender_id: transaction.buyer_id,
          receiver_id: transaction.seller_id,
          listing_id: transaction.listing_id,
          transaction_id: transactionId,
          content: hasPayment 
            ? `✅ Delivery confirmed by buyer! Funds of £${(itemAmount / 100).toFixed(2)} have been released to your account. You can now leave a review for the buyer.`
            : `✅ Delivery confirmed by buyer! Transaction complete. You can now leave a review for the buyer.`,
          message_type: "system",
          read: false,
        },
        {
          sender_id: transaction.buyer_id,
          receiver_id: transaction.buyer_id,
          listing_id: transaction.listing_id,
          transaction_id: transactionId,
          content: `✅ You've confirmed delivery! Transaction complete. Thank you for your purchase. Please leave a review for the seller.`,
          message_type: "system",
          read: false,
        }
      ]);

    console.log("[CONFIRM-DELIVERY] Delivery confirmed, funds transferred, and review notifications sent");

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "completed",
        transferCompleted: !!transferId,
        transferId: transferId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CONFIRM-DELIVERY] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
