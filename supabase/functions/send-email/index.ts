// Supabase Edge Function — send-email
// Uses the official Resend SDK (npm:resend)
//
// Deploy:
//   supabase functions deploy send-email
//
// Set secret (one time):
//   supabase secrets set RESEND_API_KEY=re_YOUR_REAL_KEY_HERE

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend';

const FROM_NAME = 'Aquafeel Solutions Tech';

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

    const resend = new Resend(RESEND_API_KEY);

    const body: EmailPayload = await req.json();

    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ error: 'Missing fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recipients = Array.isArray(body.to) ? body.to : [body.to];

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
