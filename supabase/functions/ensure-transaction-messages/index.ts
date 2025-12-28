import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { validateUUID, ValidationException } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorisation header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authedClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const transactionId = validateUUID(body.transactionId, "transactionId");

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: transaction, error: transactionError } = await serviceClient
      .from("transactions")
      .select(
        `
        id,
        listing_id,
        buyer_id,
        seller_id,
        amount,
        buyer_protection_fee,
        delivery_cost,
        delivery_method,
        status,
        listings:listing_id (
          id,
          title
        )
      `,
      )
      .eq("id", transactionId)
      .single();

    if (transactionError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    if (userId !== transaction.buyer_id && userId !== transaction.seller_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { count: existingCount, error: existingError } = await serviceClient
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("transaction_id", transactionId);

    if (existingError) {
      return new Response(JSON.stringify({ error: existingError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((existingCount ?? 0) > 0) {
      return new Response(JSON.stringify({ success: true, created: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: buyerProfile } = await serviceClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", transaction.buyer_id)
      .single();

    const itemAmount = Number(transaction.amount ?? 0);
    const buyerProtectionFee = Number(transaction.buyer_protection_fee ?? 0);
    const deliveryCost = Number(transaction.delivery_cost ?? 0);
    const totalAmount = itemAmount + buyerProtectionFee + deliveryCost;

    const listingTitle = transaction.listings?.title || "your item";

    const { error: insertError } = await serviceClient.from("messages").insert([
      {
        sender_id: transaction.seller_id,
        receiver_id: transaction.buyer_id,
        listing_id: transaction.listing_id,
        transaction_id: transactionId,
        content: `Payment received! Your payment of £${totalAmount.toFixed(2)} is securely held in escrow. The seller will now dispatch your item.`,
        message_type: "system",
        read: false,
      },
      {
        sender_id: transaction.buyer_id,
        receiver_id: transaction.seller_id,
        listing_id: transaction.listing_id,
        transaction_id: transactionId,
        content: `New order! ${buyerProfile?.display_name || "A buyer"} has paid £${totalAmount.toFixed(2)} for "${listingTitle}". Please dispatch the item as soon as possible.`,
        message_type: "system",
        read: false,
      },
    ]);

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, created: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ValidationException) {
      return new Response(JSON.stringify({ error: "Validation failed", details: error.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
