import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { motion } from 'framer-motion';

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      setSuccess(true);
      // Redirect to dashboard after a delay
      setTimeout(() => {
        window.location.href = '/dashboard/analyst';
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aqua-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8 bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
             <AquaFeelLogo width="180px" variant="white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
            Reset Password
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Create a new secure password for your account
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 py-8">
            <div className="flex justify-center text-emerald-400">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-xl font-bold text-white">Password Updated!</h3>
            <p className="text-slate-400 text-sm">
              Your password has been changed successfully. Redirecting you to the dashboard...
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="sr-only">New Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-aqua-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="appearance-none rounded-2xl relative block w-full px-4 py-4 pl-12 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent focus:bg-white/10 transition-all font-medium sm:text-sm"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-[#020d1a] bg-white hover:bg-aqua-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,174,239,0.4)] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
      
      <div className="absolute bottom-6 text-center w-full">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Aquos Tech - Carlos Henrique Silva &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
