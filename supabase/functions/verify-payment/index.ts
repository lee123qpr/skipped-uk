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
    const { sessionId } = await req.json();
    
    logStep("Request received", { sessionId });

    if (!sessionId) {
      throw new Error("Missing sessionId");
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

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
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
    const transactionId = session.metadata?.transaction_id;
    if (!transactionId) {
      throw new Error("Transaction ID not found in session metadata");
    }

    logStep("Transaction ID found", { transactionId });

    // Update transaction status to paid
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "paid",
      })
      .eq("id", transactionId)
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
      .eq("id", transactionId)
      .single();

    if (transaction) {
      await supabaseClient
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: transaction.seller_id,
          listing_id: transaction.listing_id,
          content: `Payment of £${transaction.amount} received. Please mark as shipped when dispatched.`,
          message_type: "system",
          read: false,
        });
      
      logStep("Notification sent to seller");
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
