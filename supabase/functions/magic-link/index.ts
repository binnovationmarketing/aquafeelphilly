// Supabase Edge Function — magic-link
// Looks up a client by phone number, generates a Supabase magic-link URL
// using the service_role key, and returns it so the frontend can send it
// via WhatsApp (wa.me deep-link).
//
// Deploy:
//   supabase functions deploy magic-link

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
