import { supabase } from './supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// Note: In a real app, ensure GEMINI_API_KEY is in .env
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE');

interface MarketingCampaignResult {
  success: boolean;
  processed: number;
  type: 'NURTURE' | 'MAINTENANCE';
  logs: string[];
}

export const MarketingService = {
  // 1. Generate Content using AI
  async generateContent(type: 'NURTURE' | 'MAINTENANCE'): Promise<{ subject: string; body: string }> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let prompt = "";
      if (type === 'NURTURE') {
        prompt = `
          Write a short, persuasive monthly newsletter email for potential customers who haven't bought a water purification system yet.
          Context: Aquafeel Solutions Tech sells whole-home water systems (Reverse Osmosis, Alkaline water) and organic soaps.
          Key Selling Points: 25-year warranty, costs less than $5/day, health benefits, removing contaminants.
          Tone: Professional, educational, slightly urgent regarding water quality, but friendly.
          Structure: JSON format with "subject" and "body" fields. The body should be HTML.
          Focus: Mention a generic recent concern about water quality in the US to grab attention.
        `;
      } else {
        prompt = `
          Write a short, friendly monthly reminder email for existing Aquafeel customers.
          Goal: Remind them to check their salt levels for the water softener.
          Secondary Goal: Remind them of the benefits of using their organic soaps (better for skin, eco-friendly).
          Tone: Helpful, customer-success oriented.
          Structure: JSON format with "subject" and "body" fields. The body should be HTML.
        `;
      }

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Clean up markdown code blocks if present
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonString);

    } catch (error) {
      console.error("AI Generation Error", error);
      // Fallback content if AI fails or key is missing
      if (type === 'NURTURE') {
        return {
          subject: "Is your tap water safe? 💧",
          body: "<p>Did you know water quality changes frequently? Protect your family with Aquafeel for less than $5/day.</p>"
        };
      } else {
        return {
          subject: "Time to check your salt! 🧂",
          body: "<p>Keep your system running smoothly. Check your salt tank today!</p>"
        };
      }
    }
  },

  // 2. Run Nurture Campaign (For Leads/Lost)
  async runNurtureCampaign(): Promise<MarketingCampaignResult> {
    const logs: string[] = [];

    // Fetch leads who haven't bought (LOST, LEAD, PRESENTATION)
    const { data: leads, error } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['LEAD', 'LOST', 'PRESENTATION', 'CONTACTED']);

    if (error) throw error;

    const content = await this.generateContent('NURTURE');
    logs.push(`Generated Content Subject: ${content.subject}`);

    let processed = 0;
    for (const lead of leads || []) {
      if (lead.email) {
        // Simulate sending email
        // In production: await sendEmail(lead.email, content.subject, content.body);
        logs.push(`[SIMULATION] Sending Nurture Email to: ${lead.email} (${lead.name})`);
        processed++;
      }
    }

    return { success: true, processed, type: 'NURTURE', logs };
  },

  // 3. Run Maintenance Campaign (For Customers)
  async runMaintenanceCampaign(): Promise<MarketingCampaignResult> {
    const logs: string[] = [];

    // Fetch active customers
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['SALE', 'INSTALLED', 'ACTIVE', 'MAINTENANCE']);

    if (error) throw error;

    const content = await this.generateContent('MAINTENANCE');
    logs.push(`Generated Content Subject: ${content.subject}`);

    let processed = 0;
    for (const client of clients || []) {
      if (client.email) {
        // Simulate sending email/whatsapp
        // In production: await sendWhatsapp(client.phone, content.body);
        logs.push(`[SIMULATION] Sending Maintenance Reminder to: ${client.email} (${client.name})`);
        processed++;
      }
    }

    return { success: true, processed, type: 'MAINTENANCE', logs };
  },

  // 4. Generate AI Draft for a specific follow-up task
  async generateFollowUpMessage(
    clientName: string,
    clientStatus: string,
    objective: string
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are a friendly, professional door-to-door sales representative for Aquafeel Solutions Tech.
        You need to send a short follow-up message (SMS or WhatsApp format) to a client.
        
        Client Name: ${clientName}
        Current Status: ${clientStatus}
        Objective / Context: ${objective}
        
        Guidelines:
        - Keep it very short and conversational (max 3 sentences).
        - Don't be overly salesy, be helpful and address their specific context.
        - Start with a warm greeting.
        - Do NOT include placeholders like [Your Name]. Just write the message itself.
        - If the objective mentions a specific date or event (like a bonus in December), mention it naturally.
        - Language: Should be in the language implied by the context, or Portuguese by default if unclear (since the user base is BR).
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      return text;
    } catch (error) {
      console.error("AI Follow-up Generation Error", error);
      return `Olá ${clientName}, tudo bem? Estou entrando em contato sobre ${objective}. Quando podemos conversar rapidamente?`;
    }
  }
};
