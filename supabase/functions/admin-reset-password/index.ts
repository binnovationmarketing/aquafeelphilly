// Supabase Edge Function — admin-reset-password
// Allows the designated admin to set a new password for any user.
// Caller must be authenticated as the admin email.
//
// Deploy:
//   supabase functions deploy admin-reset-password
//
// Secrets needed:
//   SUPABASE_URL           (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  (add via supabase secrets set)
//   ADMIN_EMAIL            (add via supabase secrets set ADMIN_EMAIL=binnovationmarketing@gmail.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ADMIN_EMAIL  = Deno.env.get('ADMIN_EMAIL') || 'binnovationmarketing@gmail.com';

    if (!SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'Service role key not configured.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use anon client to verify the caller's JWT
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const callerClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();

    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid session.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verify caller is the designated admin
    if (caller.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Forbidden — admin only.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Parse request body
    const { userId, newPassword } = await req.json();
    if (!userId || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'userId and newPassword (min 6 chars) required.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Use service role to update the user's password
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateErr) {
      console.error('admin updateUserById error:', updateErr);
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('admin-reset-password error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
