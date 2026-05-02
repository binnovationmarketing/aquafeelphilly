import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Star, Droplets, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react';

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
  onNavigate: (tab: any) => void;
}

const POINT_RULES = [
  { label: 'Venda Convertida', points: '+900', icon: '🏆', color: 'text-emerald-400' },
  { label: 'Indicação Registrada', points: '+300', icon: '👨‍👩‍👧', color: 'text-cyan-400' },
  { label: 'Análise de Água Feita', points: '+100', icon: '💧', color: 'text-blue-400' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Aguardando', color: 'text-slate-400 bg-slate-500/20', icon: <Clock size={13} /> },
  SCHEDULED: { label: 'Agendado',   color: 'text-blue-400 bg-blue-500/20',   icon: <Clock size={13} /> },
  CONVERTED: { label: 'Convertido', color: 'text-emerald-400 bg-emerald-500/20', icon: <CheckCircle2 size={13} /> },
  LOST:      { label: 'Não Qualificado', color: 'text-red-400 bg-red-500/20', icon: <XCircle size={13} /> },
  HOLD:      { label: 'Em Espera', color: 'text-yellow-400 bg-yellow-500/20', icon: <Clock size={13} /> },
};

export function ClientDashboardTab({ portalData, onNavigate }: Props) {
  const { client, points, referrals } = portalData;
  const levelLabel = points.level >= 2 ? 'Elite VIP' : 'Embaixador';
  const nextLevelTotal = 6;
  const progress = Math.min(100, (points.total_referrals / nextLevelTotal) * 100);

  const recentRefs = (referrals || []).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* === KPI CARDS === */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'INDICAÇÕES FEITAS',
            value: points.total_referrals,
            suffix: 'famílias',
            icon: <Users size={22} />,
            color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
            iconColor: 'text-blue-400',
          },
          {
            label: 'VENDAS CONVERTIDAS',
            value: points.converted_referrals,
            suffix: 'vendas',
            icon: <TrendingUp size={22} />,
            color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
            iconColor: 'text-emerald-400',
          },
          {
            label: 'PONTOS ACUMULADOS',
            value: points.points.toLocaleString(),
            suffix: 'pts',
            icon: <Droplets size={22} />,
            color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
            iconColor: 'text-cyan-400',
          },
        ].map((kpi, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${kpi.color} border rounded-2xl p-6`}
          >
            <div className={`mb-3 ${kpi.iconColor}`}>{kpi.icon}</div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{kpi.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black text-white">{kpi.value}</h3>
              <span className="text-slate-500 text-xs font-bold">{kpi.suffix}</span>
            </div>
          </MotionDiv>
        ))}
      </div>

      {/* === LEVEL PROGRESS + RULES GRID === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level Progress */}
        <MotionDiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Seu Nível Atual</p>
              <div className="flex items-center gap-2 mt-1">
                <Star size={18} className={points.level >= 2 ? 'text-yellow-400' : 'text-cyan-400'} />
                <h3 className="text-xl font-black text-white">{levelLabel}</h3>
              </div>
            </div>
            <div className={`text-4xl font-black ${points.level >= 2 ? 'text-yellow-400' : 'text-cyan-400'}`}>
              {points.level}
            </div>
          </div>

          {points.level < 2 && (
            <>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                <span>{points.total_referrals} indicações</span>
                <span>{nextLevelTotal} para Elite</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <MotionDiv
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                />
              </div>
              <p className="text-slate-600 text-xs mt-3">
                Faltam <strong className="text-cyan-400">{Math.max(0, nextLevelTotal - points.total_referrals)} indicações</strong> para desbloquear o Nível Elite e prêmios exclusivos!
              </p>
            </>
          )}

          {points.level >= 2 && (
            <p className="text-yellow-400/80 text-sm font-bold mt-2">
              🏆 Parabéns! Você atingiu o nível máximo. Continue indicando para acumular ainda mais pontos!
            </p>
          )}
        </MotionDiv>

        {/* Point Rules */}
        <MotionDiv
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Como Ganhar Pontos</p>
          <div className="space-y-4">
            {POINT_RULES.map((rule, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rule.icon}</span>
                  <span className="text-sm font-semibold text-slate-300">{rule.label}</span>
                </div>
                <span className={`text-lg font-black ${rule.color}`}>{rule.points}</span>
              </div>
            ))}
          </div>
        </MotionDiv>
      </div>

      {/* === RECENT REFERRALS === */}
      {recentRefs.length > 0 && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <p className="font-black text-white text-base uppercase tracking-tight">Indicações Recentes</p>
            <button
              onClick={() => onNavigate('network')}
              className="flex items-center gap-1 text-xs font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider transition-colors"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {recentRefs.map((ref: any) => {
              const st = STATUS_MAP[ref.status] || STATUS_MAP['PENDING'];
              return (
                <div key={ref.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-xs font-black text-slate-300">
                      {ref.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{ref.name}</p>
                      <p className="text-xs text-slate-600">{new Date(ref.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${st.color}`}>
                    {st.icon} {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </MotionDiv>
      )}

      {/* === CTA EMPTY STATE === */}
      {recentRefs.length === 0 && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center"
        >
          <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
          <h3 className="text-xl font-black text-white mb-2">Faça sua primeira indicação!</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Indique famílias e amigos que precisam de água pura. Cada indicação vale +300 pontos!</p>
          <button
            onClick={() => onNavigate('referral')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-full font-black text-sm shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95"
          >
            + Indicar agora
          </button>
        </MotionDiv>
      )}
    </div>
  );
}
