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
    const { transactionId, reason } = await req.json();
    
    console.log("[RAISE-DISPUTE] Request received", { transactionId, reason });

    if (!transactionId || !reason) {
      throw new Error("Missing required fields: transactionId and reason");
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

    console.log("[RAISE-DISPUTE] User authenticated", { userId: user.id });

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

    // Can only dispute if payment has been made but not completed
    if (!["paid", "dispatched", "delivered"].includes(transaction.status)) {
      throw new Error("Cannot dispute transaction in current status");
    }

    if (!transaction.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this transaction");
    }

    console.log("[RAISE-DISPUTE] Transaction verified", { 
      transactionId: transaction.id,
      paymentIntentId: transaction.stripe_payment_intent_id 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get payment intent details
    const paymentIntent = await stripe.paymentIntents.retrieve(
      transaction.stripe_payment_intent_id
    );

    // Create refund for the completed charge
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripe_payment_intent_id,
      reason: "requested_by_customer",
      metadata: {
        transaction_id: transactionId,
        dispute_reason: reason,
      },
    });

    console.log("[RAISE-DISPUTE] Refund created", {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    });

    // Update transaction status to disputed/refunded
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "refunded",
        dispute_reason: reason,
        disputed_at: new Date().toISOString(),
        refunded_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[RAISE-DISPUTE] Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    // Make listing available again
    await supabaseClient
      .from("listings")
      .update({ 
        status: "active",
        available: true 
      })
      .eq("id", transaction.listing_id);

    // Create system messages for both parties
    await supabaseClient
      .from("messages")
      .insert([
        {
          sender_id: transaction.buyer_id,
          receiver_id: transaction.seller_id,
          listing_id: transaction.listing_id,
          content: `Dispute raised: ${reason}. Transaction refunded.`,
          message_type: "system",
          read: false,
        },
        {
          sender_id: transaction.seller_id,
          receiver_id: transaction.buyer_id,
          listing_id: transaction.listing_id,
          content: "Your payment has been refunded due to the dispute.",
          message_type: "system",
          read: false,
        },
      ]);

    console.log("[RAISE-DISPUTE] Dispute processed and buyer refunded");

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "refunded",
        refunded: true 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[RAISE-DISPUTE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
