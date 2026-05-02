import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, Loader2, ArrowLeft, Droplets, CheckCircle2, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AquaFeelLogo from '../AquaFeelLogo';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

type Mode = 'email' | 'phone';
type Step = 'input' | 'sent-email' | 'sent-whatsapp';

export const ClientLogin: React.FC = () => {
  const [mode, setMode] = useState<Mode>('email');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [sentTo, setSentTo] = useState('');
  const [waLink, setWaLink] = useState('');
  const navigate = useNavigate();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data: clientCheck, error: checkError } = await supabase
        .from('clients')
        .select('id, name')
        .ilike('email', email.trim())
        .limit(1)
        .maybeSingle();

      if (checkError) throw checkError;
      if (!clientCheck) {
        toast.error('Email não encontrado. Fale com seu consultor Aquafeel para confirmar o email cadastrado.');
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/portal/client`,
          data: { user_type: 'client', client_name: clientCheck.name },
        },
      });

      if (otpError) throw otpError;

      setSentTo(email.trim());
      setStep('sent-email');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneDigits.length < 10) {
      toast.error('Digite um número de telefone válido com 10 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('magic-link', {
        body: {
          phone: phoneDigits,
          redirectTo: `${window.location.origin}/portal/client`,
        },
      });

      if (error) throw error;
      if (data?.error === 'not_found') {
        toast.error('Telefone não encontrado. Fale com seu consultor Aquafeel para confirmar o número cadastrado.');
        return;
      }
      if (data?.error) throw new Error(data.error);

      const link = data.link as string;
      const phone = `+1${phoneDigits}`;
      const msg = encodeURIComponent(
        `💧 *Aquafeel Philly — Portal VIP*\n\nOlá! Aqui está seu link de acesso seguro ao portal de recompensas:\n\n👉 ${link}\n\n⏳ Este link expira em 1 hora.\n\n_Não compartilhe este link com ninguém._`
      );
      const wa = `https://wa.me/${phone.replace('+', '')}?text=${msg}`;

      setWaLink(wa);
      setSentTo(phone);
      setStep('sent-whatsapp');

      // Open WhatsApp automatically
      window.open(wa, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('input');
    setEmail('');
    setPhoneDigits('');
    setSentTo('');
    setWaLink('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white">
      {/* Background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-cyan-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating drops */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute opacity-10 text-cyan-400 animate-bounce"
          style={{ left: `${10 + i * 15}%`, top: `${15 + (i % 3) * 25}%`, animationDelay: `${i * 0.5}s`, fontSize: `${16 + i * 4}px` }}>
          💧
        </div>
      ))}

      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Input step ── */}
          {step === 'input' && (
            <MotionDiv
              key="input"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
            >
              {/* Logo */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="mb-5 relative">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                  <AquaFeelLogo width="160px" variant="white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                  <Droplets size={12} /> Portal VIP do Cliente
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Bem-vindo de volta!</h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  {mode === 'email'
                    ? 'Digite seu email para receber um link mágico de acesso instantâneo.'
                    : 'Digite seu telefone e enviaremos o link de acesso pelo WhatsApp.'}
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-6 gap-1">
                <button
                  type="button"
                  onClick={() => setMode('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    mode === 'email'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Mail size={13} /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setMode('phone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    mode === 'phone'
                      ? 'bg-gradient-to-r from-[#25D366] to-emerald-600 text-white shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'email' ? (
                  <MotionDiv key="email-form" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                    <form onSubmit={handleEmailSubmit} className="space-y-5">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                          <Mail size={20} />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Seu email cadastrado"
                          className="w-full rounded-2xl px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : '✨ Enviar Link Mágico'}
                      </button>
                    </form>
                    <div className="mt-5 p-4 bg-white/3 border border-white/5 rounded-2xl">
                      <p className="text-slate-500 text-xs text-center leading-relaxed">
                        🔐 Sem senha para memorizar! Você receberá um link seguro no email. Basta clicar para entrar.
                      </p>
                    </div>
                  </MotionDiv>
                ) : (
                  <MotionDiv key="phone-form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                    <form onSubmit={handlePhoneSubmit} className="space-y-5">
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-[#25D366] transition-all overflow-hidden">
                        <div className="pl-4 pr-2 flex items-center gap-2 text-slate-300 shrink-0">
                          <Phone size={18} className="text-slate-400" />
                          <span className="font-black text-sm">+1</span>
                        </div>
                        <input
                          type="tel"
                          required
                          value={phoneDigits}
                          onChange={handlePhoneChange}
                          placeholder="215-555-0000"
                          className="flex-1 bg-transparent pr-4 py-4 text-white placeholder-slate-500 focus:outline-none font-medium text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading || phoneDigits.length < 10}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(37,211,102,0.3)] hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <><MessageCircle size={18} /> Enviar pelo WhatsApp</>}
                      </button>
                    </form>
                    <div className="mt-5 p-4 bg-white/3 border border-white/5 rounded-2xl">
                      <p className="text-slate-500 text-xs text-center leading-relaxed">
                        📱 Você receberá um link seguro pelo WhatsApp. Basta clicar para entrar no portal!
                      </p>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>

              {/* Divider */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-slate-600 font-semibold">É analista?</span>
                <div className="flex-1 border-t border-white/10" />
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white font-bold uppercase tracking-wider transition-colors"
              >
                <ArrowLeft size={12} /> Acessar Portal do Analista
              </button>
            </MotionDiv>
          )}

          {/* ── Email sent step ── */}
          {step === 'sent-email' && (
            <MotionDiv
              key="sent-email"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Link Enviado!</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Verifique sua caixa de entrada em <strong className="text-cyan-400">{sentTo}</strong> e clique no link para acessar seu Portal VIP.
              </p>
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl mb-6 text-left space-y-2">
                <p className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-2">📧 Dicas:</p>
                <p className="text-slate-400 text-xs">• O link expira em <strong className="text-white">1 hora</strong></p>
                <p className="text-slate-400 text-xs">• Verifique também a pasta de Spam</p>
                <p className="text-slate-400 text-xs">• Caso não receba, tente novamente abaixo</p>
              </div>
              <button onClick={reset} className="text-xs text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 mx-auto">
                <ArrowLeft size={12} /> Tentar novamente
              </button>
            </MotionDiv>
          )}

          {/* ── WhatsApp sent step ── */}
          {step === 'sent-whatsapp' && (
            <MotionDiv
              key="sent-whatsapp"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-[#25D366]/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-[#25D366] to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <MessageCircle size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">WhatsApp Aberto!</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                O link de acesso foi preparado para <strong className="text-[#25D366]">{sentTo}</strong>.<br />
                Confirme o envio no WhatsApp para acessar o portal.
              </p>
              <div className="bg-[#25D366]/10 border border-[#25D366]/20 p-4 rounded-2xl mb-6 text-left space-y-2">
                <p className="text-xs font-black text-[#25D366] uppercase tracking-widest mb-2">📱 Próximo passo:</p>
                <p className="text-slate-400 text-xs">• Abra o WhatsApp e envie a mensagem</p>
                <p className="text-slate-400 text-xs">• Clique no link recebido para entrar</p>
                <p className="text-slate-400 text-xs">• O link expira em <strong className="text-white">1 hora</strong></p>
              </div>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#25D366] to-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(37,211,102,0.3)] hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
              >
                <MessageCircle size={18} /> Reabrir WhatsApp
              </a>
              <button onClick={reset} className="text-xs text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 mx-auto">
                <ArrowLeft size={12} /> Tentar novamente
              </button>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
