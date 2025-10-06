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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { targetUserId, reason, actionType } = await req.json();

    if (!targetUserId || !reason || !actionType) {
      throw new Error("Missing required fields: targetUserId, reason, actionType");
    }

    // Check for active transactions
    const { data: activeTransactions } = await supabaseClient
      .from("transactions")
      .select("id")
      .or(`buyer_id.eq.${targetUserId},seller_id.eq.${targetUserId}`)
      .in("status", ["pending", "paid", "dispatched"]);

    if (activeTransactions && activeTransactions.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Cannot remove user with active transactions. Please resolve all active transactions first.",
          activeTransactions: activeTransactions.length
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get admin profile for logging
    const { data: adminProfile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile) {
      throw new Error("Admin profile not found");
    }

    // Update user account status
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        account_status: actionType,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: adminProfile.id,
      })
      .eq("user_id", targetUserId);

    if (updateError) {
      throw updateError;
    }

    // Log admin action
    const { error: logError } = await supabaseClient
      .from("admin_actions")
      .insert({
        admin_id: adminProfile.id,
        target_user_id: targetUserId,
        action_type: actionType === "suspended" ? "suspend" : "delete",
        reason: reason,
        metadata: {
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          user_agent: req.headers.get("user-agent") || "unknown",
        },
      });

    if (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `User ${actionType === "suspended" ? "suspended" : "removed"} successfully`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in admin-remove-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});