import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId, amount, buyerProtectionFee } = await req.json();
    
    logStep("Request received", { transactionId, amount, buyerProtectionFee });

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

    logStep("User authenticated", { userId: user.id });

    // Get transaction details including seller's Stripe account
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select(`
        *,
        listings(*),
        profiles!transactions_seller_id_fkey(
          stripe_account_id,
          stripe_onboarding_complete
        )
      `)
      .eq("id", transactionId)
      .eq("buyer_id", user.id)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or unauthorized");
    }

    logStep("Transaction found", { 
      transactionId: transaction.id,
      status: transaction.status 
    });

    // Verify seller has completed Stripe Connect onboarding
    const sellerProfile = transaction.profiles;
    if (!sellerProfile?.stripe_account_id || !sellerProfile?.stripe_onboarding_complete) {
      throw new Error("Seller has not completed payment setup. Please contact the seller.");
    }

    logStep("Seller verified", { 
      stripeAccountId: sellerProfile.stripe_account_id,
      onboardingComplete: sellerProfile.stripe_onboarding_complete
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Calculate amounts
    const protectionFee = buyerProtectionFee || (amount * 0.05); // 5% default
    const platformFee = Math.round(amount * 0.03 * 100); // 3% platform fee in pence
    const totalAmount = Math.round((parseFloat(amount) + protectionFee) * 100); // Convert to pence

    logStep("Calculated amounts", {
      itemPrice: amount,
      protectionFee,
      platformFee: platformFee / 100,
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
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create DESTINATION CHARGE (funds go to platform, no time limit!)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "gbp",
      customer: customerId,
      // NO capture_method - charge is captured immediately to platform
      application_fee_amount: platformFee,
      transfer_data: {
        // This links it to seller but doesn't transfer yet
        destination: sellerProfile.stripe_account_id,
      },
      metadata: {
        transaction_id: transactionId,
        listing_id: transaction.listing_id,
        seller_id: transaction.seller_id,
        buyer_id: user.id,
        item_amount: amount,
        protection_fee: protectionFee,
      },
      description: `Purchase: ${transaction.listings.title}`,
    });

    logStep("Destination charge created", {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      destination: sellerProfile.stripe_account_id
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
      logStep("Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    logStep("Transaction updated successfully");

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
