import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(`[webhook ${timestamp}] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
  const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

  let event: Stripe.Event;
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  try {
    if (!signature) throw new Error("Missing Stripe signature");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    logStep("ERROR verifying signature", { message: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("checkout.session.completed", { sessionId: session.id, payment_intent: session.payment_intent });

        // Retrieve PI to access metadata set during checkout
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        const md = paymentIntent.metadata || {} as Record<string, string>;

        const listing_id = md.listing_id;
        const buyer_id = md.buyer_id;
        const seller_id = md.seller_id;
        const delivery_method = md.delivery_method || "pickup";
        const offer_id = md.offer_id || null;

        if (!listing_id || !buyer_id || !seller_id) {
          logStep("ERROR missing metadata", { listing_id, buyer_id, seller_id });
          break;
        }

        // Idempotency: if transaction already exists, exit
        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();

        if (existingTx) {
          logStep("Transaction already exists", { transactionId: existingTx.id });
          break;
        }

        // Amounts from metadata are pence strings
        const itemAmountPence = parseInt(md.item_amount || "0");
        const buyerProtectionFeePence = parseInt(md.buyer_protection_fee || "0");
        const deliveryCostPence = parseInt(md.delivery_cost || "0");

        const itemAmountPounds = itemAmountPence / 100;
        const buyerProtectionFeePounds = buyerProtectionFeePence / 100;
        const deliveryCostPounds = deliveryCostPence / 100;
        const totalAmount = itemAmountPounds + buyerProtectionFeePounds + deliveryCostPounds;

        // Create transaction (service role bypasses RLS, acceptable for webhook)
        const { data: newTransaction, error: txError } = await supabase
          .from("transactions")
          .insert({
            listing_id,
            buyer_id,
            seller_id,
            offer_id,
            amount: itemAmountPounds,
            buyer_protection_fee: buyerProtectionFeePounds,
            delivery_cost: deliveryCostPounds,
            delivery_method,
            status: "paid",
            stripe_payment_intent_id: paymentIntent.id,
            paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (txError) {
          logStep("ERROR creating transaction", { message: txError.message });
          break;
        }

        // Mark listing unavailable (best-effort)
        await supabase.from("listings").update({ available: false }).eq("id", listing_id);

        // Minimal details for messages
        const { data: listing } = await supabase.from("listings").select("title").eq("id", listing_id).single();
        const { data: buyerProfile } = await supabase.from("profiles").select("display_name").eq("user_id", buyer_id).single();

        // Create system messages
        await supabase.from("messages").insert([
          {
            sender_id: seller_id,
            receiver_id: buyer_id,
            listing_id,
            transaction_id: newTransaction.id,
            content: `Payment received! Your payment of £${totalAmount.toFixed(2)} is securely held in escrow. The seller will now dispatch your item.`,
            message_type: "system",
            read: false,
          },
          {
            sender_id: buyer_id,
            receiver_id: seller_id,
            listing_id,
            transaction_id: newTransaction.id,
            content: `New order! ${buyerProfile?.display_name || "A buyer"} has paid £${totalAmount.toFixed(2)} for "${listing?.title || "your item"}". Please dispatch the item as soon as possible.`,
            message_type: "system",
            read: false,
          },
        ]);

        // Create notifications
        await supabase.from("notifications").insert([
          {
            user_id: buyer_id,
            type: "transaction",
            title: "Payment Successful",
            description: `Your payment of £${totalAmount.toFixed(2)} has been confirmed and is held securely.`,
            action_url: `/dashboard?tab=messages`,
            related_id: newTransaction.id,
            metadata: { listing_id, transaction_id: newTransaction.id },
          },
          {
            user_id: seller_id,
            type: "transaction",
            title: "New Order Received",
            description: `You received a new order for "${listing?.title || "your item"}" worth £${totalAmount.toFixed(2)}.`,
            action_url: `/dashboard?tab=messages`,
            related_id: newTransaction.id,
            metadata: { listing_id, transaction_id: newTransaction.id },
          },
        ]);

        logStep("Webhook processed successfully", { transactionId: newTransaction.id });
        break;
      }
      default:
        // Ignore other events for now
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    logStep("ERROR processing webhook", { message: (err as Error).message });
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
