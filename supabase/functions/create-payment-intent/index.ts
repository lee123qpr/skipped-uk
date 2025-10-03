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
    const { transactionId, amount, buyerProtectionFee, returnUrl } = await req.json();
    
    logStep("Request received", { transactionId, amount, buyerProtectionFee, returnUrl });

    if (!transactionId || !amount) {
      throw new Error("Missing required fields: transactionId and amount");
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error("Transaction amount must be greater than zero");
    }

    const MAX_TRANSACTION = 100000; // £100,000 maximum
    if (amount > MAX_TRANSACTION) {
      throw new Error(`Transaction exceeds maximum allowed amount of £${MAX_TRANSACTION.toLocaleString()}`);
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

    // Get transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (txError) {
      logStep("Transaction query error", txError);
      throw new Error(`Database error: ${txError.message}`);
    }

    if (!transaction) {
      logStep("Transaction not found", { transactionId, buyerId: user.id });
      throw new Error("Transaction not found or you are not authorized to pay for this transaction");
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select("title, images, seller_id")
      .eq("id", transaction.listing_id)
      .single();

    if (listingError || !listing) {
      logStep("Listing not found", listingError);
      throw new Error("Listing not found");
    }

    // Get seller profile
    const { data: sellerProfile, error: sellerError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", transaction.seller_id)
      .single();

    if (sellerError || !sellerProfile) {
      logStep("Seller profile not found", sellerError);
      throw new Error("Seller profile not found");
    }

    logStep("Transaction found", { 
      transactionId: transaction.id,
      status: transaction.status,
      listingId: transaction.listing_id
    });

    // Verify seller has completed Stripe Connect onboarding
    if (!sellerProfile?.stripe_account_id || !sellerProfile?.stripe_onboarding_complete) {
      throw new Error("Seller has not completed payment setup. Please contact the seller.");
    }

    logStep("Seller verified", { 
      stripeAccountId: sellerProfile.stripe_account_id,
      onboardingComplete: sellerProfile.stripe_onboarding_complete
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Calculate amounts with proper decimal handling
    const protectionFee = buyerProtectionFee || (amount * 0.05); // 5% default
    const itemAmount = Math.round(Number(amount.toFixed(2)) * 100); // Item amount in pence
    const protectionFeeAmount = Math.round(Number(protectionFee.toFixed(2)) * 100); // Protection fee in pence
    const platformFee = Math.round(Number((amount * 0.03).toFixed(2)) * 100); // 3% platform fee in pence
    const totalAmount = itemAmount + protectionFeeAmount; // Total in pence

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

    // Create Stripe Checkout Session
    const origin = (returnUrl && typeof returnUrl === 'string') ? returnUrl : (req.headers.get("origin") || Deno.env.get("SUPABASE_URL"));
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: listing.title,
              images: listing.images?.slice(0, 1) || [],
              description: `Purchase of ${listing.title}`,
            },
            unit_amount: itemAmount,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Buyer Protection",
              description: "5% buyer protection fee",
            },
            unit_amount: protectionFeeAmount,
          },
          quantity: 1,
        }
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
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
        description: `Purchase: ${listing.title}`,
      },
      success_url: `${origin}/dashboard?tab=messages&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?tab=messages&payment=cancelled`,
      metadata: {
        transaction_id: transactionId,
      }
    });

    logStep("Checkout session created", {
      sessionId: session.id,
      checkoutUrl: session.url
    });

    // Update transaction with pending payment status
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        stripe_payment_intent_id: session.payment_intent as string,
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
        checkoutUrl: session.url,
        sessionId: session.id,
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
