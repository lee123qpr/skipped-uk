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
    const { transactionId, amount, buyerProtectionFee } = await req.json();
    
    console.log("[CREATE-PAYMENT-INTENT] Request received", { transactionId, amount, buyerProtectionFee });

    if (!transactionId || !amount) {
      throw new Error("Missing required fields: transactionId and amount");
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

    console.log("[CREATE-PAYMENT-INTENT] User authenticated", { userId: user.id });

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*, listings(*), profiles!transactions_seller_id_fkey(*)")
      .eq("id", transactionId)
      .eq("buyer_id", user.id)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or unauthorized");
    }

    console.log("[CREATE-PAYMENT-INTENT] Transaction found", { 
      transactionId: transaction.id,
      status: transaction.status 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate total amount (item price + buyer protection fee)
    const protectionFee = buyerProtectionFee || (amount * 0.05); // 5% default
    const totalAmount = Math.round((parseFloat(amount) + protectionFee) * 100); // Convert to pence

    console.log("[CREATE-PAYMENT-INTENT] Calculated amounts", {
      itemPrice: amount,
      protectionFee,
      totalAmount: totalAmount / 100
    });

    // Create or get customer
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("[CREATE-PAYMENT-INTENT] Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("[CREATE-PAYMENT-INTENT] New customer created", { customerId });
    }

    // Create Payment Intent with manual capture (holds funds in escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      customer: customerId,
      capture_method: "manual", // This holds the funds without capturing
      metadata: {
        transaction_id: transactionId,
        listing_id: transaction.listing_id,
        seller_id: transaction.seller_id,
        buyer_id: user.id,
      },
      description: `Purchase: ${transaction.listings.title}`,
    });

    console.log("[CREATE-PAYMENT-INTENT] Payment Intent created", {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });

    // Update transaction with payment details
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        buyer_protection_fee: protectionFee,
        status: "pending_payment",
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[CREATE-PAYMENT-INTENT] Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    console.log("[CREATE-PAYMENT-INTENT] Transaction updated successfully");

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CREATE-PAYMENT-INTENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
