import React, { useState } from 'react';
import { supabase, supabaseAnon } from '../../lib/supabase';
import { Mail, Phone, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, Droplets, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AquaFeelLogo from '../AquaFeelLogo';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

type Step = 'email' | 'login' | 'signup' | 'success' | 'reset';

export const ClientLogin: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Signup form fields
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');

  const navigate = useNavigate();

  // Step 1 — check if email exists in clients table
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { data: exists, error } = await supabaseAnon.rpc('check_client_exists', {
        p_email: trimmed,
      });
      if (error) throw error;
      if (exists) {
        setStep('login');
      } else {
        setStep('signup');
      }
    } catch (err: any) {
      // If the RPC doesn't exist yet (not migrated), default to signup
      console.warn('check_client_exists RPC error:', err.message);
      setStep('signup');
    } finally {
      setLoading(false);
    }
  };

  // Step 2a — sign in with email + password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Senha incorreta. Verifique sua senha ou clique em "Criar conta" para cadastrar uma nova.');
        } else {
          throw error;
        }
        return;
      }
      navigate('/portal/client');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2b — create account + insert into clients
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !password || !confirmPassword) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      // Create auth user (no email confirmation required)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { user_type: 'client', client_name: signupName },
          emailRedirectTo: undefined,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          // User exists in auth — switch to login step automatically
          setStep('login');
          setPassword('');
          setConfirmPassword('');
          toast.info('Este email já tem cadastro. Entre com sua senha abaixo.');
        } else {
          toast.error(signUpError.message || 'Erro ao criar conta. Tente novamente.');
        }
        return;
      }

      const userId = signUpData.user?.id;

      // Link auth user to existing client record (analyst may have pre-created it),
      // or insert a new one. Never overwrite clients.id (it's a separate PK).
      if (userId) {
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email.trim())
          .single();

        if (existingClient) {
          // Update existing row: link auth_user_id
          await supabase
            .from('clients')
            .update({ auth_user_id: userId })
            .eq('id', existingClient.id);
        } else {
          // Insert new client row
          await supabase.from('clients').insert({
            auth_user_id: userId,
            name: signupName,
            email: email.trim(),
            phone: signupPhone ? `+1${signupPhone.replace(/\D/g, '')}` : null,
            status: 'LEAD',
            created_at: new Date().toISOString(),
          });
        }
      }

      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/recovery`,
      });
      if (error) throw error;
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setStep('login');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('email');
    setPassword('');
    setConfirmPassword('');
    setSignupName('');
    setSignupPhone('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white">
      {/* Background orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-cyan-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-700/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">

          {/* ── Step: Email ── */}
          {step === 'email' && (
            <MotionDiv
              key="email"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Bem-vindo!</h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                  Digite seu email para acessar o portal ou criar sua conta.
                </p>
              </div>

              <form onSubmit={handleEmailContinue} className="space-y-5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu email"
                    className="w-full rounded-2xl px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : 'Continuar →'}
                </button>
              </form>

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

          {/* ── Step: Login (existing user) ── */}
          {step === 'login' && (
            <MotionDiv
              key="login"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="mb-5 relative">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                  <AquaFeelLogo width="140px" variant="white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Bem-vindo de volta!</h2>
                <p className="text-slate-400 text-sm">
                  Entrando como <span className="text-cyan-400 font-bold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full rounded-2xl px-4 py-4 pl-12 pr-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : '🔓 Entrar'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="w-full text-xs text-slate-500 hover:text-yellow-400 font-bold transition-colors"
                >
                  Esqueci minha senha →
                </button>

                <button
                  type="button"
                  onClick={() => setStep('signup')}
                  className="w-full text-xs text-slate-500 hover:text-cyan-400 font-bold transition-colors"
                >
                  Não tem senha ainda? Criar conta →
                </button>
              </form>

              <button
                onClick={reset}
                className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
              >
                <ArrowLeft size={12} /> Usar outro email
              </button>
            </MotionDiv>
          )}

          {/* ── Step: Signup (new user) ── */}
          {step === 'signup' && (
            <MotionDiv
              key="signup"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="text-center mb-7">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                  Criar Conta
                </div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Cadastre-se</h2>
                <p className="text-slate-400 text-sm">
                  Conta para: <span className="text-cyan-400 font-bold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Nome completo *"
                    className="w-full rounded-2xl px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-cyan-500 transition-all overflow-hidden">
                  <div className="pl-4 pr-2 flex items-center gap-2 text-slate-300 shrink-0">
                    <Phone size={16} className="text-slate-400" />
                    <span className="font-black text-sm">+1</span>
                  </div>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="215-555-0000 (opcional)"
                    className="flex-1 bg-transparent pr-4 py-4 text-white placeholder-slate-500 focus:outline-none font-medium text-sm"
                  />
                </div>

                {/* Email (display only) */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-2xl px-4 py-4 pl-12 bg-white/3 border border-white/5 text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Password */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha (mín. 6 caracteres) *"
                    className="w-full rounded-2xl px-4 py-4 pl-12 pr-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar senha *"
                    className={`w-full rounded-2xl px-4 py-4 pl-12 pr-12 bg-white/5 border placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm ${
                      confirmPassword && confirmPassword !== password ? 'border-red-500/50' : 'border-white/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs pl-1">As senhas não conferem.</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !signupName || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,150,0.3)] hover:shadow-[0_0_40px_rgba(0,200,150,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : '✅ Criar Minha Conta'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-full text-xs text-slate-500 hover:text-cyan-400 font-bold transition-colors"
                >
                  Já tenho conta — Entrar com senha →
                </button>
              </form>

              <button
                onClick={reset}
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
              >
                <ArrowLeft size={12} /> Usar outro email
              </button>
            </MotionDiv>
          )}

          {/* ── Step: Reset Password ── */}
          {step === 'reset' && (
            <MotionDiv
              key="reset"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="mb-5 relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
                  <AquaFeelLogo width="140px" variant="white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Recuperar Senha</h2>
                <p className="text-slate-400 text-sm">
                  Enviaremos um link para <span className="text-yellow-400 font-bold">{email}</span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(240,180,0,0.3)] hover:shadow-[0_0_40px_rgba(240,180,0,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : '📧 Enviar Link de Recuperação'}
                </button>
              </form>

              <button
                onClick={() => setStep('login')}
                className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 font-bold uppercase tracking-wider transition-colors mx-auto"
              >
                <ArrowLeft size={12} /> Voltar ao Login
              </button>
            </MotionDiv>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <MotionDiv
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/10 text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Conta Criada!</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Sua conta foi criada com sucesso para <strong className="text-cyan-400">{email}</strong>.
                <br />Agora faça login com seu email e senha.
              </p>
              <button
                onClick={() => { setStep('login'); setPassword(''); setConfirmPassword(''); }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                🔓 Fazer Login Agora
              </button>
            </MotionDiv>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
