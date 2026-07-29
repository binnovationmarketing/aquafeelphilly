import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Biohazard, FlaskConical, Bug, Droplet, Zap, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface ContaminantTruthsProps {
  lang: Language;
}

/** Illustration-first: animated contaminant "molecules" instead of paragraphs. */
const CONTAMINANTS: {
  sym: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  risk: number; // 0..100 danger bar
}[] = [
  { sym: 'Pb', name: 'Chumbo', icon: <Zap size={18} />, color: '#EF4444', risk: 90 },
  { sym: 'Cl', name: 'Cloro', icon: <FlaskConical size={18} />, color: '#F59E0B', risk: 75 },
  { sym: 'PFAS', name: 'Eternos', icon: <Biohazard size={18} />, color: '#A855F7', risk: 95 },
  { sym: 'TTHM', name: 'Trihalometanos', icon: <Droplet size={18} />, color: '#FB923C', risk: 70 },
  { sym: '🦠', name: 'Bactérias', icon: <Bug size={18} />, color: '#84CC16', risk: 65 },
];

function Molecule({ c, i }: { c: (typeof CONTAMINANTS)[0]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ delay: i * 0.1, type: 'spring', damping: 16 }}
      className="flex flex-col items-center gap-3"
    >
      <motion.div
        className="relative flex h-20 w-20 items-center justify-center rounded-full text-sm font-black text-white"
        style={{
          background: `radial-gradient(35% 35% at 35% 30%, #fff2, ${c.color} 55%, #1a0505 100%)`,
          boxShadow: `0 0 34px ${c.color}66`,
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="drop-shadow">{c.sym}</span>
        <span className="absolute -right-1 -top-1 rounded-full bg-[#020617] p-1" style={{ color: c.color }}>
          {c.icon}
        </span>
      </motion.div>
      <div className="text-center">
        <div className="text-xs font-bold text-white">{c.name}</div>
        <div className="mx-auto mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: c.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${c.risk}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, duration: 1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export const ContaminantTruths: React.FC<ContaminantTruthsProps> = ({ lang }) => {
  const t = translations[lang].contaminant;

  return (
    <div className="relative overflow-hidden bg-[#020617] px-4 py-24 text-white">
      {/* danger glow */}
      <div className="pointer-events-none absolute -right-20 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            <AlertTriangle size={14} /> {t.label}
          </div>
          <h2 className="mx-auto max-w-2xl font-serif text-4xl font-black md:text-5xl">{t.title}</h2>
        </div>

        {/* Contaminant molecules */}
        <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-10">
          {CONTAMINANTS.map((c, i) => (
            <Molecule key={c.sym} c={c} i={i} />
          ))}
        </div>

        {/* Verdict — visual, almost no text */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-16 flex max-w-xl items-center justify-center gap-4 rounded-3xl border border-cyan-300/25 bg-gradient-to-r from-cyan-500/10 to-transparent p-6 text-center"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300">
            <ShieldCheck size={30} />
          </div>
          <p className="text-left font-serif text-xl font-black text-cyan-100">Aquafeel elimina todos.</p>
        </motion.div>
      </div>
    </div>
  );
};
