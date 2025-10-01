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

    if (!transaction.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this transaction");
    }

    console.log("[CONFIRM-DELIVERY] Transaction verified", { 
      transactionId: transaction.id,
      paymentIntentId: transaction.stripe_payment_intent_id 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
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
    const itemAmount = parseFloat(paymentIntent.metadata.item_amount) * 100;
    
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

    console.log("[CONFIRM-DELIVERY] Transfer created", {
      transferId: transfer.id,
      amount: transfer.amount / 100,
      destination: transfer.destination
    });

    // Update transaction status to completed with transfer ID
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "completed",
        stripe_transfer_id: transfer.id,
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

    // Create system message for seller
    await supabaseClient
      .from("messages")
      .insert({
        sender_id: transaction.buyer_id,
        receiver_id: transaction.seller_id,
        listing_id: transaction.listing_id,
        content: "Buyer confirmed delivery. Funds have been released!",
        message_type: "system",
        read: false,
      });

    console.log("[CONFIRM-DELIVERY] Delivery confirmed and funds transferred");

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: "completed",
        transferCompleted: true,
        transferId: transfer.id
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
