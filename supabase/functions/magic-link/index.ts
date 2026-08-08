// Supabase Edge Function — magic-link
// Looks up a client by phone number, generates a Supabase magic-link URL
// using the service_role key, and returns it so the frontend can send it
// via WhatsApp (wa.me deep-link).
//
// Caller must be authenticated as the admin email (same pattern as
// admin-reset-password) — this mints an authenticated login link for an
// arbitrary client, so it must never be reachable anonymously.
//
// Deploy:
//   supabase functions deploy magic-link
//
// Secrets needed:
//   SUPABASE_URL               (auto-injected by Supabase)
//   SUPABASE_ANON_KEY          (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY  (add via supabase secrets set)
//   ADMIN_EMAIL                (add via supabase secrets set ADMIN_EMAIL=binnovationmarketing@gmail.com)

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
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'binnovationmarketing@gmail.com';

    // 1. Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
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

    const { phone, redirectTo } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize to E.164 (+1XXXXXXXXXX)
    const digits = String(phone).replace(/\D/g, '');
    const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Look up client email by phone
    const { data: client, error: lookupError } = await supabase
      .from('clients')
      .select('email, name')
      .eq('phone', normalized)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!client?.email) {
      return new Response(
        JSON.stringify({ error: 'not_found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate magic link via admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: client.email,
      options: {
        redirectTo: redirectTo || 'https://aquafeelphilly.com/portal/client',
      },
    });

    if (linkError) throw linkError;

    return new Response(
      JSON.stringify({
        link: linkData.properties.action_link,
        email: client.email,
        name: client.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('magic-link error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
