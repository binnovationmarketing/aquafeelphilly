import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Creates a lock-free Supabase client that uses the recovery token from the
 * URL hash (#access_token=...) WITHOUT acquiring any Web Lock.
 *
 * The main `supabase` client uses persistSession:true + Web Lock, which hangs
 * when multiple tabs/sessions are open. For password recovery we only need a
 * one-shot auth call — no lock needed.
 */
function createRecoveryClient(accessToken: string) {
  return createClient(
    supabaseUrl ?? 'https://placeholder.supabase.co',
    supabaseAnonKey ?? 'placeholder',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}

export const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);

  // Parse recovery tokens from URL hash on mount.
  // Supabase recovery link format: /recovery#access_token=XXX&refresh_token=YYY&type=recovery
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));
    const token   = hash.get('access_token');
    const refresh = hash.get('refresh_token');
    const type    = hash.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
      if (refresh) setRefreshToken(refresh);
    } else {
      setTokenError(true);
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) { setError('Link de recuperação inválido ou expirado.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não conferem.'); return; }

    setLoading(true);
    setError(null);
    try {
      const recoveryClient = createRecoveryClient(accessToken);

      // Establish a real session on the client so updateUser has auth context.
      // setSession requires both tokens; use empty string fallback if only access_token available.
      if (refreshToken) {
        await recoveryClient.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      const { error: updateError } = await recoveryClient.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      window.history.replaceState(null, '', window.location.pathname);

      // Auto-redirect to login after success
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-5">
            <AquaFeelLogo width="160px" variant="white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tight">
            Nova Senha
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Crie uma nova senha segura para sua conta
          </p>
        </div>

        {/* Token error state */}
        {tokenError && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-amber-400">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-lg font-bold text-white">Link Expirado</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Este link de recuperação já foi usado ou expirou. Solicite um novo link.
            </p>
            <button
              onClick={() => navigate('/client-login')}
              className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition"
            >
              Voltar ao Login
            </button>
          </div>
        )}

        {/* Success state */}
        {!tokenError && success && (
          <div className="text-center space-y-4 py-4">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-white">Senha Atualizada!</h3>
            <p className="text-slate-400 text-sm">
              Redirecionando para o login em instantes...
            </p>
          </div>
        )}

        {/* Form */}
        {!tokenError && !success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* New password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full rounded-2xl px-4 py-4 pl-12 pr-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                className={`w-full rounded-2xl px-4 py-4 pl-12 pr-12 bg-white/5 border placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white/10 transition-all font-medium text-sm ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-500/50'
                    : 'border-white/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-red-400 text-xs pl-1">As senhas não conferem.</p>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_40px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : '🔐 Salvar Nova Senha'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
