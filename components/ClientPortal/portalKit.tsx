/**
 * Portal design kit — brings the immersive "/jornada" aesthetic (deep abyss
 * blues, cyan glow, glassmorphism, serif display, cinematic reveals) to the
 * client portal. Pure presentation; reuses the Journey primitives.
 */
import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { WaterField } from '../Journey/WaterField';
import { CountUp, Reveal, MagneticButton } from '../Journey/primitives';

export { CountUp, Reveal, MagneticButton };

/* Calm water backdrop: reuse the Journey canvas frozen at high clarity. */
export function PortalBackground() {
  const clarity = useRef(0.82);
  return (
    <>
      <div
        className="fixed inset-0 -z-20"
        style={{
          background: 'radial-gradient(1200px 600px at 80% -10%, #0A1E3F 0%, #020617 60%)',
        }}
      />
      <WaterField progressRef={clarity} />
    </>
  );
}

/* Small uppercase pill label with a pulsing dot. */
export function PortalKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-200/90 backdrop-blur">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
      {children}
    </div>
  );
}

/* Serif display heading in the Journey voice. */
export function PortalTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`font-serif font-black leading-[1.05] text-white ${className}`}>{children}</h2>
  );
}

/* Frosted glass card with soft depth and a cyan hover lift. */
export function GlassCard({
  children,
  className = '',
  hover = true,
  glow,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay }}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl ${
        hover ? 'transition-colors hover:border-cyan-300/30 hover:bg-white/[0.06]' : ''
      } ${className}`}
      style={{ boxShadow: '0 30px 60px -28px rgba(2,6,23,0.85)' }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: glow }}
        />
      )}
      {children}
    </motion.div>
  );
}

/* KPI stat tile with animated count-up and an accent icon. */
export function StatTile({
  label,
  value,
  suffix,
  icon,
  accent = '#22D3EE',
  delay = 0,
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accent?: string;
  delay?: number;
  decimals?: number;
}) {
  return (
    <GlassCard delay={delay} glow={accent} className="p-6">
      <div
        className="mb-3 inline-flex rounded-xl p-2.5"
        style={{ background: `${accent}1f`, color: accent }}
      >
        {icon}
      </div>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-serif text-4xl font-black text-white">
          <CountUp value={value} decimals={decimals} />
        </span>
        {suffix && <span className="text-xs font-bold text-slate-500">{suffix}</span>}
      </div>
    </GlassCard>
  );
}

/* Liquid level meter — mirrors the Journey pH tube, horizontal. */
export function LevelMeter({
  progress,
  accent = '#22D3EE',
}: {
  progress: number; // 0..100
  accent?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div
        className="relative h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${accent}, #7DF9FF)`,
          boxShadow: `0 0 16px ${accent}88`,
        }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.min(100, progress)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {!reduce && (
          <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(125,249,255,0.9)]" />
        )}
      </motion.div>
    </div>
  );
}
