import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplet, ShieldCheck, Heart, ArrowRight, Calendar as CalendarIcon,
  CheckCircle, User, Phone, MapPin, Loader2, Building2, Clock
} from 'lucide-react';
import { supabase, supabaseAnon } from '../lib/supabase';
import { toast } from 'sonner';

// Suppress framer type issues
const M = {
  div: motion.div as any,
};

const TIMES = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM',
  '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM',
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
];

export function InviteLandingPage() {
  const [searchParams] = useSearchParams();
  // Support both ?ref=token/slug AND route param /i/:slug
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const rawRef = routeSlug || searchParams.get('ref') || '';

  const [resolvedToken, setResolvedToken] = useState('');
  const [referralId, setReferralId] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolving, setResolving] = useState(true);

  const [leadData, setLeadData] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: 'PA',
  });

  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
  });

  // Build next 10 days for date picker (skip today)
  const nextDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayNum: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  });

  // Resolve slug or UUID → token on mount
  useEffect(() => {
    const resolve = async () => {
      if (!rawRef) { setResolving(false); return; }
      try {
        const { data, error } = await supabaseAnon.rpc('get_referral_data_by_slug', { p_slug: rawRef });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); }
        else {
          setResolvedToken(data.token || rawRef);
          setReferrerName(data.referrer_name || '');
        }
      } catch (err: any) {
        // fallback — might just be a UUID token
        setResolvedToken(rawRef);
      } finally {
        setResolving(false);
      }
    };
    resolve();
  }, [rawRef]);

  // Step 1: collect lead info and create referral
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.phone) return;
    setIsSubmitting(true);
    try {
      const fullAddress = [leadData.address, leadData.city, leadData.state].filter(Boolean).join(', ');

      if (resolvedToken && resolvedToken.length > 10) {
        const { data: result, error } = await supabaseAnon.rpc('add_referral_from_portal', {
          p_token: resolvedToken,
          p_name: leadData.name,
          p_phone: leadData.phone,
          p_email: leadData.email,
          p_address: fullAddress,
        });
        if (error) throw error;
        if (result?.error) throw new Error(result.error);
        if (result?.referral_id) setReferralId(result.referral_id);
      } else {
        // No token — loose lead
        const { error } = await supabase.from('clients').insert({
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          zip_code: leadData.address,
          status: 'LEAD',
          observations: ['Agendamento pendente — entrada pelo link de convite'],
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      setStep(2);
    } catch (err: any) {
      toast.error('Erro ao enviar dados: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build a clean HTML email body for scheduling notifications
  const buildScheduleEmailHtml = (opts: {
    recipientLabel: string;
    visiteeLabel: string;
    visitName: string;
    visitPhone: string;
    visitAddress: string;
    visitCity: string;
    visitState: string;
    dateLabel: string;
    time: string;
    referrerName: string;
  }) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f4f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#005088,#11caa0);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Aquafeel Solutions Philly</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;">📅 Análise Agendada!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 8px;color:#374151;font-size:15px;">Olá, <strong>${opts.recipientLabel}</strong>!</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
              ${opts.visiteeLabel} agendou uma <strong style="color:#005088;">Análise de Água Gratuita</strong>. Confira os detalhes abaixo.
            </p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:0;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;color:#0369a1;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Detalhes do Agendamento</p>
                <table width="100%" cellpadding="4" cellspacing="0">
                  <tr>
                    <td style="color:#6b7280;font-size:13px;width:40%;">Nome:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.visitName}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Telefone:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.visitPhone}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Endereço:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.visitAddress}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Cidade / Estado:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.visitCity}, ${opts.visitState}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Data:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.dateLabel}</td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;font-size:13px;">Horário:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.time}</td>
                  </tr>
                  ${opts.referrerName ? `<tr>
                    <td style="color:#6b7280;font-size:13px;">Indicado por:</td>
                    <td style="color:#111827;font-weight:700;font-size:13px;">${opts.referrerName}</td>
                  </tr>` : ''}
                </table>
              </td></tr>
            </table>

            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              Este é um e-mail automático do sistema Aquafeel Philly. Não responda diretamente a este e-mail.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">Aquafeel Solutions Philly · aquafeelphilly.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Step 2: schedule the appointment
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleData.date || !scheduleData.time) {
      toast.error('Selecione a data e horário.');
      return;
    }
    if (!leadData.address || !leadData.city || !leadData.state) {
      toast.error('Preencha o endereço completo.');
      return;
    }

    setIsSubmitting(true);
    try {
      let analystEmail = '';
      let referrerEmail = '';
      let referrerDisplayName = referrerName;

      if (referralId) {
        const { data: result, error } = await supabaseAnon.rpc('schedule_referral_visit', {
          p_referral_id: referralId,
          p_date: scheduleData.date,
          p_time: scheduleData.time,
          p_address: leadData.address,
          p_city: leadData.city,
          p_state: leadData.state,
        });
        if (error) throw error;
        if (result?.error) throw new Error(result.error);

        analystEmail = result?.analyst_email || '';
        referrerEmail = result?.referrer_email || '';
        referrerDisplayName = result?.referrer_name || referrerName;
      }

      // Send email notifications (fire-and-forget — don't block success screen)
      const dateLabel = new Date(scheduleData.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const emailBase = {
        visitName: leadData.name,
        visitPhone: leadData.phone,
        visitAddress: leadData.address,
        visitCity: leadData.city,
        visitState: leadData.state,
        dateLabel,
        time: scheduleData.time,
        referrerName: referrerDisplayName,
      };

      const notifications: Promise<any>[] = [];

      if (analystEmail) {
        notifications.push(
          supabase.functions.invoke('send-email', {
            body: {
              to: analystEmail,
              subject: `📅 Nova Análise Agendada: ${leadData.name} — ${dateLabel}`,
              html: buildScheduleEmailHtml({
                ...emailBase,
                recipientLabel: 'Analista',
                visiteeLabel: `<strong>${leadData.name}</strong> (indicação de ${referrerDisplayName || 'um cliente'})`,
              }),
            },
          })
        );
      }

      if (referrerEmail) {
        notifications.push(
          supabase.functions.invoke('send-email', {
            body: {
              to: referrerEmail,
              subject: `✅ Sua indicação ${leadData.name} agendou uma análise!`,
              html: buildScheduleEmailHtml({
                ...emailBase,
                recipientLabel: referrerDisplayName.split(' ')[0] || 'Cliente',
                visiteeLabel: `Sua indicação <strong>${leadData.name}</strong>`,
              }),
            },
          })
        );
      }

      // Don't await — emails are best-effort; never block the success UI
      Promise.allSettled(notifications);

      setStep(3);
    } catch (err: any) {
      toast.error('Erro ao agendar: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resolving) {
    return (
      <div className="min-h-screen bg-[#020d1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Carregando convite...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#020d1a] text-slate-50 overflow-x-hidden selection:bg-[#11caa0] selection:text-white"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#005088]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#11caa0]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <nav className="relative z-10 p-6 flex justify-between items-center max-w-6xl mx-auto">
        <M.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#005088] to-[#11caa0] rounded-xl flex items-center justify-center text-white font-bold shadow-lg">AQ</div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            Aquafeel <span className="text-[#11caa0]">Philly</span>
          </span>
        </M.div>
        {referrerName && (
          <M.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden sm:flex items-center gap-2 bg-[#11caa0]/10 border border-[#11caa0]/20 text-[#11caa0] text-xs font-bold px-4 py-2 rounded-full">
            👋 Convite de <strong className="ml-1">{referrerName.split(' ')[0]}</strong>
          </M.div>
        )}
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 md:py-16 grid md:grid-cols-2 gap-12 items-start">

        {/* Left — Copywriting */}
        <M.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8 md:sticky md:top-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#11caa0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#11caa0]" />
            </span>
            Convite VIP Exclusivo
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            Água Pura e Segura por menos de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#11caa0] to-emerald-400">
              $5 ao dia.
            </span>
          </h1>

          {referrerName && (
            <p className="text-lg text-slate-300 leading-relaxed">
              <strong className="text-white">{referrerName.split(' ')[0]}</strong> transformou a saúde da família e enviou este convite para você receber uma{' '}
              <strong className="text-[#11caa0]">Análise de Água Gratuita</strong> na sua casa.
            </p>
          )}
          {!referrerName && (
            <p className="text-lg text-slate-400 leading-relaxed">
              Receba uma <strong>Análise de Água Gratuita</strong> na sua casa e descubra o que você está realmente bebendo.
            </p>
          )}

          <div className="space-y-3 pt-2">
            {[
              { icon: Droplet, title: 'Água 100% Pura', desc: 'Remove chumbo, cloro, toxinas e metais pesados.' },
              { icon: Heart, title: 'Saúde da Família', desc: 'Pele mais macia, cabelos sedosos e proteção real.' },
              { icon: ShieldCheck, title: 'Garantia Vitalícia', desc: 'Tecnologia premium com suporte contínuo.' },
            ].map((f, idx) => (
              <M.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-[#005088]/30 flex items-center justify-center flex-shrink-0">
                  <f.icon className="text-[#11caa0]" size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{f.title}</h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </div>
              </M.div>
            ))}
          </div>
        </M.div>

        {/* Right — Form Card */}
        <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-[#005088] to-[#11caa0] rounded-[2rem] blur opacity-25 animate-pulse" />
          <div className="relative bg-[#06162a] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden">

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-7">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= s ? 'bg-[#11caa0] text-[#020d1a]' : 'bg-white/10 text-slate-500'
                  }`}>{s}</div>
                  {s < 3 && <div className={`h-0.5 w-8 transition-all ${step > s ? 'bg-[#11caa0]' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* STEP 1: Contact Info */}
              {step === 1 && (
                <M.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Seus dados</h2>
                    <p className="text-slate-400 text-sm">Preencha para validar seu convite VIP e agendar.</p>
                  </div>

                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    {/* Name */}
                    <Field icon={User} label="Nome Completo" placeholder="Seu nome" value={leadData.name} onChange={(v) => setLeadData({ ...leadData, name: v })} required />
                    {/* Phone */}
                    <Field icon={Phone} label="Telefone / WhatsApp" placeholder="(000) 000-0000" type="tel" value={leadData.phone} onChange={(v) => setLeadData({ ...leadData, phone: v })} required />
                    {/* Email */}
                    <Field icon={User} label="Email (opcional)" placeholder="seu@email.com" type="email" value={leadData.email} onChange={(v) => setLeadData({ ...leadData, email: v })} />
                    {/* Address */}
                    <Field icon={MapPin} label="Endereço / Street" placeholder="123 Main St" value={leadData.address} onChange={(v) => setLeadData({ ...leadData, address: v })} />
                    {/* City + State */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field icon={Building2} label="Cidade" placeholder="Philadelphia" value={leadData.city} onChange={(v) => setLeadData({ ...leadData, city: v })} />
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Estado</label>
                        <select
                          value={leadData.state}
                          onChange={(e) => setLeadData({ ...leadData, state: e.target.value })}
                          className="w-full bg-[#0a213f] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#11caa0] focus:ring-1 focus:ring-[#11caa0] transition-all text-sm"
                        >
                          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#005088] to-[#11caa0] text-white font-bold py-4 rounded-xl mt-2 shadow-lg shadow-[#11caa0]/20 hover:shadow-[#11caa0]/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-60"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                        <><span>Continuar para Agendamento</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </form>
                </M.div>
              )}

              {/* STEP 2: Schedule date + time */}
              {step === 2 && (
                <M.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-[#11caa0]/20 text-[#11caa0] rounded-full flex items-center justify-center mx-auto mb-3">
                      <CalendarIcon size={28} />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Quase lá, {leadData.name.split(' ')[0]}!</h2>
                    <p className="text-slate-400 text-sm">Escolha o dia e horário para sua análise gratuita.</p>
                  </div>

                  <form onSubmit={handleScheduleSubmit} className="space-y-5">
                    {/* Day picker */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Escolha o dia:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {nextDays.slice(0, 10).map((day) => (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => setScheduleData({ ...scheduleData, date: day.dateStr })}
                            className={`flex flex-col items-center py-3 px-1 rounded-xl border text-xs font-bold transition-all ${
                              scheduleData.date === day.dateStr
                                ? 'bg-[#11caa0] border-[#11caa0] text-[#020d1a]'
                                : 'bg-[#0a213f] border-white/10 text-slate-400 hover:border-[#11caa0]/50 hover:text-white'
                            }`}
                          >
                            <span className="text-[10px] uppercase">{day.weekday}</span>
                            <span className="text-lg font-black">{day.dayNum}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time picker */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Escolha o horário:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {TIMES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setScheduleData({ ...scheduleData, time: t })}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                              scheduleData.time === t
                                ? 'bg-[#11caa0] border-[#11caa0] text-[#020d1a]'
                                : 'bg-[#0a213f] border-white/10 text-slate-400 hover:border-[#11caa0]/50 hover:text-white'
                            }`}
                          >
                            <Clock size={12} /> {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Address confirmation */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-400 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Endereço da visita:</p>
                      <p className="text-white font-semibold">{leadData.address}</p>
                      <p>{leadData.city}, {leadData.state}</p>
                      <button type="button" onClick={() => setStep(1)} className="text-[#11caa0] text-xs font-bold hover:underline mt-1">
                        Editar endereço
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !scheduleData.date || !scheduleData.time}
                      className="w-full bg-gradient-to-r from-[#005088] to-[#11caa0] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#11caa0]/20 hover:shadow-[#11caa0]/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (
                        <><CheckCircle size={18} /> Confirmar Agendamento</>
                      )}
                    </button>
                  </form>
                </M.div>
              )}

              {/* STEP 3: Success */}
              {step === 3 && (
                <M.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
                  <M.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
                    className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle size={48} />
                  </M.div>

                  <div>
                    <h2 className="text-3xl font-bold mb-2">Agendamento Confirmado! 🎉</h2>
                    <p className="text-slate-400 text-sm">
                      Nosso especialista foi notificado e entrará em contato para confirmar sua visita.
                    </p>
                  </div>

                  <div className="bg-[#0a213f] border border-white/10 rounded-2xl p-6 text-left space-y-3 text-sm">
                    <h3 className="font-bold text-[#11caa0] text-base mb-4">📋 Detalhes do Agendamento:</h3>
                    {[
                      { label: 'Nome', value: leadData.name },
                      { label: 'Telefone', value: leadData.phone },
                      { label: 'Endereço', value: `${leadData.address}, ${leadData.city}, ${leadData.state}` },
                      { label: 'Data', value: scheduleData.date ? new Date(scheduleData.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : '' },
                      { label: 'Horário', value: scheduleData.time },
                    ].map((item) => (
                      <p key={item.label} className="flex justify-between border-b border-white/5 pb-2 last:border-0">
                        <span className="text-slate-400">{item.label}:</span>
                        <span className="font-bold text-right max-w-[55%]">{item.value}</span>
                      </p>
                    ))}
                    <p className="pt-2 flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-bold text-[#11caa0]">✅ Aguardando Confirmação</span>
                    </p>
                  </div>

                  {referrerName && (
                    <p className="text-slate-500 text-xs">
                      Agradecemos a indicação de <strong className="text-slate-300">{referrerName.split(' ')[0]}</strong>! Eles serão recompensados por isso. 💙
                    </p>
                  )}
                </M.div>
              )}

            </AnimatePresence>
          </div>
        </M.div>
      </main>
    </div>
  );
}

// Reusable input field
function Field({
  icon: Icon, label, placeholder, value, onChange, type = 'text', required = false,
}: {
  icon: any; label: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0a213f] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-[#11caa0] focus:ring-1 focus:ring-[#11caa0] transition-all placeholder-slate-600"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
