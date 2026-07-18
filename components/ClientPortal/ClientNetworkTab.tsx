import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertCircle, Copy, Share2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlassCard, PortalKicker, PortalTitle, CountUp, MagneticButton } from './portalKit';

const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: 'Aguardando Contato',
    color: 'text-slate-300',
    dot: 'bg-slate-400',
    icon: <Clock size={14} />,
  },
  SCHEDULED: {
    label: 'Análise Agendada',
    color: 'text-sky-300',
    dot: 'bg-sky-400',
    icon: <Clock size={14} />,
  },
  CONVERTED: {
    label: 'Convertido (Venda)',
    color: 'text-emerald-300',
    dot: 'bg-emerald-400',
    icon: <CheckCircle2 size={14} />,
  },
  HOLD: {
    label: 'Em Espera',
    color: 'text-amber-300',
    dot: 'bg-amber-400',
    icon: <AlertCircle size={14} />,
  },
  LOST: {
    label: 'Não Qualificado',
    color: 'text-red-300',
    dot: 'bg-red-400',
    icon: <XCircle size={14} />,
  },
};

export function ClientNetworkTab({ portalData }: Props) {
  const { referrals = [], points } = portalData;

  const PROD_URL = 'https://aquafeelphilly.com';
  const shortLink = points.referral_slug
    ? `${PROD_URL}/i/${points.referral_slug}`
    : points.referral_token
      ? `${PROD_URL}/invite?ref=${points.referral_token}`
      : null;

  const copyLink = () => {
    if (!shortLink) return;
    navigator.clipboard.writeText(shortLink);
    toast.success('Link copiado! 🔗', { description: shortLink });
  };

  const shareLink = async () => {
    if (!shortLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Convite Aquafeel Philly',
          text: '💧 Eu uso Aquafeel e a água da minha família ficou 100% pura! Quero te indicar para uma análise gratuita.',
          url: shortLink,
        });
      } catch (_) {
        /* user cancelled */
      }
    } else {
      copyLink();
    }
  };

  const converted = referrals.filter((r: any) => r.status === 'CONVERTED').length;
  const scheduled = referrals.filter((r: any) => r.status === 'SCHEDULED').length;

  return (
    <div className="space-y-6">
      {/* SHORT LINK CARD */}
      {points.referral_token && (
        <GlassCard glow="#22D3EE" className="p-6" delay={0}>
          <PortalKicker>Seu Link de Convite</PortalKicker>
          <p className="mt-2 text-xs text-slate-400">
            Compartilhe com amigos e ganhe pontos quando eles agendarem.
          </p>

          <div className="my-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#020617]/60 p-4">
            <Link2 size={16} className="shrink-0 text-cyan-300" />
            <p className="break-all font-mono text-sm font-bold text-cyan-200">{shortLink}</p>
          </div>

          <div className="flex gap-3">
            <MagneticButton onClick={copyLink} strength={0.2}>
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[0_10px_30px_-8px_rgba(34,211,238,0.6)]">
                <Copy size={15} /> Copiar
              </span>
            </MagneticButton>
            <MagneticButton onClick={shareLink} strength={0.2}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-200 backdrop-blur transition-colors hover:bg-white/10">
                <Share2 size={15} /> Compartilhar
              </span>
            </MagneticButton>
          </div>
        </GlassCard>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: referrals.length, accent: '#7DF9FF' },
          { label: 'Convertidos', value: converted, accent: '#34D399' },
          { label: 'Agendados', value: scheduled, accent: '#38BDF8' },
        ].map((stat, i) => (
          <GlassCard key={i} delay={i * 0.08} className="p-4 text-center">
            <p className="font-serif text-3xl font-black" style={{ color: stat.accent }}>
              <CountUp value={stat.value} />
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Legend */}
      <GlassCard hover={false} className="flex flex-wrap gap-4 p-5" delay={0.1}>
        <p className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500">
          Legenda de Status
        </p>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
          </div>
        ))}
      </GlassCard>

      {/* Network list */}
      {referrals.length > 0 ? (
        <GlassCard hover={false} className="overflow-hidden" delay={0.15}>
          <div className="border-b border-white/5 p-5">
            <PortalTitle className="text-lg">Todas as Indicações ({referrals.length})</PortalTitle>
          </div>
          <div className="space-y-3 p-5">
            {referrals.map((ref: any, i: number) => {
              const cfg = STATUS_CONFIG[ref.status] || STATUS_CONFIG['PENDING'];
              const pointsGained =
                ref.status === 'CONVERTED' ? 900 : ref.status !== 'LOST' ? 300 : 0;
              return (
                <MotionDiv
                  key={ref.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.dot} text-xs font-black text-slate-900 shadow-md`}
                  >
                    {ref.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{ref.name}</p>
                    <div
                      className={`mt-0.5 flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </div>
                  </div>
                  {pointsGained > 0 && (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Ganhou</p>
                      <p className="font-serif text-sm font-black text-cyan-300">+{pointsGained}</p>
                    </div>
                  )}
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">Data</p>
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </p>
                  </div>
                </MotionDiv>
              );
            })}
          </div>
        </GlassCard>
      ) : (
        <div className="rounded-3xl border-2 border-dashed border-white/10 p-16 text-center">
          <p className="mb-4 text-5xl">🌱</p>
          <PortalTitle className="mb-2 text-2xl">Sua rede ainda está vazia</PortalTitle>
          <p className="mx-auto max-w-sm text-sm text-slate-400">
            Compartilhe seu link acima e cada indicação aparecerá aqui com acompanhamento em tempo
            real.
          </p>
        </div>
      )}
    </div>
  );
}
