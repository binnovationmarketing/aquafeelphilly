import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, User, Phone, ChevronDown, Droplets, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AquaFeelLogo from '../AquaFeelLogo';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

export const ClientSignup: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', analystEmail: '' });
  const [phoneDigits, setPhoneDigits] = useState('');
  const [analysts, setAnalysts] = useState<{ email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('analysts')
      .select('first_name, last_name, email')
      .order('first_name')
      .then(({ data }) => {
        if (data) {
          setAnalysts(
            (data as any[])
              .map(a => ({ email: a.email || '', name: `${a.first_name || ''} ${a.last_name || ''}`.trim() }))
              .filter(a => a.email && a.name)
          );
        }
      });
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { user_type: 'client', first_name: form.firstName, last_name: form.lastName }
        }
      });
      if (authError) throw authError;

      if (authData.user) {
        const phone = phoneDigits ? `+1${phoneDigits}` : '';
        const { error: clientError } = await supabase.from('clients').upsert({
          auth_user_id: authData.user.id,
          name: `${form.firstName} ${form.lastName}`.trim(),
          phone,
          email: form.email,
          analyst: form.analystEmail,
          status: 'LEAD',
          lang: 'pt',
          created_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        if (clientError) throw clientError;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white py-12">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-cyan-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">
          {!success ? (
            <MotionDiv
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="mb-5">
                  <AquaFeelLogo width="150px" variant="white" />
                </div>
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                  <Droplets size={12} /> Portal VIP — Cadastro
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Crie sua conta</h2>
                <p className="text-slate-400 text-sm">Acesse seu portal de recompensas Aquafeel</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input required placeholder="Nome" value={form.firstName}
                      onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                  </div>
                  <div className="relative group">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    <input required placeholder="Sobrenome" value={form.lastName}
                      onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                  </div>
                </div>

                {/* Phone +1 */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500 transition-all overflow-hidden">
                  <span className="pl-4 pr-2 flex items-center gap-1.5 text-slate-300 shrink-0 font-bold text-sm">
                    <Phone size={14} className="text-slate-500" /> +1
                  </span>
                  <input type="tel" placeholder="215-000-0000" value={phoneDigits} onChange={handlePhoneChange}
                    className="flex-1 bg-transparent pr-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none" />
                </div>

                <div className="relative group">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input required type="email" placeholder="Seu email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                </div>

                <div className="relative group">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input required type="password" placeholder="Crie uma senha (mín. 6 caracteres)" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                </div>

                <div className="relative group">
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select required value={form.analystEmail}
                    onChange={e => setForm(f => ({ ...f, analystEmail: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition-all">
                    <option value="" disabled className="bg-[#020d1a]">Selecione seu Consultor Aquafeel</option>
                    {analysts.map(a => (
                      <option key={a.email} value={a.email} className="bg-[#020d1a]">{a.name}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : '💧 Criar Minha Conta'}
                </button>
              </form>

              <button onClick={() => navigate('/client-login')}
                className="mt-6 w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-white font-bold uppercase tracking-wider transition-colors">
                <ArrowLeft size={12} /> Já tenho conta — Acessar Portal
              </button>
            </MotionDiv>
          ) : (
            <MotionDiv
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Conta Criada! 🎉</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-2">
                Bem-vindo(a) ao Portal VIP Aquafeel!
              </p>
              <p className="text-slate-500 text-xs mb-8">
                Faça login com seu email e senha para acessar seus pontos e recompensas.
              </p>
              <button onClick={() => navigate('/client-login')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98]">
                ✨ Acessar Portal VIP
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
