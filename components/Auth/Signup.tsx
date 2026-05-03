import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, ArrowLeft, User, Phone, Briefcase, MapPin, ChevronDown } from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { motion } from 'framer-motion';

interface SignupProps {
  onBack: (message?: string) => void;
}

const MANAGERS: Array<{
  name: string;
  director: string;
  ambassador: string;
  office: string;
  division: string;
}> = [
  { name: 'Carlos Henrique A. Silva', director: 'Jorge Martinez', ambassador: 'Jose Miguel Taramona', office: 'Philadelphia', division: 'Elite' },
];

export const Signup: React.FC<SignupProps> = ({ onBack }) => {
  const initialState = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    managerName: '',
    directorName: '',
    ambassadorName: '',
    office: '',
    division: '',
    analystId: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleManagerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = MANAGERS.find(m => m.name === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        managerName: selected.name,
        directorName: selected.director,
        ambassadorName: selected.ambassador,
        office: selected.office,
        division: selected.division,
      }));
    } else {
      setFormData(prev => ({ ...prev, managerName: e.target.value }));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('analysts')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            analyst_id: formData.analystId,
            manager_name: formData.managerName,
            director_name: formData.directorName,
            ambassador_name: formData.ambassadorName,
            office: formData.office,
            division: formData.division,
            aquafeel_email: formData.email,
            role: 'analyst_jr',
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });

        if (profileError) {
          console.error('Error creating analyst profile:', profileError);
        }
      }

      setSuccess('Conta criada! Faça login para continuar.');
      setFormData(initialState);
      setTimeout(() => onBack('Conta criada! Faça login para continuar.'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020d1a] px-4 relative overflow-hidden text-white py-12">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aqua-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8 bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-white/10 relative z-10"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
             <AquaFeelLogo width="160px" variant="white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
            Join the Team
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Create your analyst profile to access the dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-aqua-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Personal Info</h3>
              
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="firstName"
                  required
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="lastName"
                  required
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="phone"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Aquafeel Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>
            </div>

            {/* Organization Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-aqua-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-1">Organization Info</h3>
              
              <div className="relative group">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="analystId"
                  required
                  placeholder="Analyst ID #"
                  value={formData.analystId}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              {/* Manager dropdown */}
              <div className="relative group">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors z-10" />
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  name="managerName"
                  required
                  value={formData.managerName}
                  onChange={handleManagerSelect}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-8 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-[#020d1a]">Select Manager</option>
                  {MANAGERS.map(m => (
                    <option key={m.name} value={m.name} className="bg-[#020d1a]">{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="directorName"
                  required
                  placeholder="Director Name"
                  value={formData.directorName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="ambassadorName"
                  required
                  placeholder="Ambassador Name"
                  value={formData.ambassadorName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="office"
                  required
                  placeholder="Office Location"
                  value={formData.office}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>

              <div className="relative group">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="division"
                  required
                  placeholder="Division"
                  value={formData.division}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-xs font-bold text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-400 text-xs font-bold text-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 animate-pulse">
              {success}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black uppercase tracking-widest rounded-2xl text-[#020d1a] bg-white hover:bg-aqua-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,174,239,0.4)] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="text-center pt-2">
          <button 
            onClick={() => onBack()}
            className="text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={12} /> Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};
