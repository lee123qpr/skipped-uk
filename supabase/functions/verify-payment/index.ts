import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, transactionId, forceCheck } = await req.json();
    
    logStep("Request received", { sessionId, transactionId, forceCheck });

    // Support both sessionId and transactionId for verification
    if (!sessionId && !transactionId) {
      throw new Error("Missing sessionId or transactionId");
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

    logStep("User authenticated", { userId: user.id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let session;
    let transactionIdToUpdate;

    // If transactionId provided, fetch transaction and check Stripe directly
    if (transactionId) {
      logStep("Manual verification by transactionId", { transactionId });

      const { data: transaction } = await supabaseClient
        .from("transactions")
        .select("stripe_payment_intent_id, listing_id, seller_id, amount")
        .eq("id", transactionId)
        .eq("buyer_id", user.id)
        .single();

      if (!transaction || !transaction.stripe_payment_intent_id) {
        throw new Error("Transaction not found or no payment intent");
      }

      // Check payment intent status directly
      const paymentIntent = await stripe.paymentIntents.retrieve(
        transaction.stripe_payment_intent_id
      );

      logStep("Payment intent status", { 
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id
      });

      if (paymentIntent.status !== "succeeded") {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: "Payment not completed"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      transactionIdToUpdate = transactionId;
      // Create a pseudo-session object for consistent handling below
      session = {
        metadata: { transaction_id: transactionId },
        payment_status: "paid"
      };
    } else {
      // Retrieve the checkout session
      session = await stripe.checkout.sessions.retrieve(sessionId);
      
      logStep("Session retrieved", { 
        sessionId: session.id,
        paymentStatus: session.payment_status,
        status: session.status
      });

      if (session.payment_status !== "paid") {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: "Payment not completed"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      // Get transaction ID from metadata
      transactionIdToUpdate = session.metadata?.transaction_id;
      if (!transactionIdToUpdate) {
        throw new Error("Transaction ID not found in session metadata");
      }
    }

    logStep("Transaction ID found", { transactionId: transactionIdToUpdate });

    // Update transaction status to paid
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", transactionIdToUpdate)
      .eq("buyer_id", user.id);

    if (updateError) {
      logStep("Failed to update transaction", updateError);
      throw new Error("Failed to update transaction status");
    }

    logStep("Transaction updated to paid");

    // Send notification message to seller
    const { data: transaction } = await supabaseClient
      .from("transactions")
      .select("seller_id, listing_id, amount")
      .eq("id", transactionIdToUpdate)
      .single();

    if (transaction) {
      // Check if payment confirmation message already exists
      const { data: existingMessage } = await supabaseClient
        .from("messages")
        .select("id")
        .eq("listing_id", transaction.listing_id)
        .eq("sender_id", user.id)
        .eq("receiver_id", transaction.seller_id)
        .eq("message_type", "system")
        .ilike("content", `Payment of £${transaction.amount} received%`)
        .single();

      if (!existingMessage) {
        // Send specific messages to both buyer and seller
        await supabaseClient
          .from("messages")
          .insert([
            {
              sender_id: user.id,
              receiver_id: transaction.seller_id,
              listing_id: transaction.listing_id,
              content: `💰 Payment of £${transaction.amount} received in escrow. Please mark as dispatched when you send the item.`,
              message_type: "system",
              read: false,
            },
            {
              sender_id: user.id,
              receiver_id: user.id,
              listing_id: transaction.listing_id,
              content: `✅ Payment confirmed! Your payment of £${transaction.amount} is held securely in escrow. You'll receive the item once the seller dispatches it.`,
              message_type: "system",
              read: false,
            }
          ]);
        
        logStep("Notifications sent to both parties");
      } else {
        logStep("Payment notification already exists, skipping");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and transaction updated"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
