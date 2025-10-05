import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { postId, sessionId, userAgent } = await req.json();

    if (!postId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: postId and sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from auth header (if present)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    // Insert view record with service role permissions
    const { error: insertError } = await supabase
      .from('blog_post_views')
      .insert({
        post_id: postId,
        session_id: sessionId,
        user_id: userId,
        user_agent: userAgent || null,
      });

    if (insertError) {
      console.error('Error inserting blog view:', insertError);
      throw insertError;
    }

    console.log(`Blog view recorded: post=${postId}, session=${sessionId}, user=${userId || 'anonymous'}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-blog-view:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});