import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplet, ShieldCheck, Heart, ArrowRight, Calendar as CalendarIcon, Clock, CheckCircle, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function InviteLandingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('ref'); // The referrer's token

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadData, setLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '' // ZIP code or address
  });
  
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: ''
  });

  const availableTimes = ['09:00 AM', '10:30 AM', '01:00 PM', '03:00 PM', '05:30 PM', '07:00 PM'];

  // Calculate next 7 days for the calendar
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      dateStr: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    };
  });

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.phone) return;
    
    // Move to schedule step
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!scheduleData.date || !scheduleData.time) {
      toast.error('Por favor, selecione uma data e horário.');
      return;
    }

    setIsSubmitting(true);
    try {
      const observations = `Agendado para: ${scheduleData.date} às ${scheduleData.time}`;

      if (token && token.length > 10) {
        // Valid token, use RPC (assuming token is UUID or valid length)
        const { data: result, error } = await supabase.rpc('add_referral_from_portal', {
          p_token: token,
          p_name: leadData.name,
          p_phone: leadData.phone,
          p_email: leadData.email,
          p_address: leadData.address + ' | ' + observations
        });

        if (error) throw error;
        if (result && result.error) throw new Error(result.error);
      } else {
        // No token, just insert as a loose lead in clients table
        const { error } = await supabase.from('clients').insert({
           name: leadData.name,
           phone: leadData.phone,
           email: leadData.email,
           zip_code: leadData.address,
           status: 'LEAD',
           observations: [observations],
           created_at: new Date().toISOString()
        });
        if (error) throw error;
      }

      setStep(3); // Success step
    } catch (err: any) {
      toast.error('Erro ao agendar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020d1a] text-slate-50 font-sans overflow-x-hidden selection:bg-[#11caa0] selection:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#005088]/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[#11caa0]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Header */}
      <nav className="relative z-10 p-6 flex justify-between items-center max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#005088] to-[#11caa0] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#11caa0]/20">AQ</div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            Aquafeel <span className="text-[#11caa0]">Philly</span>
          </span>
        </motion.div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Copywriting Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#11caa0] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#11caa0]"></span>
            </span>
            Convite VIP Exclusivo
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black leading-tight" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            Água Pura e Segura na sua casa por menos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#11caa0] to-emerald-400">$5 ao dia.</span>
          </h1>
          
          <p className="text-xl text-slate-400 leading-relaxed">
            Seu amigo(a) transformou a saúde da família dele com a tecnologia Aquafeel, e enviou este convite para você receber uma <strong>Análise de Água Gratuita</strong> na sua casa.
          </p>

          <div className="space-y-4 pt-4">
            {[
              { icon: Droplet, title: "Água 100% Pura", desc: "Remoção de chumbo, cloro e toxinas invisíveis." },
              { icon: Heart, title: "Saúde para a Família", desc: "Pele mais macia, cabelos sedosos e proteção real." },
              { icon: ShieldCheck, title: "Garantia Vitalícia", desc: "Tecnologia de ponta com suporte premium contínuo." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#005088]/30 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="text-[#11caa0]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Lead Capture / Booking Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          {/* Glowing border effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-[#005088] to-[#11caa0] rounded-[2rem] blur opacity-30 animate-pulse"></div>
          
          <div className="relative bg-[#06162a] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Capture Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold mb-2">Agende sua Análise Grátis</h2>
                    <p className="text-slate-400 text-sm">Preencha seus dados para validarmos seu convite VIP.</p>
                  </div>

                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input required type="text" value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} className="w-full bg-[#0a213f] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#11caa0] focus:ring-1 focus:ring-[#11caa0] transition-all" placeholder="Seu nome" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input required type="tel" value={leadData.phone} onChange={e => setLeadData({...leadData, phone: e.target.value})} className="w-full bg-[#0a213f] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#11caa0] focus:ring-1 focus:ring-[#11caa0] transition-all" placeholder="(000) 000-0000" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Zip Code / Endereço</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input required type="text" value={leadData.address} onChange={e => setLeadData({...leadData, address: e.target.value})} className="w-full bg-[#0a213f] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#11caa0] focus:ring-1 focus:ring-[#11caa0] transition-all" placeholder="Insira seu código postal" />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-[#005088] to-[#11caa0] text-white font-bold py-4 rounded-xl mt-4 shadow-lg shadow-[#11caa0]/20 hover:shadow-[#11caa0]/40 transition-all flex items-center justify-center gap-2 group">
                      Continuar para Agendamento
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: Booking Calendar */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#11caa0]/20 text-[#11caa0] rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon size={24} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Escolha o Horário</h2>
                    <p className="text-slate-400 text-sm">Selecione quando você prefere receber nosso especialista.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">1. Selecione o Dia</label>
                      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {nextDays.map((day) => (
                          <button
                            key={day.dateStr}
                            onClick={() => setScheduleData({...scheduleData, date: day.dateStr})}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl border font-bold transition-all ${scheduleData.date === day.dateStr ? 'bg-[#11caa0] border-[#11caa0] text-slate-900 shadow-lg shadow-[#11caa0]/30' : 'bg-[#0a213f] border-white/10 text-slate-300 hover:bg-white/10'}`}
                          >
                            <span className="block text-xs opacity-80">{day.display.split(',')[0]}</span>
                            <span className="block text-lg">{day.display.split(' ')[1]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {scheduleData.date && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">2. Selecione o Horário</label>
                          <div className="grid grid-cols-3 gap-2">
                            {availableTimes.map((time) => (
                              <button
                                key={time}
                                onClick={() => setScheduleData({...scheduleData, time})}
                                className={`py-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-1 ${scheduleData.time === time ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-[#0a213f] border-white/10 text-slate-300 hover:bg-white/10'}`}
                              >
                                <Clock size={14} /> {time}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-4 flex gap-3">
                      <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors">
                        Voltar
                      </button>
                      <button 
                        onClick={handleFinalSubmit}
                        disabled={!scheduleData.date || !scheduleData.time || isSubmitting}
                        className="flex-1 bg-gradient-to-r from-[#005088] to-[#11caa0] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#11caa0]/20 hover:shadow-[#11caa0]/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirmar Agendamento'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Success */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-6"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                  
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Agendamento Confirmado!</h2>
                    <p className="text-slate-400">Um especialista da Aquafeel entrará em contato em breve para confirmar sua visita.</p>
                  </div>

                  <div className="bg-[#0a213f] border border-white/10 rounded-2xl p-6 text-left">
                    <h3 className="font-bold text-lg mb-4 text-[#11caa0]">Detalhes da sua visita:</h3>
                    <div className="space-y-3 text-sm">
                      <p className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Nome:</span> <span className="font-bold">{leadData.name}</span></p>
                      <p className="flex justify-between border-b border-white/5 pb-2"><span className="text-slate-400">Data:</span> <span className="font-bold">{scheduleData.date}</span></p>
                      <p className="flex justify-between"><span className="text-slate-400">Horário:</span> <span className="font-bold">{scheduleData.time}</span></p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
