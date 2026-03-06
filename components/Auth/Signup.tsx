import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, Loader2, ArrowLeft, User, Phone, Briefcase, MapPin } from 'lucide-react';
import AquaFeelLogo from '../AquaFeelLogo';
import { motion } from 'framer-motion';

interface SignupProps {
  onBack: (message?: string) => void;
}

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Sign up with Supabase Auth
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
        // 2. Create Analyst Record in 'analysts' table (or update if exists via trigger, but let's be explicit)
        // Note: We need to make sure the 'analysts' table exists and has these columns.
        // Based on previous steps, we added columns to 'analysts' table.
        
        // We might need to insert into a profile table. 
        // Assuming 'analysts' table is where we store this info.
        // However, usually 'auth.users' handles the login, and we might have a trigger or we insert manually.
        // Let's try to insert/upsert into 'analysts' table linked by email or id.
        
        // Check if we can insert into analysts table directly or if it's linked to auth.users
        // For now, let's assume we can insert/update based on email or user_id if we had one.
        // Since we don't have the user ID available synchronously in all cases (if email confirmation is required),
        // we usually rely on a trigger. 
        
        // BUT, since we want to store extra fields that are NOT in auth.users metadata by default (or we want them in our public table),
        // we should try to insert them.
        
        // Let's use the 'analysts' table.
        // We need to know if the user is already created by a trigger.
        
        // Let's just try to insert into 'analysts' and if it fails (duplicate), we update.
        // Actually, best practice is to use a trigger on auth.users to create the public.users/analysts record,
        // then update it.
        
        // For this MVP, let's assume the trigger might create a basic record, or we create it here.
        // Let's try to upsert.
        
        const { error: profileError } = await supabase
          .from('analysts')
          .upsert({
            id: authData.user.id, // Assuming id matches auth.uid()
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
            aquafeel_email: formData.email, // Using same email for now
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });

        if (profileError) {
           console.error("Error creating analyst profile:", profileError);
           // Don't block signup success if profile fails, but warn.
        }
      }

      setSuccess('Account created! Please check your email to confirm.');
      setFormData(initialState);
      
      setTimeout(() => {
        onBack('Account created! Please check your email to confirm.');
      }, 2000);
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

              <div className="relative group">
                <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-aqua-500 transition-colors" />
                <input
                  name="managerName"
                  required
                  placeholder="Manager Name"
                  value={formData.managerName}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-aqua-500 outline-none text-sm placeholder-slate-500"
                />
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
