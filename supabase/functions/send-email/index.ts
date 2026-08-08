// Supabase Edge Function — send-email
// Uses the official Resend SDK (npm:resend)
//
// Public lead-capture pages (RecruitingPage, InviteLandingPage) call this
// without a user session, so we can't require auth outright. Instead:
//   - Authenticated callers (valid Supabase session) are always allowed.
//   - Anonymous callers are only allowed from the site's own origin, and
//     are capped on recipient count / payload size to limit abuse if the
//     endpoint is hit directly instead of through the app.
// Origin checking stops casual/scripted abuse but can be spoofed by a
// non-browser client that sets its own headers — it is not a substitute
// for auth. If this needs to be fully hardened later, add a CAPTCHA
// (e.g. Turnstile) on the public forms.
//
// Deploy:
//   supabase functions deploy send-email
//
// Set secrets (one time):
//   supabase secrets set RESEND_API_KEY=re_YOUR_REAL_KEY_HERE
//   supabase secrets set ALLOWED_ORIGINS=https://aquafeelphilly.com,http://localhost:5173

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend';

const FROM_NAME = 'Aquos Tech';
const MAX_RECIPIENTS = 5;
const MAX_SUBJECT_LEN = 300;
const MAX_HTML_LEN = 50000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to:       string | string[];
  subject:  string;
  html:     string;
  from?:    string;
  replyTo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in Edge Function secrets.');
    }

    // Allow either an authenticated caller or a request from our own origin.
    const authHeader = req.headers.get('Authorization');
    let isAuthenticated = false;
    if (authHeader) {
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
      const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
      const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await callerClient.auth.getUser();
      isAuthenticated = !!user;
    }

    if (!isAuthenticated) {
      const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://aquafeelphilly.com')
        .split(',').map((o) => o.trim());
      const origin = req.headers.get('Origin') || '';
      if (!allowedOrigins.includes(origin)) {
        return new Response(JSON.stringify({ error: 'Forbidden.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const resend = new Resend(RESEND_API_KEY);

    const body: EmailPayload = await req.json();

    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ error: 'Missing fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.subject.length > MAX_SUBJECT_LEN || body.html.length > MAX_HTML_LEN) {
      return new Response(
        JSON.stringify({ error: 'subject or html exceeds allowed length.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipients = Array.isArray(body.to) ? body.to : [body.to];

    if (recipients.length > MAX_RECIPIENTS || recipients.some((r) => !EMAIL_RE.test(r))) {
      return new Response(
        JSON.stringify({ error: 'Invalid or too many recipients.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data, error } = await resend.emails.send({
      from:     body.from    || `${FROM_NAME} <${FROM_EMAIL}>`,
      to:       recipients,
      subject:  body.subject,
      html:     body.html,
      reply_to: body.replyTo || FROM_EMAIL,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({ success: true, id: data?.id, recipients: recipients.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('send-email function error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
