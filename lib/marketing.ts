import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// ─── Aquafeel branding for emails ────────────────────────────────────────────
const EMAIL_STYLES = `
  <style>
    body { margin:0; padding:0; background:#f1f5f9; font-family:'Helvetica Neue',Arial,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#020d1a 0%,#0a1f35 100%); padding:40px 32px; text-align:center; }
    .header h1 { color:#ffffff; font-size:28px; font-weight:900; margin:0; letter-spacing:-0.5px; }
    .header p  { color:#7dd3fc; font-size:13px; margin:8px 0 0; text-transform:uppercase; letter-spacing:2px; }
    .body   { padding:32px; color:#334155; font-size:15px; line-height:1.7; }
    .cta    { display:block; margin:32px auto; padding:16px 36px; background:#0ea5e9; color:#ffffff !important;
              font-weight:900; font-size:14px; text-transform:uppercase; letter-spacing:1px;
              text-decoration:none; border-radius:12px; width:fit-content; }
    .footer { background:#020d1a; padding:24px 32px; text-align:center; }
    .footer p { color:#475569; font-size:11px; margin:4px 0; }
    .footer a { color:#7dd3fc; text-decoration:none; }
    h2 { color:#0c4a6e; font-size:20px; margin-top:24px; }
    ul { padding-left:20px; } li { margin-bottom:8px; }
    .badge { display:inline-block; background:#f0fdf4; color:#166534; font-weight:700; font-size:12px;
             padding:4px 10px; border-radius:999px; border:1px solid #bbf7d0; margin:2px; }
  </style>
`;

const emailWrapper = (content: string) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
${EMAIL_STYLES}</head>
<body>
  <div style="padding:20px;">
    <div class="wrapper">
      <div class="header">
        <h1>💧 Aquafeel Solutions</h1>
        <p>Pure Water. Better Life.</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>Aquafeel Solutions Tech · Philadelphia, PA</p>
        <p><a href="mailto:binnovationmarketing@gmail.com">binnovationmarketing@gmail.com</a> · <a href="tel:+12407806473">+1 (240) 780-6473</a></p>
        <p style="margin-top:12px;color:#1e293b">© 2026 Aquafeel Solutions Tech. All rights reserved.</p>
      </div>
    </div>
  </div>
</body></html>`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketingCampaignResult {
  success:   boolean;
  processed: number;
  failed:    number;
  type:      'NURTURE' | 'MAINTENANCE';
  logs:      string[];
}

// ─── Send via Supabase Edge Function ─────────────────────────────────────────
async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html },
    });

    if (error) {
      console.error('Edge function email error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('sendEmail error:', err);
    return false;
  }
}

// ─── MarketingService ─────────────────────────────────────────────────────────
export const MarketingService = {

  // 1. Generate AI content for campaigns
  async generateContent(type: 'NURTURE' | 'MAINTENANCE'): Promise<{ subject: string; body: string }> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = type === 'NURTURE'
        ? `Write a compelling monthly newsletter email for potential customers who haven't bought a water purification system yet.
           Company: Aquafeel Solutions Tech (whole-home water systems — Reverse Osmosis, Alkaline water — and organic soaps).
           Key points: 25-year warranty, less than $5/day, removes contaminants, 0 down payment.
           Tone: Professional, health-focused, warm urgency.
           Return ONLY valid JSON: {"subject":"...","body":"..."}
           The body should be an HTML snippet (no <html>/<body> tags, no inline <style>) to be placed inside a pre-styled email template.`
        : `Write a friendly monthly reminder email for existing Aquafeel customers.
           Goals: (1) Remind them to check salt levels for their water softener.
           (2) Encourage them to use their organic soaps (skin benefits, eco-friendly).
           (3) Mention free annual water analysis and how to schedule it.
           Tone: Helpful, warm, customer-success oriented.
           Return ONLY valid JSON: {"subject":"...","body":"..."}
           The body should be an HTML snippet (no <html>/<body> tags, no inline <style>).`;

      const result = await model.generateContent(prompt);
      const text   = result.response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    } catch (err) {
      console.error('AI generation error:', err);
      // Branded fallback content
      if (type === 'NURTURE') {
        return {
          subject: '💧 Is your tap water safe for your family?',
          body: `
            <h2>Your family deserves pure water.</h2>
            <p>Did you know that tap water in Pennsylvania contains up to <strong>12 regulated contaminants</strong> above safe limits?</p>
            <p>Aquafeel Solutions installs whole-home water purification systems starting at <strong>less than $5/day</strong> — with zero down payment and a 25-year warranty.</p>
            <ul>
              <li>✅ Reverse Osmosis + Alkaline filtration</li>
              <li>✅ $0 installation fee</li>
              <li>✅ First payment only in 2026</li>
              <li>✅ Free annual water quality analysis</li>
            </ul>
            <a class="cta" href="mailto:binnovationmarketing@gmail.com">Schedule Your Free Water Analysis</a>
          `,
        };
      } else {
        return {
          subject: '🧂 Time to check your salt tank + a gift for you!',
          body: `
            <h2>Keep your system running perfectly.</h2>
            <p>Hi there! Just a friendly reminder to <strong>check your salt tank</strong> this month — a full tank keeps your water softener performing at its best.</p>
            <h2>Your organic soaps are waiting 🌿</h2>
            <p>Don't forget the organic soap kit included with your system. It's formulated to work perfectly with your softened water — better lather, better skin, no harsh chemicals.</p>
            <p>Questions? We're always here.</p>
            <a class="cta" href="mailto:binnovationmarketing@gmail.com">Contact Your Aquafeel Team</a>
          `,
        };
      }
    }
  },

  // 2. Nurture campaign — targets leads who haven't purchased yet
  async runNurtureCampaign(): Promise<MarketingCampaignResult> {
    const logs: string[] = [];
    let processed = 0, failed = 0;

    const { data: leads, error } = await supabase
      .from('clients')
      .select('id, name, email')
      .in('status', ['LEAD', 'LOST', 'PRESENTATION', 'CONTACTED'])
      .not('email', 'is', null);

    if (error) throw error;

    const content = await this.generateContent('NURTURE');
    logs.push(`✓ AI generated subject: "${content.subject}"`);

    for (const lead of leads || []) {
      if (!lead.email) continue;

      const personalizedHtml = emailWrapper(
        `<p>Olá <strong>${lead.name}</strong>,</p>` + content.body
      );

      const ok = await sendEmail(lead.email, content.subject, personalizedHtml);
      if (ok) {
        logs.push(`✓ Sent to ${lead.name} <${lead.email}>`);
        processed++;
      } else {
        logs.push(`✗ Failed for ${lead.name} <${lead.email}>`);
        failed++;
      }
    }

    logs.push(`Campaign complete: ${processed} sent, ${failed} failed.`);
    return { success: failed === 0, processed, failed, type: 'NURTURE', logs };
  },

  // 3. Maintenance campaign — targets active customers
  async runMaintenanceCampaign(): Promise<MarketingCampaignResult> {
    const logs: string[] = [];
    let processed = 0, failed = 0;

    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, email, phone')
      .in('status', ['SALE', 'INSTALLED', 'ACTIVE', 'MAINTENANCE'])
      .not('email', 'is', null);

    if (error) throw error;

    const content = await this.generateContent('MAINTENANCE');
    logs.push(`✓ AI generated subject: "${content.subject}"`);

    for (const client of clients || []) {
      if (!client.email) continue;

      const personalizedHtml = emailWrapper(
        `<p>Hi <strong>${client.name}</strong>,</p>` + content.body
      );

      const ok = await sendEmail(client.email, content.subject, personalizedHtml);
      if (ok) {
        logs.push(`✓ Sent to ${client.name} <${client.email}>`);
        processed++;
      } else {
        logs.push(`✗ Failed for ${client.name} <${client.email}>`);
        failed++;
      }
    }

    logs.push(`Campaign complete: ${processed} sent, ${failed} failed.`);
    return { success: failed === 0, processed, failed, type: 'MAINTENANCE', logs };
  },

  // 4. Send a single transactional email (e.g. proposal notification to analyst)
  async sendTransactional(to: string, subject: string, bodyHtml: string): Promise<boolean> {
    return sendEmail(to, subject, emailWrapper(bodyHtml));
  },

  // 5. AI follow-up message draft (SMS / WhatsApp)
  async generateFollowUpMessage(
    clientName: string,
    clientStatus: string,
    objective: string
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `
        You are a friendly Aquafeel Solutions sales rep sending a WhatsApp/SMS follow-up.
        Client: ${clientName} | Status: ${clientStatus} | Objective: ${objective}
        Rules:
        - Max 3 short sentences. Warm and conversational.
        - No placeholders like [Your Name].
        - Language: Portuguese (BR) unless the context suggests English/Spanish.
        Write only the message text.
      `;
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch {
      return `Olá ${clientName}, tudo bem? Passando para falar sobre ${objective}. Quando podemos conversar rapidinho?`;
    }
  },

  // 6. Notify analyst when a client opens their proposal
  async notifyProposalOpened(analystEmail: string, clientName: string, clientId: string): Promise<void> {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aquafeel.app';
    await sendEmail(
      analystEmail,
      `🔔 ${clientName} abriu sua proposta agora!`,
      emailWrapper(`
        <h2>Ação necessária 👀</h2>
        <p>Seu lead <strong>${clientName}</strong> acabou de abrir a proposta exclusiva.</p>
        <p>Este é o melhor momento para um follow-up — o interesse está alto!</p>
        <p><strong>💡 Dica:</strong> Um contato em até 5 minutos aumenta a taxa de fechamento em até 400%.</p>
        <a class="cta" href="${appUrl}/dashboard/analyst">Ver detalhes no Dashboard</a>
      `)
    );
  },
};
