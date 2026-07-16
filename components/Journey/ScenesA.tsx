/** Journey scenes 0–3: Hero planet, contaminated city, smart valve, vortex. */
import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ChevronDown, Cpu, RefreshCw, Droplets } from 'lucide-react';
import type { JourneyContent } from './content';
import { Section, Kicker, SceneTitle, GlassPanel } from './layout';
import { CountUp, WordReveal, Reveal } from './primitives';

/* ================================================================== */
/*  SCENE 0 — HERO: THE WATER PLANET                                    */
/* ================================================================== */
export function HeroScene({ c }: { c: JourneyContent }) {
  const reduce = useReducedMotion();
  return (
    <Section id="chapter-0" index={0} className="text-center">
      {/* Planet */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div
            className="absolute -inset-16 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.35), transparent 70%)',
            }}
          />
          <motion.div
            className="relative h-[min(72vw,520px)] w-[min(72vw,520px)] rounded-full"
            style={{
              background:
                'radial-gradient(35% 35% at 32% 30%, #7DF9FF 0%, #22D3EE 22%, #0A1E3F 62%, #020617 100%)',
              boxShadow: 'inset -30px -20px 90px rgba(2,6,23,0.9), 0 0 120px rgba(34,211,238,0.25)',
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          >
            {/* stylized continents / ocean swirls */}
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full opacity-70">
              <defs>
                <radialGradient id="sea" cx="35%" cy="30%">
                  <stop offset="0%" stopColor="#7DF9FF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0A1E3F" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="100" cy="100" r="98" fill="url(#sea)" />
              <path
                d="M60 70 Q80 55 100 65 T150 60 Q140 85 120 90 T70 95 Q55 85 60 70Z"
                fill="#0e7490"
                opacity="0.55"
              />
              <path
                d="M70 120 Q95 110 120 125 T160 130 Q150 150 120 150 T80 145 Q65 135 70 120Z"
                fill="#0e7490"
                opacity="0.45"
              />
              <path
                d="M40 100 Q52 92 60 105 T75 120 Q60 122 48 115 T40 100Z"
                fill="#155e75"
                opacity="0.5"
              />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Copy */}
      <div className="relative z-10 mx-auto max-w-3xl">
        <Kicker>{c.hero.kicker}</Kicker>
        <h1 className="font-serif text-4xl font-black leading-[1.05] text-white drop-shadow-[0_2px_20px_rgba(2,6,23,0.9)] sm:text-6xl md:text-7xl">
          {c.hero.title.map((line, i) => (
            <span key={i} className="block">
              <WordReveal text={line} delay={i * 0.15} />
            </span>
          ))}
        </h1>
        <Reveal delay={0.5} className="mx-auto mt-8 max-w-xl text-lg text-slate-200/90">
          {c.hero.lead}
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4">
          {c.hero.stats.map((s, i) => (
            <GlassPanel key={i} className="!p-4">
              <div className="font-serif text-3xl font-black text-cyan-200 sm:text-4xl">
                <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[0.72rem] leading-tight text-slate-300/80">{s.label}</div>
            </GlassPanel>
          ))}
        </div>

        <Reveal delay={0.7} className="mt-10 text-balance text-base italic text-cyan-100/80">
          “{c.hero.question}”
        </Reveal>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-cyan-200/70"
        animate={reduce ? undefined : { y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Droplets className="mx-auto h-5 w-5" />
        <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em]">{c.ui.scrollHint}</div>
        <ChevronDown className="mx-auto mt-1 h-4 w-4" />
      </motion.div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 1 — CONTAMINATED WATER REACHES YOUR HOME                     */
/* ================================================================== */
export function CityScene({ c }: { c: JourneyContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const flow = useTransform(scrollYProgress, [0, 1], [0, -160]);

  return (
    <Section id="chapter-1" index={1}>
      <div ref={ref} className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <Kicker>{c.city.kicker}</Kicker>
          <SceneTitle text={c.city.title} className="text-amber-50" />
          <Reveal delay={0.15} className="mt-6 max-w-lg text-slate-300/90">
            {c.city.body}
          </Reveal>

          <div className="mt-6 flex flex-wrap gap-2">
            {c.city.contaminants.map((t, i) => (
              <motion.span
                key={t}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
              >
                {t}
              </motion.span>
            ))}
          </div>

          <GlassPanel className="mt-8 max-w-lg">
            <div className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              {c.city.panelTitle}
            </div>
            <p className="mt-2 text-slate-200">{c.city.panelBody}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              {c.city.cta}
            </div>
          </GlassPanel>
        </div>

        {/* Pipe traveling illustration */}
        <div className="relative mx-auto h-[360px] w-full max-w-sm">
          <svg viewBox="0 0 300 360" className="h-full w-full">
            <defs>
              <linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="dirty" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#a16207" />
              </linearGradient>
            </defs>
            {/* treatment plant */}
            <rect x="30" y="20" width="80" height="50" rx="6" fill="#334155" />
            <rect x="44" y="30" width="12" height="30" fill="#475569" />
            <rect x="64" y="26" width="12" height="34" fill="#475569" />
            <rect x="84" y="34" width="12" height="26" fill="#475569" />
            {/* house */}
            <path d="M210 300 l40 -30 l40 30 v50 h-80 z" fill="#334155" />
            <rect x="235" y="320" width="18" height="30" fill="#1e293b" />
            {/* pipe path */}
            <path
              d="M70 70 L70 150 Q70 170 90 170 L230 170 Q250 170 250 190 L250 300"
              fill="none"
              stroke="url(#pipe)"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* flowing dirty water */}
            <motion.path
              d="M70 70 L70 150 Q70 170 90 170 L230 170 Q250 170 250 190 L250 300"
              fill="none"
              stroke="url(#dirty)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="18 26"
              style={{ pathLength: 1 }}
              animate={{ strokeDashoffset: [0, -88] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
          </svg>
          {/* floating contaminant motes */}
          <motion.div style={{ y: flow }} className="pointer-events-none absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-2 w-2 rounded-full bg-amber-400/70"
                style={{ left: `${15 + i * 9}%`, top: `${20 + (i % 4) * 18}%` }}
                animate={{ y: [0, -14, 0], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 2 — THE SMART CONTROL VALVE                                  */
/* ================================================================== */
export function ValveScene({ c }: { c: JourneyContent }) {
  const icons = [Cpu, RefreshCw];
  return (
    <Section id="chapter-2" index={2}>
      <div className="grid items-center gap-12 md:grid-cols-2">
        {/* Exploded valve */}
        <div className="relative mx-auto flex h-[380px] w-full max-w-sm items-center justify-center">
          <div
            className="absolute h-64 w-64 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)',
            }}
          />
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ y: 0, opacity: 0 }}
              whileInView={{ y: (i - 1) * 74, opacity: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ delay: i * 0.18, type: 'spring', damping: 16 }}
              className="absolute flex h-24 w-56 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-slate-700/70 to-slate-900/70 backdrop-blur-md"
              style={{ boxShadow: '0 20px 40px -12px rgba(2,6,23,0.7)' }}
            >
              {i === 1 && (
                <motion.div
                  className="flex flex-col items-center text-cyan-300"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Cpu className="h-8 w-8" />
                  <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-widest">
                    micro-processor
                  </span>
                </motion.div>
              )}
              {i !== 1 && (
                <div className="grid w-full grid-cols-6 gap-1 px-4">
                  {[...Array(6)].map((_, k) => (
                    <div key={k} className="h-6 rounded bg-slate-500/40" />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div>
          <Kicker>{c.valve.kicker}</Kicker>
          <SceneTitle text={c.valve.title} />
          <Reveal delay={0.15} className="mt-6 max-w-lg text-slate-300/90">
            {c.valve.body}
          </Reveal>
          <div className="mt-8 space-y-4">
            {c.valve.features.map((f, i) => {
              const Icon = icons[i] ?? Cpu;
              return (
                <GlassPanel key={i} className="flex items-start gap-4 !p-5">
                  <div className="mt-0.5 rounded-xl bg-cyan-400/15 p-2.5 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{f.title}</div>
                    <div className="mt-1 text-sm text-slate-300/85">{f.body}</div>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 3 — THE VORTEX (scroll-scrubbed whirlpool)                   */
/* ================================================================== */
export function VortexScene({ c }: { c: JourneyContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // Scrubbing the vortex rotation with the scroll — the user "spins" it.
  const spin = useTransform(scrollYProgress, [0, 1], [0, -540]);

  return (
    <Section id="chapter-3" index={3}>
      <div ref={ref} className="grid items-center gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <Kicker>{c.vortex.kicker}</Kicker>
          <SceneTitle text={c.vortex.title} />
          <Reveal delay={0.15} className="mt-6 max-w-lg text-slate-300/90">
            {c.vortex.body}
          </Reveal>
          <GlassPanel className="mt-8 max-w-lg">
            <div className="flex items-center gap-3">
              <span className="font-serif text-4xl font-black text-cyan-300">3</span>
              <div className="text-sm font-bold uppercase tracking-widest text-cyan-200">
                {c.vortex.discTitle}
              </div>
            </div>
            <p className="mt-3 text-slate-200/90">{c.vortex.discBody}</p>
            {/* 3 discs animation */}
            <div className="mt-5 flex items-end justify-center gap-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="relative h-3 w-16 rounded-full bg-gradient-to-r from-cyan-400/40 to-cyan-200/70"
                  animate={reduce ? undefined : { y: [0, -10, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
                >
                  <span className="absolute inset-0 rounded-full ring-1 ring-cyan-300/40" />
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Vortex visual */}
        <div className="order-1 mx-auto flex h-[380px] w-full max-w-sm items-center justify-center md:order-2">
          <div
            className="absolute h-72 w-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.3), transparent 70%)' }}
          />
          <motion.div style={{ rotate: reduce ? 0 : spin }} className="relative">
            <svg viewBox="0 0 240 240" className="h-72 w-72">
              <defs>
                <radialGradient id="vortex" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="55%" stopColor="#0A1E3F" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.15" />
                </radialGradient>
              </defs>
              <circle cx="120" cy="120" r="118" fill="url(#vortex)" />
              {[...Array(6)].map((_, i) => {
                const scale = 1 - i * 0.14;
                return (
                  <ellipse
                    key={i}
                    cx="120"
                    cy="120"
                    rx={110 * scale}
                    ry={110 * scale * 0.62}
                    fill="none"
                    stroke="#7DF9FF"
                    strokeOpacity={0.15 + i * 0.1}
                    strokeWidth={1.4}
                    transform={`rotate(${i * 26} 120 120)`}
                  />
                );
              })}
              {/* spiral particles */}
              {[...Array(14)].map((_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const rad = 30 + (i % 7) * 12;
                return (
                  <circle
                    key={i}
                    cx={120 + Math.cos(a) * rad}
                    cy={120 + Math.sin(a) * rad * 0.62}
                    r={2.2}
                    fill="#7DF9FF"
                    opacity={0.5}
                  />
                );
              })}
            </svg>
          </motion.div>
          {/* 45° inlet cone */}
          <div className="absolute -top-2 right-6 rotate-45 rounded-sm bg-gradient-to-b from-slate-500 to-slate-700 px-2 py-1 text-[0.55rem] font-bold text-cyan-100 shadow-lg">
            45°
          </div>
        </div>
      </div>
    </Section>
  );
}
