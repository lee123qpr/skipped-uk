import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { 
  validateUUID, 
  validateAmount, 
  validateURL, 
  validateEnum,
  validateOptional,
  ValidationException 
} from "../_shared/validation.ts";

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
    logStep("Starting create-payment-intent");

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
    
    const listingId = validateUUID(body.listingId, 'listingId');
    const amount = validateAmount(body.amount, 'amount');
    const buyerProtectionFee = validateOptional(body.buyerProtectionFee, (v) => validateAmount(v, 'buyerProtectionFee')) ?? 0;
    const deliveryMethod = validateEnum(body.deliveryMethod ?? 'collection', 'deliveryMethod', ['collection', 'delivery']);
    const deliveryCost = validateOptional(body.deliveryCost, (v) => validateAmount(v, 'deliveryCost')) ?? 0;
    const offerId = validateOptional(body.offerId, (v) => validateUUID(v, 'offerId'));
    const returnUrl = validateURL(body.returnUrl, 'returnUrl');

    logStep("Request validated", { listingId, amount, buyerProtectionFee, deliveryMethod, deliveryCost, offerId });

    // Fetch listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('*, seller:profiles!seller_id(*)')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found');
    }
    logStep("Listing fetched", { listingId: listing.id, sellerId: listing.seller_id });

    // Check if listing has active transaction
    const { data: activeTransactions } = await supabaseClient
      .from('transactions')
      .select('id, status')
      .eq('listing_id', listingId)
      .in('status', ['paid', 'dispatched', 'delivered', 'completed']);

    if (activeTransactions && activeTransactions.length > 0) {
      throw new Error('This listing already has an active transaction');
    }

    // Check if seller has completed Stripe onboarding
    if (!listing.seller?.stripe_account_id || !listing.seller?.stripe_onboarding_complete) {
      throw new Error('Seller has not completed payment setup. Please contact the seller.');
    }
    logStep("Seller verified", { stripeAccountId: listing.seller.stripe_account_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Calculate amounts in pence
    const itemAmountPence = Math.round(amount * 100);
    const buyerProtectionFeePence = Math.round(buyerProtectionFee * 100);
    const deliveryCostPence = Math.round(deliveryCost * 100);
    const totalAmount = itemAmountPence + buyerProtectionFeePence + deliveryCostPence;

    // Platform fee (5% of item amount + full buyer protection fee)
    const platformFeeAmount = Math.round(itemAmountPence * 0.05) + buyerProtectionFeePence;
    logStep("Amounts calculated", { 
      itemAmountPence, 
      buyerProtectionFeePence, 
      deliveryCostPence,
      totalAmount,
      platformFeeAmount 
    });

    // Get or create Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({
      email: user.email!,
      limit: 1
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id
        }
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session with metadata containing all transaction details
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: listing.title,
              description: `Purchase from ${listing.seller.display_name || 'Seller'}`,
              images: listing.images?.[0] ? [listing.images[0]] : undefined,
            },
            unit_amount: itemAmountPence,
          },
          quantity: 1,
        },
        ...(buyerProtectionFeePence > 0 ? [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'Buyer Protection (5%)',
              description: 'Secure payment processing and dispute resolution',
            },
            unit_amount: buyerProtectionFeePence,
          },
          quantity: 1,
        }] : []),
        ...(deliveryCostPence > 0 ? [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: deliveryMethod === 'collection' ? 'Collection' : 'Delivery Service',
              description: deliveryMethod === 'collection' ? 'Collection from seller' : `Delivery to your location`,
            },
            unit_amount: deliveryCostPence,
          },
          quantity: 1,
        }] : []),
      ],
      mode: 'payment',
      success_url: `${returnUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?payment=cancelled`,
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: listing.seller.stripe_account_id,
        },
        metadata: {
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          item_amount: itemAmountPence.toString(),
          buyer_protection_fee: buyerProtectionFeePence.toString(),
          delivery_cost: deliveryCostPence.toString(),
          delivery_method: deliveryMethod,
          offer_id: offerId || '',
        },
      },
      metadata: {
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        offer_id: offerId || '',
      },
    });

    logStep("Checkout session created", { sessionId: session.id, sessionUrl: session.url });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        sessionUrl: session.url
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
