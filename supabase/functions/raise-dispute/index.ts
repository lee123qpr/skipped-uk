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
    const { transactionId, reason, description, disputeType, evidence } = await req.json();
    
    console.log("[RAISE-DISPUTE] Request received", { transactionId, reason, disputeType });

    if (!transactionId || !reason) {
      throw new Error("Missing required fields: transactionId and reason");
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

    console.log("[RAISE-DISPUTE] User authenticated", { userId: user.id });

    // Get transaction and verify user is involved
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Check if transaction already has a dispute
    if (transaction.dispute_id || transaction.status.includes('disputed')) {
      throw new Error("A dispute has already been raised for this transaction");
    }

    // Determine if user is buyer or seller
    const isBuyer = transaction.buyer_id === user.id;
    const isSeller = transaction.seller_id === user.id;

    // Can only dispute if payment has been made but not completed
    if (!["paid", "dispatched", "delivered"].includes(transaction.status)) {
      throw new Error("Cannot dispute transaction in current status");
    }

    console.log("[RAISE-DISPUTE] Transaction verified", { 
      transactionId: transaction.id,
      userRole: isBuyer ? "buyer" : "seller"
    });

    // Create dispute record
    const { data: dispute, error: disputeError } = await supabaseClient
      .from("disputes")
      .insert({
        transaction_id: transactionId,
        listing_id: transaction.listing_id,
        raised_by_id: user.id,
        against_id: isBuyer ? transaction.seller_id : transaction.buyer_id,
        dispute_type: disputeType || (isBuyer ? "buyer_item_issue" : "seller_non_payment"),
        reason: reason,
        description: description,
        requested_amount: transaction.amount,
        status: "pending"
      })
      .select()
      .single();

    if (disputeError || !dispute) {
      console.error("[RAISE-DISPUTE] Failed to create dispute", disputeError);
      throw new Error("Failed to create dispute record");
    }

    console.log("[RAISE-DISPUTE] Dispute created", { disputeId: dispute.id });

    // Upload evidence if provided
    if (evidence && evidence.length > 0) {
      const evidenceRecords = evidence.map((item: any) => ({
        dispute_id: dispute.id,
        uploaded_by_id: user.id,
        evidence_type: item.type || "photo",
        file_url: item.url,
        description: item.description
      }));

      await supabaseClient
        .from("dispute_evidence")
        .insert(evidenceRecords);
    }

    // Update transaction status to disputed
    const { error: updateError } = await supabaseClient
      .from("transactions")
      .update({
        status: "disputed_pending_review",
        dispute_id: dispute.id,
        dispute_reason: reason,
        disputed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      console.error("[RAISE-DISPUTE] Failed to update transaction", updateError);
      throw new Error("Failed to update transaction");
    }

    // Create system messages for both parties
    await supabaseClient
      .from("messages")
      .insert([
        {
          sender_id: user.id,
          receiver_id: isBuyer ? transaction.seller_id : transaction.buyer_id,
          listing_id: transaction.listing_id,
          content: `Dispute raised: ${reason}. The dispute is under admin review.`,
          message_type: "system",
          read: false,
        },
      ]);

    console.log("[RAISE-DISPUTE] Dispute created successfully, awaiting admin review");

    return new Response(
      JSON.stringify({ 
        success: true, 
        disputeId: dispute.id,
        status: "pending",
        message: "Dispute submitted successfully. An admin will review it shortly."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[RAISE-DISPUTE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
