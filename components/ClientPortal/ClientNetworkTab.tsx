import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertCircle, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const MotionDiv = motion.div as any;

interface Props {
  portalData: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Aguardando Contato', color: 'text-slate-400', dot: 'bg-slate-400', icon: <Clock size={14} /> },
  SCHEDULED: { label: 'Análise Agendada',   color: 'text-blue-400',  dot: 'bg-blue-400',  icon: <Clock size={14} /> },
  CONVERTED: { label: 'Convertido (Venda)', color: 'text-emerald-400', dot: 'bg-emerald-400', icon: <CheckCircle2 size={14} /> },
  HOLD:      { label: 'Em Espera',          color: 'text-yellow-400', dot: 'bg-yellow-400', icon: <AlertCircle size={14} /> },
  LOST:      { label: 'Não Qualificado',    color: 'text-red-400',   dot: 'bg-red-400',   icon: <XCircle size={14} /> },
};

export function ClientNetworkTab({ portalData }: Props) {
  const { referrals = [], points } = portalData;

  // Build short link — prefer slug, fallback to UUID token, guard null
  const shortLink = points.referral_slug
    ? `${window.location.origin}/i/${points.referral_slug}`
    : points.referral_token
      ? `${window.location.origin}/invite?ref=${points.referral_token}`
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
      } catch (_) { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  return (
    <div className="space-y-6">
      {/* SHORT LINK CARD — top priority */}
      {points.referral_token && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-2xl p-6"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1">Seu Link de Convite Personalizado</p>
          <p className="text-slate-400 text-xs mb-4">Compartilhe com amigos e ganhe pontos quando eles agendarem!</p>

          <div className="bg-[#06162a] border border-white/10 rounded-xl p-4 mb-4">
            <p className="text-cyan-400 font-mono text-sm font-bold break-all">{shortLink}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 text-sm font-black uppercase tracking-wider transition-colors"
            >
              <Copy size={15} /> Copiar Link
            </button>
            <button
              onClick={shareLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-black uppercase tracking-wider transition-colors"
            >
              <Share2 size={15} /> Compartilhar
            </button>
          </div>
        </MotionDiv>
      )}

      {/* Legend */}
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-3 bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <p className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Legenda de Status:</p>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
          </div>
        ))}
      </MotionDiv>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: referrals.length, color: 'text-white' },
          { label: 'Convertidos', value: referrals.filter((r: any) => r.status === 'CONVERTED').length, color: 'text-emerald-400' },
          { label: 'Agendados', value: referrals.filter((r: any) => r.status === 'SCHEDULED').length, color: 'text-blue-400' },
        ].map((stat, i) => (
          <MotionDiv
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center"
          >
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mt-0.5">{stat.label}</p>
          </MotionDiv>
        ))}
      </div>

      {/* Network list */}
      {referrals.length > 0 ? (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          <div className="p-5 border-b border-white/5">
            <h3 className="font-black text-white text-base uppercase tracking-tight">Todas as Indicações ({referrals.length})</h3>
          </div>

          <div className="p-5 space-y-3">
            {referrals.map((ref: any, i: number) => {
              const cfg = STATUS_CONFIG[ref.status] || STATUS_CONFIG['PENDING'];
              const pointsGained = ref.status === 'CONVERTED' ? 900 : ref.status !== 'LOST' ? 300 : 0;

              return (
                <MotionDiv
                  key={ref.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-xl p-4 hover:bg-white/6 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-full ${cfg.dot} flex items-center justify-center text-white shrink-0 text-xs font-black shadow-md`}>
                    {ref.name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{ref.name}</p>
                    <div className={`flex items-center gap-1.5 text-xs font-bold mt-0.5 ${cfg.color}`}>
                      {cfg.icon}
                      {cfg.label}
                    </div>
                  </div>

                  {pointsGained > 0 && (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-600 uppercase tracking-wider">Ganhou</p>
                      <p className="text-sm font-black text-cyan-400">+{pointsGained}</p>
                    </div>
                  )}

                  <div className="shrink-0 text-right hidden sm:block">
                    <p className="text-[10px] text-slate-700 uppercase tracking-wider">Data</p>
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </MotionDiv>
              );
            })}
          </div>
        </MotionDiv>
      ) : (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center"
        >
          <p className="text-5xl mb-4">🌱</p>
          <h3 className="text-xl font-black text-white mb-2">Sua rede ainda está vazia</h3>
          <p className="text-slate-500 text-sm">Compartilhe seu link acima e cada indicação aparecerá aqui com acompanhamento em tempo real.</p>
        </MotionDiv>
      )}
    </div>
  );
}
