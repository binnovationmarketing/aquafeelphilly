import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, ArrowLeft, Chrome, Apple } from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { Signup } from './Signup';
import { toast } from 'sonner';

// Map Supabase error messages to user-friendly text
const friendlyError = (msg: string): string => {
  if (/invalid login credentials/i.test(msg)) return 'Email ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Confirme seu email antes de entrar.';
  if (/too many requests/i.test(msg)) return 'Muitas tentativas. Tente novamente em alguns minutos.';
  if (/user not found/i.test(msg)) return 'Usuário não encontrado.';
  return msg;
};

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'manager'>('login');

  useEffect(() => {
    // Check for errors in the URL hash (e.g. expired recovery links)
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        toast.error(errorDescription.replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login' || mode === 'manager') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login realizado com sucesso!');
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast.success('Link de redefinição enviado para o seu email!');
      }
    } catch (err: any) {
      toast.error(friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard/analyst`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(friendlyError(err.message));
      setLoading(false);
    }
  };


  if (mode === 'signup') {
    return <Signup onBack={(msg) => {
      setMode('login');
      if (msg) toast.success(msg);
    }} />;
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aqua-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <AquaFeelLogo width="180px" variant="white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
            {mode === 'login' ? 'Analyst Portal' : mode === 'manager' ? 'Manager Portal' : 'Reset Password'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {mode === 'login' ? 'Secure access to Aquafeel Solutions Tech' : mode === 'manager' ? 'Restricted Access for Management' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleAuth}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-aqua-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-2xl relative block w-full px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent focus:bg-white/10 transition-all font-medium sm:text-sm"
                  placeholder={mode === 'manager' ? "Manager Email" : "Analyst Email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-aqua-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-2xl relative block w-full px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent focus:bg-white/10 transition-all font-medium sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {mode === 'login' && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setMode('manager')}
                className="text-xs text-slate-500 hover:text-white font-bold transition-colors uppercase tracking-wider"
              >
                Manager Access
              </button>
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-xs text-aqua-400 hover:text-white font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === 'manager' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-400 hover:text-white font-bold transition-colors flex items-center gap-1"
              >
                <ArrowLeft size={12} /> Back to Analyst Login
              </button>
            </div>
          )}



          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-[#020d1a] bg-white hover:bg-aqua-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,174,239,0.4)] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : (mode === 'login' ? 'Access Dashboard' : mode === 'manager' ? 'Secure Login' : 'Send Reset Link')}
            </button>
          </div>
        </form>

        <div className="text-center pt-2 space-y-4">
          {mode === 'reset' ? (
            <button
              onClick={() => setMode('login')}
              className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft size={12} /> Back to Login
            </button>
          ) : (
            <>
              {/* Social Login Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">or continue with</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all hover:border-white/20 active:scale-[0.98]"
              >
                <Chrome size={18} className="text-blue-400" />
                Continue with Google
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all hover:border-white/20 active:scale-[0.98]"
              >
                <Apple size={18} className="text-slate-300" />
                Continue with Apple
              </button>

              <button
                onClick={() => setMode('signup')}
                className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 mx-auto pt-2"
              >
                Don&apos;t have an account? <span className="text-aqua-400 underline decoration-2 underline-offset-2 ml-1">Sign up</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 text-center w-full">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Aquafeel Solutions Tech © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
