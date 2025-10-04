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
    const { disputeId, resolutionType, approvedAmount, adminNotes, returnRequired } = await req.json();
    
    console.log("[ADMIN-RESOLVE-DISPUTE] Request received", { 
      disputeId, 
      resolutionType, 
      approvedAmount 
    });

    if (!disputeId || !resolutionType) {
      throw new Error("Missing required fields: disputeId and resolutionType");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    // Verify admin role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      throw new Error("Unauthorized: Admin access required");
    }

    console.log("[ADMIN-RESOLVE-DISPUTE] Admin authenticated", { adminId: user.id });

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabaseClient
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    if (disputeError || !dispute) {
      console.error("[ADMIN-RESOLVE-DISPUTE] Dispute fetch error", disputeError);
      throw new Error("Dispute not found");
    }

    // Get associated transaction
    const { data: transaction, error: txError } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("id", dispute.transaction_id)
      .single();

    if (txError || !transaction) {
      console.error("[ADMIN-RESOLVE-DISPUTE] Transaction fetch error", txError);
      throw new Error("Transaction not found");
    }

    console.log("[ADMIN-RESOLVE-DISPUTE] Dispute found", { 
      disputeId: dispute.id,
      transactionId: transaction.id,
      currentStatus: dispute.status
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    let refundId = null;
    let newTransactionStatus = "completed";

    // Process refund based on resolution type
    if (resolutionType === "full_refund") {
      if (!transaction.stripe_payment_intent_id) {
        throw new Error("No payment intent found for this transaction");
      }

      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripe_payment_intent_id,
        reason: "requested_by_customer",
        metadata: {
          dispute_id: disputeId,
          transaction_id: transaction.id,
          admin_id: user.id,
        },
      });

      refundId = refund.id;
      newTransactionStatus = "refunded";

      console.log("[ADMIN-RESOLVE-DISPUTE] Full refund processed", { refundId });

      // Make listing available again
      await supabaseClient
        .from("listings")
        .update({ status: "active", available: true })
        .eq("id", transaction.listing_id);

    } else if (resolutionType === "partial_refund") {
      if (!transaction.stripe_payment_intent_id) {
        throw new Error("No payment intent found for this transaction");
      }

      if (!approvedAmount || approvedAmount <= 0) {
        throw new Error("Invalid partial refund amount");
      }

      // Validate refund amount against transaction amount
      if (approvedAmount > transaction.amount) {
        throw new Error(`Refund amount £${approvedAmount} cannot exceed transaction amount £${transaction.amount}`);
      }

      // Validate against maximum threshold
      const MAX_REFUND = 50000; // £50,000 maximum
      if (approvedAmount > MAX_REFUND) {
        throw new Error(`Refund exceeds maximum allowed amount of £${MAX_REFUND.toLocaleString()}`);
      }

      // Use proper decimal handling for currency
      const refundAmount = Math.round(Number(approvedAmount.toFixed(2)) * 100); // Convert to pence

      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripe_payment_intent_id,
        amount: refundAmount,
        reason: "requested_by_customer",
        metadata: {
          dispute_id: disputeId,
          transaction_id: transaction.id,
          admin_id: user.id,
        },
      });

      refundId = refund.id;
      newTransactionStatus = "disputed_resolved";

      console.log("[ADMIN-RESOLVE-DISPUTE] Partial refund processed", { 
        refundId, 
        amount: approvedAmount 
      });

    } else if (resolutionType === "return_required") {
      // Mark transaction as requiring return
      await supabaseClient
        .from("transactions")
        .update({
          return_requested_at: new Date().toISOString(),
          return_notes: adminNotes
        })
        .eq("id", transaction.id);

      newTransactionStatus = "disputed_under_review";

      console.log("[ADMIN-RESOLVE-DISPUTE] Return required, awaiting confirmation");

    } else if (resolutionType === "no_refund") {
      newTransactionStatus = "completed";

      console.log("[ADMIN-RESOLVE-DISPUTE] No refund - dispute denied");
    }

    // Update dispute record
    const { error: updateDisputeError } = await supabaseClient
      .from("disputes")
      .update({
        status: resolutionType === "return_required" ? "under_review" : "resolved",
        resolution_type: resolutionType,
        approved_amount: approvedAmount || null,
        admin_notes: adminNotes,
        admin_id: user.id,
        resolved_at: resolutionType === "return_required" ? null : new Date().toISOString(),
      })
      .eq("id", disputeId);

    if (updateDisputeError) {
      console.error("[ADMIN-RESOLVE-DISPUTE] Failed to update dispute", updateDisputeError);
      throw new Error("Failed to update dispute");
    }

    // Update transaction status
    const updateData: any = {
      status: newTransactionStatus,
    };

    if (resolutionType === "full_refund" || resolutionType === "partial_refund") {
      updateData.refunded_at = new Date().toISOString();
    }

    const { error: updateTxError } = await supabaseClient
      .from("transactions")
      .update(updateData)
      .eq("id", transaction.id);

    if (updateTxError) {
      console.error("[ADMIN-RESOLVE-DISPUTE] Failed to update transaction", updateTxError);
      throw new Error("Failed to update transaction");
    }

    // Create system messages for both parties
    let messageContent = "";
    if (resolutionType === "full_refund") {
      messageContent = "Dispute resolved: Full refund approved by admin.";
    } else if (resolutionType === "partial_refund") {
      messageContent = `Dispute resolved: Partial refund of £${approvedAmount} approved by admin.`;
    } else if (resolutionType === "return_required") {
      messageContent = "Dispute under review: Return of item required before refund.";
    } else {
      messageContent = "Dispute resolved: No refund approved by admin.";
    }

    await supabaseClient
      .from("messages")
      .insert([
        {
          sender_id: transaction.seller_id,
          receiver_id: transaction.buyer_id,
          listing_id: transaction.listing_id,
          transaction_id: transaction.id,
          content: messageContent,
          message_type: "system",
          read: false,
        },
        {
          sender_id: transaction.buyer_id,
          receiver_id: transaction.seller_id,
          listing_id: transaction.listing_id,
          transaction_id: transaction.id,
          content: messageContent,
          message_type: "system",
          read: false,
        },
      ]);

    console.log("[ADMIN-RESOLVE-DISPUTE] Dispute resolved successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        disputeId,
        resolutionType,
        refundId,
        status: newTransactionStatus,
        message: "Dispute resolved successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[ADMIN-RESOLVE-DISPUTE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});