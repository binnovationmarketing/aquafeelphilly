import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
  onSuccess: () => void;
}

const PRIZES = [
  {
    id: 'amazon_gift',
    name: 'Amazon Gift Card $50',
    points: 1500,
    level: 1,
    image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=800',
    emoji: '🎁',
  },
  {
    id: 'dinner',
    name: 'Jantar para Dois',
    points: 2000,
    level: 1,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800',
    emoji: '🍽️',
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch SE',
    points: 3500,
    level: 1,
    image: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&q=80&w=800',
    emoji: '⌚',
  },
  {
    id: 'spa',
    name: 'Spa Day Premium',
    points: 5000,
    level: 2,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    emoji: '💆',
    badge: 'Elite VIP',
  },
  {
    id: 'ipad',
    name: 'iPad Pro',
    points: 7500,
    level: 2,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    emoji: '📱',
    badge: 'Elite VIP',
  },
  {
    id: 'travel',
    name: 'Pacote de Viagem',
    points: 12000,
    level: 2,
    image: 'https://images.unsplash.com/photo-1499591934245-40b55745b905?auto=format&fit=crop&q=80&w=800',
    emoji: '✈️',
    badge: 'Elite VIP',
  },
];

export function ClientRewardsTab({ portalData, onSuccess }: Props) {
  const { points } = portalData;
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const handleRedeem = async (prize: typeof PRIZES[0]) => {
    if (points.points < prize.points) {
      toast.error(`Você precisa de ${prize.points.toLocaleString()} pontos. Você tem ${points.points.toLocaleString()}.`);
      return;
    }
    if (prize.level > points.level) {
      toast.error('Este prêmio é exclusivo para o Nível Elite. Continue indicando!');
      return;
    }

    const confirmed = window.confirm(`Confirmar resgate de "${prize.name}" por ${prize.points.toLocaleString()} pontos?`);
    if (!confirmed) return;

    setRedeeming(prize.id);
    try {
      const { data, error } = await supabase.rpc('redeem_prize_from_portal', {
        p_token: points.referral_token,
        p_prize_name: prize.name,
        p_points_cost: prize.points,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`🎉 Resgate de "${prize.name}" solicitado! Nossa equipe entrará em contato em breve.`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resgatar prêmio.');
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Points balance */}
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5"
      >
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Seus Pontos</p>
          <p className="text-3xl font-black text-cyan-400">{points.points.toLocaleString()} pts</p>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className={points.level >= 2 ? 'text-yellow-400' : 'text-cyan-400'} />
          <span className={`text-sm font-black uppercase tracking-wider ${points.level >= 2 ? 'text-yellow-400' : 'text-cyan-400'}`}>
            Nível {points.level} — {points.level >= 2 ? 'Elite VIP' : 'Embaixador'}
          </span>
        </div>
      </MotionDiv>

      {/* Level sections */}
      {[1, 2].map((levelGroup) => (
        <div key={levelGroup}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
              levelGroup === 2
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              <Star size={11} />
              {levelGroup === 1 ? 'Nível 1 — Embaixador' : 'Nível 2 — Elite VIP'}
            </div>
            {levelGroup === 2 && points.level < 2 && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-bold">
                <Lock size={11} /> Bloqueado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRIZES.filter((p) => p.level === levelGroup).map((prize, i) => {
              const canAfford = points.points >= prize.points;
              const canAccess = points.level >= prize.level;
              const isLocked = !canAccess;
              const isLoading = redeeming === prize.id;

              return (
                <MotionDiv
                  key={prize.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`bg-white/5 border rounded-3xl overflow-hidden group transition-all ${
                    isLocked
                      ? 'border-white/5 opacity-60'
                      : prize.level === 2
                        ? 'border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                        : 'border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,200,200,0.1)]'
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={prize.image}
                      alt={prize.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-[#0a0f1e]/20 to-transparent" />
                    {/* Badge */}
                    {prize.badge && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {prize.badge}
                      </div>
                    )}
                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Lock size={28} className="text-yellow-400 mx-auto mb-1" />
                          <p className="text-yellow-400 text-xs font-black uppercase tracking-wider">Elite Exclusivo</p>
                        </div>
                      </div>
                    )}
                    {/* Emoji */}
                    <div className="absolute bottom-3 left-4 text-3xl">{prize.emoji}</div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="text-base font-black text-white mb-1">{prize.name}</h4>
                    <p className={`text-lg font-black mb-4 ${prize.level === 2 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                      {prize.points.toLocaleString()} pts
                    </p>

                    {!canAfford && !isLocked && (
                      <p className="text-xs text-slate-600 mb-3 font-bold">
                        Faltam {(prize.points - points.points).toLocaleString()} pts
                      </p>
                    )}

                    <button
                      onClick={() => handleRedeem(prize)}
                      disabled={isLocked || isLoading}
                      className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        isLocked
                          ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                          : canAfford
                            ? prize.level === 2
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(0,200,200,0.4)]'
                            : 'bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isLocked ? (
                        <><Lock size={14} /> Bloqueado</>
                      ) : canAfford ? (
                        'Resgatar Prêmio'
                      ) : (
                        'Pontos insuficientes'
                      )}
                    </button>
                  </div>
                </MotionDiv>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
