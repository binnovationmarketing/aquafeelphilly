import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Lock, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard, PortalKicker, CountUp } from './portalKit';

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
    image:
      'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=800',
    emoji: '🎁',
  },
  {
    id: 'dinner',
    name: 'Jantar para Dois',
    points: 2000,
    level: 1,
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800',
    emoji: '🍽️',
  },
  {
    id: 'apple_watch',
    name: 'Apple Watch SE',
    points: 3500,
    level: 1,
    image:
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&q=80&w=800',
    emoji: '⌚',
  },
  {
    id: 'spa',
    name: 'Spa Day Premium',
    points: 5000,
    level: 2,
    image:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    emoji: '💆',
    badge: 'Elite VIP',
  },
  {
    id: 'ipad',
    name: 'iPad Pro',
    points: 7500,
    level: 2,
    image:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800',
    emoji: '📱',
    badge: 'Elite VIP',
  },
  {
    id: 'travel',
    name: 'Pacote de Viagem',
    points: 12000,
    level: 2,
    image:
      'https://images.unsplash.com/photo-1499591934245-40b55745b905?auto=format&fit=crop&q=80&w=800',
    emoji: '✈️',
    badge: 'Elite VIP',
  },
];

export function ClientRewardsTab({ portalData, onSuccess }: Props) {
  const { points } = portalData;
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const isElite = points.level >= 2;

  const handleRedeem = async (prize: (typeof PRIZES)[0]) => {
    if (points.points < prize.points) {
      toast.error(
        `Você precisa de ${prize.points.toLocaleString()} pontos. Você tem ${points.points.toLocaleString()}.`
      );
      return;
    }
    if (prize.level > points.level) {
      toast.error('Este prêmio é exclusivo para o Nível Elite. Continue indicando!');
      return;
    }
    if (!points.referral_token) {
      toast.error('Token de conta não encontrado. Recarregue a página e tente novamente.');
      return;
    }
    const confirmed = window.confirm(
      `Confirmar resgate de "${prize.name}" por ${prize.points.toLocaleString()} pontos?`
    );
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
      toast.success(
        `🎉 Resgate de "${prize.name}" solicitado! Nossa equipe entrará em contato em breve.`
      );
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
      <GlassCard
        glow={isElite ? '#FBBF24' : '#22D3EE'}
        className="flex items-center justify-between p-6"
        delay={0}
      >
        <div>
          <PortalKicker>Seus Pontos</PortalKicker>
          <p className="mt-1 font-serif text-4xl font-black text-cyan-200">
            <CountUp value={points.points} /> <span className="text-lg text-slate-500">pts</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} className={isElite ? 'text-amber-300' : 'text-cyan-300'} />
          <span
            className={`text-sm font-black uppercase tracking-wider ${isElite ? 'text-amber-300' : 'text-cyan-300'}`}
          >
            Nível {points.level} — {isElite ? 'Elite VIP' : 'Embaixador'}
          </span>
        </div>
      </GlassCard>

      {/* Level sections */}
      {[1, 2].map((levelGroup) => (
        <div key={levelGroup}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest ${
                levelGroup === 2
                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                  : 'border-cyan-300/20 bg-cyan-400/10 text-cyan-200'
              }`}
            >
              <Star size={11} />
              {levelGroup === 1 ? 'Nível 1 — Embaixador' : 'Nível 2 — Elite VIP'}
            </div>
            {levelGroup === 2 && !isElite && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500/80">
                <Lock size={11} /> Bloqueado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRIZES.filter((p) => p.level === levelGroup).map((prize, i) => {
              const canAfford = points.points >= prize.points;
              const isLocked = points.level < prize.level;
              const isLoading = redeeming === prize.id;

              return (
                <MotionDiv
                  key={prize.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`group overflow-hidden rounded-3xl border bg-white/[0.04] backdrop-blur-xl transition-all ${
                    isLocked
                      ? 'border-white/5 opacity-60'
                      : prize.level === 2
                        ? 'border-amber-400/25 hover:border-amber-400/50 hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.3)]'
                        : 'border-white/10 hover:border-cyan-300/40 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.35)]'
                  }`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={prize.image}
                      alt={prize.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/30 to-transparent" />
                    {prize.badge && (
                      <div className="absolute right-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900">
                        {prize.badge}
                      </div>
                    )}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="text-center">
                          <Lock size={28} className="mx-auto mb-1 text-amber-300" />
                          <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                            Elite Exclusivo
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-4 text-3xl drop-shadow-lg">
                      {prize.emoji}
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="mb-1 font-serif text-lg font-black text-white">{prize.name}</h4>
                    <p
                      className={`mb-4 font-serif text-lg font-black ${prize.level === 2 ? 'text-amber-300' : 'text-cyan-300'}`}
                    >
                      {prize.points.toLocaleString()} pts
                    </p>

                    {!canAfford && !isLocked && (
                      <p className="mb-3 text-xs font-bold text-slate-500">
                        Faltam {(prize.points - points.points).toLocaleString()} pts
                      </p>
                    )}

                    <button
                      onClick={() => handleRedeem(prize)}
                      disabled={isLocked || isLoading}
                      className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isLocked
                          ? 'cursor-not-allowed border border-white/5 bg-white/5 text-slate-600'
                          : canAfford
                            ? prize.level === 2
                              ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-slate-900 shadow-lg hover:from-amber-300 hover:to-amber-200'
                              : 'bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-900 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.6)]'
                            : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isLocked ? (
                        <>
                          <Lock size={14} /> Bloqueado
                        </>
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
