import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { password, reason } = await req.json();

    // Verify password
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: 'Invalid password. Please verify your password to proceed.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for active transactions
    const { data: activeTransactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('buyer_id', user.id)
      .in('status', ['pending', 'paid', 'dispatched', 'delivered']);

    if (txError) {
      console.error('Error checking transactions:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to check for active transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (activeTransactions && activeTransactions.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete account with active transactions. Please complete or cancel all transactions first.',
          activeTransactions: activeTransactions.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for pending disputes
    const { data: pendingDisputes, error: disputeError } = await supabaseClient
      .from('disputes')
      .select('id')
      .or(`raised_by_id.eq.${user.id},against_id.eq.${user.id}`)
      .eq('status', 'pending');

    if (disputeError) {
      console.error('Error checking disputes:', disputeError);
      return new Response(
        JSON.stringify({ error: 'Failed to check for pending disputes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pendingDisputes && pendingDisputes.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Cannot delete account with pending disputes. Please resolve all disputes first.',
          pendingDisputes: pendingDisputes.length
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create deletion request (30-day grace period)
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + 30);

    const { error: requestError } = await supabaseClient
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        reason: reason || null,
        scheduled_deletion_at: scheduledDeletionDate.toISOString(),
        status: 'pending',
      });

    if (requestError) {
      console.error('Error creating deletion request:', requestError);
      return new Response(
        JSON.stringify({ error: 'Failed to create deletion request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the deletion request
    console.log(`Account deletion requested for user ${user.id}, scheduled for ${scheduledDeletionDate.toISOString()}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account deletion scheduled successfully',
        scheduledDate: scheduledDeletionDate.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in request-account-deletion function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
