import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, MapPin, Mail, Loader2, Gift, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
  onSuccess: () => void;
}

function buildInviteEmailHtml(referrerName: string, friendName: string, inviteLink: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Convite Aquafeel</title></head>
<body style="margin:0;padding:0;background:#020d1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020d1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a1929;border-radius:20px;overflow:hidden;border:1px solid rgba(0,200,220,0.15);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#06b6d4,#2563eb);padding:36px 40px;text-align:center;">
          <p style="margin:0;color:#e0f7fa;font-size:12px;font-weight:900;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">💧 AQUAFEEL PHILLY</p>
          <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:900;letter-spacing:-0.5px;line-height:1.2;">Você foi indicado(a)<br>por um amigo!</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 20px;">Olá, <strong style="color:#e2e8f0;">${friendName}</strong>! 👋</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
            <strong style="color:#22d3ee;">${referrerName}</strong> te convidou para uma <strong style="color:#e2e8f0;">análise gratuita da qualidade da sua água</strong> com a Aquafeel Philly.
          </p>
          <!-- Benefit box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:14px;margin-bottom:28px;">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 14px;color:#22d3ee;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">O que você ganha:</p>
              ${[
                '✅ Análise gratuita da qualidade da água',
                '💧 Sistema de purificação RO — água 100% pura',
                '🧼 Sabonete orgânico por 25 anos incluso',
                '🛡️ Garantia total na instalação',
                '🎁 3 meses grátis ao fechar contrato',
              ].map(b => `<p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;">${b}</p>`).join('')}
            </td></tr>
          </table>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:28px;">
            <a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,#06b6d4,#2563eb);color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;letter-spacing:1px;padding:16px 40px;border-radius:50px;text-transform:uppercase;">
              💧 Quero Água Pura Grátis
            </a>
          </td></tr></table>
          <p style="color:#475569;font-size:12px;text-align:center;margin:0;">Ou acesse: <a href="${inviteLink}" style="color:#22d3ee;text-decoration:none;">${inviteLink}</a></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:rgba(6,182,212,0.06);border-top:1px solid rgba(6,182,212,0.1);padding:24px 40px;text-align:center;">
          <p style="margin:0;color:#475569;font-size:11px;">© 2025 Aquafeel Philly · Philadelphia, PA</p>
          <p style="margin:6px 0 0;color:#334155;font-size:11px;">Você recebeu este email porque <strong style="color:#475569;">${referrerName}</strong> te indicou.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ClientReferralTab({ portalData, onSuccess }: Props) {
  const { points } = portalData;
  const clientName: string = portalData.client?.name || 'Seu amigo';
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lastReferral, setLastReferral] = useState<{ email: string; name: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const shortLink = points.referral_slug
    ? `${window.location.origin}/i/${points.referral_slug}`
    : `${window.location.origin}/invite?ref=${points.referral_token}`;

  const waShareLink = `https://wa.me/?text=${encodeURIComponent(`💧 Eu uso Aquafeel e a água da minha família ficou 100% pura! Quero te indicar para uma análise gratuita. Acesse: ${shortLink}`)}`;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm({ ...form, phone: digits ? `+1${digits}` : '' });
  };

  const phoneDisplay = form.phone.replace(/^\+1/, '');

  const handleSendEmail = async () => {
    if (!lastReferral) return;
    setSendingEmail(true);
    try {
      const html = buildInviteEmailHtml(clientName, lastReferral.name, shortLink);
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: lastReferral.email,
          subject: `${clientName} quer te dar um presente! 💧`,
          html,
        },
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success('Email de convite enviado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email. Tente novamente.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Nome e telefone são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      if (!points.referral_token) {
        toast.error('Token de indicação não encontrado. Por favor, faça login novamente.');
        return;
      }

      const { data, error } = await supabase.rpc('add_referral_from_portal', {
        p_token: points.referral_token,
        p_name: form.name,
        p_phone: form.phone,
        p_email: form.email,
        p_address: form.address,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('🎉 Indicação cadastrada! +300 pontos adicionados à sua conta!');
      if (form.email) {
        setLastReferral({ email: form.email, name: form.name });
        setEmailSent(false);
      }
      setForm({ name: '', phone: '', email: '', address: '' });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar indicação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Points preview banner */}
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seus pontos atuais</p>
          <p className="text-3xl font-black text-cyan-400">{points.points.toLocaleString()} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Você ganhará</p>
          <p className="text-3xl font-black text-emerald-400">+300 pts</p>
          <p className="text-[10px] text-slate-600 mt-0.5">ao cadastrar esta indicação</p>
        </div>
      </MotionDiv>

      {/* WhatsApp share card */}
      {points.referral_token && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-5 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#25D366] mb-0.5">Compartilhe via WhatsApp</p>
            <p className="text-slate-400 text-xs">Envie seu link de convite diretamente!</p>
          </div>
          <a
            href={waShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl font-black text-sm shrink-0 hover:bg-[#1ebe5d] transition-colors"
          >
            <MessageCircle size={16} /> Compartilhar
          </a>
        </MotionDiv>
      )}

      {/* Email invite card — appears after successful referral with email */}
      <AnimatePresence>
        {lastReferral && (
          <MotionDiv
            key="email-invite"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.05 }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Enviar convite por email</p>
              <p className="text-slate-300 text-sm font-bold truncate">{lastReferral.name}</p>
              <p className="text-slate-500 text-xs truncate">{lastReferral.email}</p>
            </div>
            {emailSent ? (
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm shrink-0">
                <CheckCircle2 size={18} /> Enviado!
              </div>
            ) : (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-black text-sm shrink-0 transition-colors disabled:opacity-50"
              >
                {sendingEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Enviar Email
              </button>
            )}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Form */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
      >
        <h2 className="text-xl font-black text-white mb-2">Cadastrar Nova Indicação</h2>
        <p className="text-slate-500 text-sm mb-6">Preencha os dados da família ou amigo que você quer indicar. Nosso consultor entrará em contato com eles!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <User size={17} />
            </div>
            <input
              required
              type="text"
              placeholder="Nome completo da família *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Phone */}
          <div className="relative group flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500 transition-all overflow-hidden">
            <div className="pl-4 pr-2 flex items-center gap-1.5 text-slate-400 shrink-0">
              <Phone size={15} />
              <span className="font-bold text-sm text-slate-300">+1</span>
            </div>
            <input
              required
              type="tel"
              placeholder="215-555-0000"
              value={phoneDisplay}
              onChange={handlePhoneChange}
              className="flex-1 bg-transparent pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none text-sm"
            />
          </div>

          {/* Email (optional) */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Mail size={17} />
            </div>
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Address */}
          <div className="relative group">
            <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <MapPin size={17} />
            </div>
            <textarea
              placeholder="Endereço residencial (opcional)"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.2)] hover:shadow-[0_0_40px_rgba(0,200,200,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Gift size={18} />
                Enviar Indicação (+300 Pontos)
              </>
            )}
          </button>
        </form>
      </MotionDiv>

      {/* Info box */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/3 border border-white/5 rounded-2xl p-5 space-y-3"
      >
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Como funciona:</p>
        {[
          { emoji: '1️⃣', text: 'Você indica uma família com nome e telefone.' },
          { emoji: '2️⃣', text: 'Nosso consultor entra em contato e agenda uma análise de água gratuita.' },
          { emoji: '3️⃣', text: 'Você ganha +300 pontos quando a análise for realizada.' },
          { emoji: '4️⃣', text: 'Se fechar contrato, você ganha +900 pontos adicionais! 🎉' },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{step.emoji}</span>
            <p className="text-slate-400 text-sm">{step.text}</p>
          </div>
        ))}
      </MotionDiv>
    </div>
  );
}
