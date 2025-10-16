import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-SELLER-FINANCIALS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user's Stripe account ID from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.stripe_account_id) {
      logStep("No Stripe account found");
      return new Response(JSON.stringify({ 
        error: "No Stripe account connected",
        hasStripeAccount: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeAccountId = profile.stripe_account_id;
    logStep("Stripe account found", { accountId: stripeAccountId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch Stripe balance
    const balance = await stripe.balance.retrieve({ stripeAccount: stripeAccountId });
    logStep("Stripe balance retrieved", { 
      available: balance.available[0]?.amount,
      pending: balance.pending[0]?.amount 
    });

    // Fetch recent balance transactions (last 90 days)
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60);
    const balanceTransactions = await stripe.balanceTransactions.list({
      stripeAccount: stripeAccountId,
      limit: 100,
      created: { gte: ninetyDaysAgo },
    });
    logStep("Balance transactions retrieved", { count: balanceTransactions.data.length });

    // Calculate funds in escrow from local database
    const { data: escrowTransactions, error: escrowError } = await supabaseClient
      .from("transactions")
      .select("amount, status, created_at, listing_id")
      .eq("seller_id", user.id)
      .in("status", ["paid", "dispatched", "delivered"]);

    if (escrowError) {
      logStep("Error fetching escrow transactions", { error: escrowError.message });
    }

    const escrowAmount = escrowTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    // Breakdown by status
    const escrowBreakdown = {
      paid: escrowTransactions?.filter(t => t.status === "paid").reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      dispatched: escrowTransactions?.filter(t => t.status === "dispatched").reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      delivered: escrowTransactions?.filter(t => t.status === "delivered").reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    };

    logStep("Escrow calculated", { total: escrowAmount, breakdown: escrowBreakdown });

    // Calculate this month's earnings
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: monthlyTransactions, error: monthlyError } = await supabaseClient
      .from("transactions")
      .select("amount")
      .eq("seller_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", firstDayOfMonth);

    const monthlyEarnings = monthlyTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    logStep("Monthly earnings calculated", { amount: monthlyEarnings });

    // Calculate total lifetime earnings
    const { data: lifetimeTransactions, error: lifetimeError } = await supabaseClient
      .from("transactions")
      .select("amount")
      .eq("seller_id", user.id)
      .eq("status", "completed");

    const lifetimeEarnings = lifetimeTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const transactionCount = lifetimeTransactions?.length || 0;
    logStep("Lifetime earnings calculated", { amount: lifetimeEarnings, count: transactionCount });

    // Format recent transactions for display
    const recentActivity = balanceTransactions.data.slice(0, 20).map(txn => ({
      id: txn.id,
      type: txn.type,
      amount: txn.amount / 100, // Convert from cents
      currency: txn.currency,
      created: new Date(txn.created * 1000).toISOString(),
      status: txn.status,
      description: txn.description,
      fee: txn.fee / 100,
      net: txn.net / 100,
    }));

    return new Response(JSON.stringify({
      hasStripeAccount: true,
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount / 100,
          currency: b.currency,
        })),
      },
      escrow: {
        total: escrowAmount,
        breakdown: escrowBreakdown,
        transactions: escrowTransactions?.length || 0,
      },
      earnings: {
        monthly: monthlyEarnings,
        lifetime: lifetimeEarnings,
        transactionCount,
      },
      recentActivity,
      lastUpdated: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-seller-financials", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
