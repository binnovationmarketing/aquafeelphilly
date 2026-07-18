import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Droplets,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Star,
} from 'lucide-react';
import {
  GlassCard,
  StatTile,
  PortalTitle,
  PortalKicker,
  LevelMeter,
  MagneticButton,
  Reveal,
} from './portalKit';

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
  onNavigate: (tab: any) => void;
}

const POINT_RULES = [
  { label: 'Venda Convertida', points: '+900', icon: '🏆', color: 'text-emerald-300' },
  { label: 'Indicação Registrada', points: '+300', icon: '👨‍👩‍👧', color: 'text-cyan-300' },
  { label: 'Análise de Água Feita', points: '+100', icon: '💧', color: 'text-sky-300' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Aguardando',
    color: 'text-slate-300 bg-slate-500/20',
    icon: <Clock size={13} />,
  },
  SCHEDULED: { label: 'Agendado', color: 'text-sky-300 bg-sky-500/20', icon: <Clock size={13} /> },
  CONVERTED: {
    label: 'Convertido',
    color: 'text-emerald-300 bg-emerald-500/20',
    icon: <CheckCircle2 size={13} />,
  },
  LOST: {
    label: 'Não Qualificado',
    color: 'text-red-300 bg-red-500/20',
    icon: <XCircle size={13} />,
  },
  HOLD: { label: 'Em Espera', color: 'text-amber-300 bg-amber-500/20', icon: <Clock size={13} /> },
};

export function ClientDashboardTab({ portalData, onNavigate }: Props) {
  const { points, referrals } = portalData;
  const levelLabel = points.level >= 2 ? 'Elite VIP' : 'Embaixador';
  const isElite = points.level >= 2;
  const nextLevelTotal = 6;
  const progress = Math.min(100, (points.total_referrals / nextLevelTotal) * 100);
  const accent = isElite ? '#FBBF24' : '#22D3EE';

  const recentRefs = (referrals || []).slice(0, 4);

  return (
    <div className="space-y-8">
      {/* === KPI TILES === */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Indicações Feitas"
          value={points.total_referrals}
          suffix="famílias"
          icon={<Users size={20} />}
          accent="#38BDF8"
          delay={0}
        />
        <StatTile
          label="Vendas Convertidas"
          value={points.converted_referrals}
          suffix="vendas"
          icon={<TrendingUp size={20} />}
          accent="#34D399"
          delay={0.08}
        />
        <StatTile
          label="Pontos Acumulados"
          value={points.points}
          suffix="pts"
          icon={<Droplets size={20} />}
          accent="#22D3EE"
          delay={0.16}
        />
      </div>

      {/* === LEVEL PROGRESS + RULES === */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard glow={accent} className="p-6" delay={0.1}>
          <div className="mb-5 flex items-start justify-between">
            <div>
              <PortalKicker>Seu Nível Atual</PortalKicker>
              <div className="mt-2 flex items-center gap-2">
                <Star size={18} className={isElite ? 'text-amber-300' : 'text-cyan-300'} />
                <PortalTitle className="text-2xl">{levelLabel}</PortalTitle>
              </div>
            </div>
            <div
              className={`font-serif text-5xl font-black ${isElite ? 'text-amber-300' : 'text-cyan-200'}`}
            >
              {points.level}
            </div>
          </div>

          {!isElite ? (
            <>
              <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                <span>{points.total_referrals} indicações</span>
                <span>{nextLevelTotal} para Elite</span>
              </div>
              <LevelMeter progress={progress} />
              <p className="mt-3 text-xs text-slate-400">
                Faltam{' '}
                <strong className="text-cyan-300">
                  {Math.max(0, nextLevelTotal - points.total_referrals)} indicações
                </strong>{' '}
                para desbloquear o Nível Elite e prêmios exclusivos.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm font-bold text-amber-300/90">
              🏆 Parabéns! Você atingiu o nível máximo. Continue indicando para acumular ainda mais
              pontos.
            </p>
          )}
        </GlassCard>

        <GlassCard className="p-6" delay={0.18}>
          <PortalKicker>Como Ganhar Pontos</PortalKicker>
          <div className="mt-4 space-y-1">
            {POINT_RULES.map((rule, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{rule.icon}</span>
                  <span className="text-sm font-semibold text-slate-200">{rule.label}</span>
                </div>
                <span className={`font-serif text-lg font-black ${rule.color}`}>{rule.points}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* === RECENT REFERRALS === */}
      {recentRefs.length > 0 && (
        <GlassCard hover={false} className="overflow-hidden" delay={0.2}>
          <div className="flex items-center justify-between border-b border-white/5 p-6">
            <PortalTitle className="text-lg">Indicações Recentes</PortalTitle>
            <button
              onClick={() => onNavigate('network')}
              className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-cyan-300 transition-colors hover:text-cyan-200"
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-xs font-black text-slate-200">
                      {ref.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{ref.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${st.color}`}
                  >
                    {st.icon} {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* === EMPTY STATE === */}
      {recentRefs.length === 0 && (
        <Reveal>
          <div className="rounded-3xl border-2 border-dashed border-white/10 p-12 text-center">
            <div className="mb-4 text-5xl">👨‍👩‍👧‍👦</div>
            <PortalTitle className="mb-2 text-2xl">Faça sua primeira indicação</PortalTitle>
            <p className="mx-auto mb-6 max-w-sm text-sm text-slate-400">
              Indique famílias e amigos que precisam de água pura. Cada indicação vale +300 pontos.
            </p>
            <MagneticButton onClick={() => onNavigate('referral')}>
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-3 text-sm font-black text-slate-900 shadow-[0_10px_40px_-8px_rgba(34,211,238,0.7)]">
                + Indicar agora
              </span>
            </MagneticButton>
          </div>
        </Reveal>
      )}
    </div>
  );
}
