import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Phone, MapPin, Mail, Loader2, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
  onSuccess: () => void;
}

export function ClientReferralTab({ portalData, onSuccess }: Props) {
  const { points } = portalData;
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error('Nome e telefone são obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      if (!points.referral_token) {
        toast.error('Token de indicação não encontrado. Por favor, faça login novamente.');
        return;
      }

      const { data, error } = await supabase.rpc('add_referral_from_portal', {
        p_token: points.referral_token,
        p_name: form.name,
        p_phone: form.phone,
        p_email: form.email,
        p_address: form.address,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('🎉 Indicação cadastrada! +300 pontos adicionados à sua conta!');
      setForm({ name: '', phone: '', email: '', address: '' });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar indicação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Points preview banner */}
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5"
      >
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Seus pontos atuais</p>
          <p className="text-3xl font-black text-cyan-400">{points.points.toLocaleString()} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Você ganhará</p>
          <p className="text-3xl font-black text-emerald-400">+300 pts</p>
          <p className="text-[10px] text-slate-600 mt-0.5">ao cadastrar esta indicação</p>
        </div>
      </MotionDiv>

      {/* Form */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
      >
        <h2 className="text-xl font-black text-white mb-2">Cadastrar Nova Indicação</h2>
        <p className="text-slate-500 text-sm mb-6">Preencha os dados da família ou amigo que você quer indicar. Nosso consultor entrará em contato com eles!</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <User size={17} />
            </div>
            <input
              required
              type="text"
              placeholder="Nome completo da família *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Phone */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Phone size={17} />
            </div>
            <input
              required
              type="tel"
              placeholder="Telefone de contato * (ex: 215-555-0000)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Email (optional) */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <Mail size={17} />
            </div>
            <input
              type="email"
              placeholder="Email (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {/* Address */}
          <div className="relative group">
            <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
              <MapPin size={17} />
            </div>
            <textarea
              placeholder="Endereço residencial (opcional)"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.2)] hover:shadow-[0_0_40px_rgba(0,200,200,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Gift size={18} />
                Enviar Indicação (+300 Pontos)
              </>
            )}
          </button>
        </form>
      </MotionDiv>

      {/* Info box */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/3 border border-white/5 rounded-2xl p-5 space-y-3"
      >
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Como funciona:</p>
        {[
          { emoji: '1️⃣', text: 'Você indica uma família com nome e telefone.' },
          { emoji: '2️⃣', text: 'Nosso consultor entra em contato e agenda uma análise de água gratuita.' },
          { emoji: '3️⃣', text: 'Você ganha +300 pontos quando a análise for realizada.' },
          { emoji: '4️⃣', text: 'Se fechar contrato, você ganha +900 pontos adicionais! 🎉' },
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{step.emoji}</span>
            <p className="text-slate-400 text-sm">{step.text}</p>
          </div>
        ))}
      </MotionDiv>
    </div>
  );
}
