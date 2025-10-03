import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    
    console.log("[CONFIRM-DISPATCH] Request received", { transactionId });

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

    console.log("[CONFIRM-DISPATCH] User authenticated", { userId: user.id });

    // Get transaction and verify user is the seller
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("seller_id", user.id)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or unauthorized");
    }

    if (transaction.status !== "paid") {
      throw new Error("Transaction must be paid before confirming dispatch");
    }

    console.log("[CONFIRM-DISPATCH] Transaction verified", { 
      transactionId: transaction.id,
      currentStatus: transaction.status 
    });

    // Update transaction status to dispatched
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "dispatched",
        dispatch_confirmed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[CONFIRM-DISPATCH] Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    // Create system messages for both buyer and seller
    await supabaseClient
      .from("messages")
      .insert([
        {
          sender_id: transaction.seller_id,
          receiver_id: transaction.buyer_id,
          listing_id: transaction.listing_id,
          transaction_id: transactionId,
          content: "📦 Item dispatched! Your order has been sent and is on its way. Please confirm receipt when it arrives.",
          message_type: "system",
          read: false,
        },
        {
          sender_id: transaction.seller_id,
          receiver_id: transaction.seller_id,
          listing_id: transaction.listing_id,
          transaction_id: transactionId,
          content: "✅ You've marked the item as dispatched. The buyer will be notified to confirm receipt. Funds will be released once they confirm delivery.",
          message_type: "system",
          read: false,
        }
      ]);

    console.log("[CONFIRM-DISPATCH] Dispatch confirmed successfully");

    return new Response(
      JSON.stringify({ success: true, status: "dispatched" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[CONFIRM-DISPATCH] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
