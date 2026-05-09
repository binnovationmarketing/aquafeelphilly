import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, supabaseAnon } from '../../lib/supabase';
import {
  Mail, Lock, Phone, User, Eye, EyeOff, Loader2,
  ArrowLeft, Chrome, CheckCircle2, Droplets, Users,
} from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const M = motion.div as any;

type Tab = 'analyst' | 'client';
type AnalystMode = 'login' | 'reset';
type ClientStep = 'email' | 'login' | 'signup' | 'reset' | 'success';

const friendlyMsg = (msg: string): string => {
  if (/invalid login credentials/i.test(msg)) return 'Email ou senha incorretos.';
  if (/email not confirmed/i.test(msg))        return 'Confirme seu email antes de entrar.';
  if (/too many requests/i.test(msg))          return 'Muitas tentativas. Tente em alguns minutos.';
  if (/user not found/i.test(msg))             return 'Usuário não encontrado.';
  return msg;
};

const inputCls =
  'w-full rounded-2xl px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white/10 transition-all text-sm';

const inputClsCyan  = inputCls + ' focus:ring-cyan-500';
const inputClsWhite = inputCls + ' focus:ring-white/30';

export const AuthLanding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isManager, loading } = useAuth();

  // ── Tab ──────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>(
    searchParams.get('tab') === 'client' ? 'client' : 'analyst',
  );

  // ── Analyst state ────────────────────────────────────────────
  const [analystMode, setAnalystMode] = useState<AnalystMode>('login');
  const [analystEmail, setAnalystEmail] = useState('');
  const [analystPw, setAnalystPw] = useState('');
  const [analystLoading, setAnalystLoading] = useState(false);

  // ── Client state ─────────────────────────────────────────────
  const [clientStep, setClientStep] = useState<ClientStep>('email');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPw, setClientPw] = useState('');
  const [clientConfirm, setClientConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientLoading, setClientLoading] = useState(false);

  // ── Redirect when already logged in ─────────────────────────
  useEffect(() => {
    if (loading || !user) return;
    if (user.user_metadata?.user_type === 'client') {
      navigate('/portal/client', { replace: true });
    } else if (isManager) {
      navigate('/dashboard/manager', { replace: true });
    } else {
      navigate('/dashboard/analyst', { replace: true });
    }
  }, [user, isManager, loading, navigate]);

  // ── Analyst handlers ─────────────────────────────────────────
  const handleAnalystSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalystLoading(true);
    try {
      if (analystMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: analystEmail,
          password: analystPw,
        });
        if (error) throw error;
        // redirect handled by useEffect above
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(analystEmail, {
          redirectTo: `https://aquafeelphilly.com/recovery`,
        });
        if (error) throw error;
        toast.success('Link enviado! Verifique seu email.');
        setAnalystMode('login');
      }
    } catch (err: any) {
      toast.error(friendlyMsg(err.message));
    } finally {
      setAnalystLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAnalystLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard/analyst` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(friendlyMsg(err.message));
      setAnalystLoading(false);
    }
  };

  // ── Client handlers ──────────────────────────────────────────
  const resetClient = () => {
    setClientStep('email');
    setClientPw('');
    setClientConfirm('');
    setClientName('');
    setClientPhone('');
    setShowPw(false);
    setShowConfirm(false);
  };

  const handleClientEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = clientEmail.trim().toLowerCase();
    if (!trimmed) return;
    setClientLoading(true);
    try {
      const { data: exists } = await supabaseAnon.rpc('check_client_exists', { p_email: trimmed });
      setClientStep(exists ? 'login' : 'signup');
    } catch {
      setClientStep('signup');
    } finally {
      setClientLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPw) return;
    setClientLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: clientEmail.trim(),
        password: clientPw,
      });
      if (error) {
        if (/invalid login credentials/i.test(error.message)) {
          toast.error('Senha incorreta. Tente novamente ou clique em "Esqueci minha senha".');
        } else if (/email not confirmed/i.test(error.message)) {
          toast.error('Conta criada! Verifique seu email para confirmar, ou peça ao administrador para ativar sua conta.');
        } else {
          throw error;
        }
        return;
      }
      // Do NOT call navigate() here — let onAuthStateChange fire first,
      // then the useEffect redirect handles navigation (avoids race condition).
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar. Tente novamente.');
    } finally {
      setClientLoading(false);
    }
  };

  const handleClientSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPw || !clientConfirm) { toast.error('Preencha todos os campos.'); return; }
    if (clientPw !== clientConfirm)   { toast.error('As senhas não conferem.'); return; }
    if (clientPw.length < 6)          { toast.error('Senha deve ter mín. 6 caracteres.'); return; }

    setClientLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: clientEmail.trim(),
        password: clientPw,
        options: { data: { user_type: 'client', client_name: clientName } },
      });

      if (signUpError) {
        if (/already registered/i.test(signUpError.message)) {
          setClientStep('login');
          setClientPw('');
          setClientConfirm('');
          toast.info('Este email já tem cadastro. Entre com sua senha.');
        } else {
          throw signUpError;
        }
        return;
      }

      const userId = signUpData.user?.id;
      if (userId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('email', clientEmail.trim())
          .single();

        if (existing) {
          await supabase.from('clients').update({ auth_user_id: userId }).eq('id', existing.id);
        } else {
          await supabase.from('clients').insert({
            auth_user_id: userId,
            name: clientName,
            email: clientEmail.trim(),
            phone: clientPhone ? `+1${clientPhone.replace(/\D/g, '')}` : null,
            status: 'LEAD',
            created_at: new Date().toISOString(),
          });
        }
      }

      // After signup: if session returned immediately (email confirmation disabled),
      // redirect will happen via onAuthStateChange. If confirmation required, show success.
      if (signUpData.session) {
        // Session active immediately — onAuthStateChange will redirect
        toast.success('Conta criada! Bem-vindo ao Portal VIP.');
      } else {
        setClientStep('success');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta.');
    } finally {
      setClientLoading(false);
    }
  };

  const handleClientReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientLoading(true);
    const PROD_URL = 'https://aquafeelphilly.com';
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clientEmail.trim(), {
        redirectTo: `${PROD_URL}/recovery`,
      });
      if (error) throw error;
      toast.success('Email enviado! Verifique sua caixa de entrada.');
      setClientStep('login');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email.');
    } finally {
      setClientLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white py-10">
      {/* Background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full relative z-10 space-y-4">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          <AquaFeelLogo width="160px" variant="white" />
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('analyst')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'analyst'
                ? 'bg-white/15 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users size={13} /> Analista / Estudante
          </button>
          <button
            onClick={() => { setTab('client'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'client'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Droplets size={13} /> Sou Cliente
          </button>
        </div>

        {/* ═══════════════════════ ANALYST PANEL ═══════════════════════ */}
        <AnimatePresence mode="wait">
          {tab === 'analyst' && (
            <M
              key="analyst"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="text-center mb-7">
                <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">
                  {analystMode === 'login' ? 'Acessar Dashboard' : 'Recuperar Senha'}
                </h2>
                <p className="text-slate-500 text-xs">
                  {analystMode === 'login'
                    ? 'Portal de analistas, estudantes e mentores'
                    : 'Enviaremos um link de recuperação para seu email'}
                </p>
              </div>

              <form onSubmit={handleAnalystSubmit} className="space-y-4">
                {/* Email */}
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={analystEmail}
                    onChange={e => setAnalystEmail(e.target.value)}
                    placeholder="Seu email"
                    className={inputClsWhite}
                  />
                </div>

                {/* Password (login only) */}
                {analystMode === 'login' && (
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={analystPw}
                      onChange={e => setAnalystPw(e.target.value)}
                      placeholder="Senha"
                      className={inputClsWhite}
                    />
                  </div>
                )}

                {analystMode === 'login' && (
                  <div className="flex justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      className="text-slate-500 hover:text-white font-bold transition-colors"
                    >
                      Nova conta →
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalystMode('reset')}
                      className="text-slate-400 hover:text-yellow-400 font-bold transition-colors"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={analystLoading}
                  className="w-full py-4 rounded-2xl bg-white text-[#020d1a] font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {analystLoading
                    ? <Loader2 size={18} className="animate-spin" />
                    : analystMode === 'login'
                      ? 'Acessar Dashboard'
                      : '📧 Enviar Link'}
                </button>
              </form>

              {analystMode === 'login' && (
                <>
                  <div className="relative flex items-center gap-3 my-5">
                    <div className="flex-1 border-t border-white/10" />
                    <span className="text-xs text-slate-600 font-semibold">ou</span>
                    <div className="flex-1 border-t border-white/10" />
                  </div>
                  <button
                    onClick={handleGoogle}
                    disabled={analystLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all active:scale-[0.98]"
                  >
                    <Chrome size={16} className="text-blue-400" />
                    Continuar com Google
                  </button>
                </>
              )}

              {analystMode === 'reset' && (
                <button
                  onClick={() => setAnalystMode('login')}
                  className="mt-5 w-full flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft size={12} /> Voltar ao Login
                </button>
              )}
            </M>
          )}

          {/* ═══════════════════════ CLIENT PANEL ═══════════════════════ */}
          {tab === 'client' && (
            <M
              key={`client-${clientStep}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28 }}
              className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-cyan-500/10"
            >
              {/* ── Email step ── */}
              {clientStep === 'email' && (
                <>
                  <div className="text-center mb-7">
                    <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                      <Droplets size={12} /> Portal VIP do Cliente
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">Bem-vindo!</h2>
                    <p className="text-slate-400 text-sm">
                      Digite seu email para entrar ou criar sua conta.
                    </p>
                  </div>
                  <form onSubmit={handleClientEmail} className="space-y-4">
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="Seu email"
                        className={inputClsCyan}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={clientLoading || !clientEmail}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {clientLoading ? <Loader2 size={18} className="animate-spin" /> : 'Continuar →'}
                    </button>
                  </form>
                </>
              )}

              {/* ── Login step ── */}
              {clientStep === 'login' && (
                <>
                  <div className="text-center mb-7">
                    <h2 className="text-xl font-black text-white mb-1">Bem-vindo de volta!</h2>
                    <p className="text-slate-400 text-sm">
                      Entrando como{' '}
                      <span className="text-cyan-400 font-bold">{clientEmail}</span>
                    </p>
                  </div>
                  <form onSubmit={handleClientLogin} className="space-y-4">
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        value={clientPw}
                        onChange={e => setClientPw(e.target.value)}
                        placeholder="Sua senha"
                        className={inputClsCyan + ' pr-12'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={clientLoading || !clientPw}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {clientLoading ? <Loader2 size={18} className="animate-spin" /> : '🔓 Entrar'}
                    </button>

                    <div className="flex justify-between text-xs">
                      <button type="button" onClick={() => setClientStep('signup')} className="text-slate-500 hover:text-cyan-400 font-bold transition-colors">
                        Criar conta →
                      </button>
                      <button type="button" onClick={() => setClientStep('reset')} className="text-slate-500 hover:text-yellow-400 font-bold transition-colors">
                        Esqueci a senha
                      </button>
                    </div>
                  </form>

                  <button
                    onClick={resetClient}
                    className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
                  >
                    <ArrowLeft size={12} /> Usar outro email
                  </button>
                </>
              )}

              {/* ── Signup step ── */}
              {clientStep === 'signup' && (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
                      Criar Conta
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">Cadastre-se</h2>
                    <p className="text-slate-400 text-sm">
                      Para: <span className="text-cyan-400 font-bold">{clientEmail}</span>
                    </p>
                  </div>

                  <form onSubmit={handleClientSignup} className="space-y-3">
                    {/* Name */}
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Nome completo *"
                        className="w-full rounded-2xl px-4 py-3.5 pl-11 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all text-sm"
                      />
                    </div>

                    {/* Phone */}
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-cyan-500 transition-all overflow-hidden">
                      <span className="pl-4 pr-2 flex items-center gap-1.5 text-slate-300 shrink-0 text-sm font-bold">
                        <Phone size={13} className="text-slate-500" /> +1
                      </span>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Telefone (opcional)"
                        className="flex-1 bg-transparent pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Password */}
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        value={clientPw}
                        onChange={e => setClientPw(e.target.value)}
                        placeholder="Senha (mín. 6 caracteres) *"
                        className="w-full rounded-2xl px-4 py-3.5 pl-11 pr-11 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all text-sm"
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Confirm */}
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={clientConfirm}
                        onChange={e => setClientConfirm(e.target.value)}
                        placeholder="Confirmar senha *"
                        className={`w-full rounded-2xl px-4 py-3.5 pl-11 pr-11 bg-white/5 border placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all text-sm ${
                          clientConfirm && clientConfirm !== clientPw ? 'border-red-500/50' : 'border-white/10'
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {clientConfirm && clientConfirm !== clientPw && (
                      <p className="text-red-400 text-xs pl-1">As senhas não conferem.</p>
                    )}

                    <button
                      type="submit"
                      disabled={clientLoading || !clientName || !clientPw || !clientConfirm || clientPw !== clientConfirm}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,150,0.3)] hover:shadow-[0_0_40px_rgba(0,200,150,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {clientLoading ? <Loader2 size={18} className="animate-spin" /> : '✅ Criar Minha Conta'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setClientStep('login')}
                      className="w-full text-xs text-slate-500 hover:text-cyan-400 font-bold transition-colors"
                    >
                      Já tenho conta → Entrar
                    </button>
                  </form>

                  <button
                    onClick={resetClient}
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
                  >
                    <ArrowLeft size={12} /> Usar outro email
                  </button>
                </>
              )}

              {/* ── Reset step ── */}
              {clientStep === 'reset' && (
                <>
                  <div className="text-center mb-7">
                    <h2 className="text-xl font-black text-white mb-1">Recuperar Senha</h2>
                    <p className="text-slate-400 text-sm">
                      Link para:{' '}
                      <span className="text-yellow-400 font-bold">{clientEmail}</span>
                    </p>
                  </div>
                  <form onSubmit={handleClientReset}>
                    <button
                      type="submit"
                      disabled={clientLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(240,180,0,0.3)] hover:shadow-[0_0_40px_rgba(240,180,0,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {clientLoading ? <Loader2 size={18} className="animate-spin" /> : '📧 Enviar Link de Recuperação'}
                    </button>
                  </form>
                  <button
                    onClick={() => setClientStep('login')}
                    className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
                  >
                    <ArrowLeft size={12} /> Voltar ao Login
                  </button>
                </>
              )}

              {/* ── Success step ── */}
              {clientStep === 'success' && (
                <div className="text-center py-4 space-y-4">
                  <div className="relative mx-auto w-20 h-20 mb-2">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={36} className="text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-white">Conta Criada! 🎉</h2>
                  <p className="text-slate-400 text-sm">
                    Conta criada para{' '}
                    <strong className="text-cyan-400">{clientEmail}</strong>.
                    <br />Agora faça login com sua senha.
                  </p>
                  <button
                    onClick={() => { setClientStep('login'); setClientPw(''); setClientConfirm(''); }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] transition-all active:scale-[0.98]"
                  >
                    🔓 Fazer Login
                  </button>
                </div>
              )}
            </M>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          Aquafeel Solutions Tech © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
