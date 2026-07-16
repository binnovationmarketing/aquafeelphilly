/** Journey scenes 4–7: minerals, whole home, alkaline osmosis, finale. */
import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Wind,
  Droplet,
  WashingMachine,
  Flame,
  Utensils,
  HandHeart,
  Waves,
  Phone,
  Calendar,
} from 'lucide-react';
import type { JourneyContent, MineralLayer } from './content';
import { Section, Kicker, SceneTitle, GlassPanel } from './layout';
import { CountUp, Reveal, MagneticButton } from './primitives';

/* ================================================================== */
/*  SCENE 4 — THE MINERAL LAYERS (interactive tilt cards)              */
/* ================================================================== */
function MineralCard({ layer, i }: { layer: MineralLayer; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [rot, setRot] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setRot({ x: -py * 12, y: px * 14 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 900 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setRot({ x: 0, y: 0 })}
        animate={{ rotateX: rot.x, rotateY: rot.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        data-hot
        className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
        style={{ transformStyle: 'preserve-3d', boxShadow: '0 30px 60px -25px rgba(2,6,23,0.8)' }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
          style={{ background: layer.color }}
        />
        {/* mineral orb */}
        <div
          className="relative mb-5 h-16 w-16 rounded-full"
          style={{
            background: `radial-gradient(35% 35% at 35% 30%, #fff, ${layer.color} 45%, #0A1E3F 100%)`,
            boxShadow: `0 0 30px ${layer.color}66`,
            transform: 'translateZ(40px)',
          }}
        />
        <div
          className="inline-block rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-widest"
          style={{ background: `${layer.color}22`, color: layer.color }}
        >
          {layer.tag}
        </div>
        <h3 className="mt-2 font-serif text-2xl font-black text-white">{layer.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300/85">{layer.body}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {layer.removes.map((r) => (
            <span
              key={r}
              className="rounded-md border border-white/10 bg-black/20 px-2 py-0.5 text-[0.68rem] text-slate-300"
            >
              {r}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MineralsScene({ c }: { c: JourneyContent }) {
  return (
    <Section id="chapter-4" index={4} min="min-h-screen">
      <div className="text-center">
        <Kicker>{c.minerals.kicker}</Kicker>
        <SceneTitle text={c.minerals.title} className="mx-auto max-w-2xl" />
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {c.minerals.layers.map((layer, i) => (
          <MineralCard key={layer.key} layer={layer} i={i} />
        ))}
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 5 — SOFT WATER FOR THE WHOLE HOME                            */
/* ================================================================== */
export function HouseScene({ c }: { c: JourneyContent }) {
  const icons = [HandHeart, Waves, WashingMachine, Flame, Utensils];
  return (
    <Section id="chapter-5" index={5}>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <Kicker>{c.house.kicker}</Kicker>
          <SceneTitle text={c.house.title} />
          <Reveal delay={0.15} className="mt-6 max-w-lg text-slate-300/90">
            {c.house.body}
          </Reveal>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {c.house.beneficiaries.map((b, i) => {
              const Icon = icons[i] ?? Droplet;
              return (
                <motion.div
                  key={b}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
                  {b}
                </motion.div>
              );
            })}
          </div>

          <GlassPanel className="mt-6 max-w-lg !p-5 text-sm text-slate-300/85">
            {c.house.cleaning}
          </GlassPanel>
        </div>

        {/* Savings stat + odometer */}
        <div className="mx-auto w-full max-w-sm text-center">
          <div
            className="relative rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-8"
            style={{ boxShadow: '0 30px 70px -25px rgba(34,211,238,0.35)' }}
          >
            <div
              className="absolute -inset-2 -z-10 rounded-3xl blur-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)',
              }}
            />
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
              Aquafeel
            </div>
            <div className="font-serif text-6xl font-black text-white">
              <CountUp value={c.house.stat.value} suffix={c.house.stat.suffix} duration={2.2} />
            </div>
            <div className="mx-auto mt-3 max-w-[16rem] text-sm text-slate-300/85">
              {c.house.stat.label}
            </div>
            {/* odometer flow bar */}
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-200"
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 6 — ALKALINE REVERSE OSMOSIS (stage flow + pH meter)         */
/* ================================================================== */
export function OsmosisScene({ c }: { c: JourneyContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start center', 'end center'] });
  // pH climbs from 7 to 10.5 as the reader moves through the stages
  const [ph, setPh] = useState(7);
  useMotionValueEvent(scrollYProgress, 'change', (v) => setPh(7 + v * 3.5));
  const fill = useTransform(scrollYProgress, [0, 1], ['16%', '100%']);

  return (
    <Section id="chapter-6" index={6} min="min-h-[130vh]">
      <div ref={ref}>
        <div className="text-center">
          <Kicker>{c.osmosis.kicker}</Kicker>
          <SceneTitle text={c.osmosis.title} className="mx-auto max-w-2xl" />
          <Reveal delay={0.15} className="mx-auto mt-6 max-w-xl text-slate-300/90">
            {c.osmosis.body}
          </Reveal>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_260px]">
          {/* Stage flow */}
          <div className="relative space-y-3 border-l border-cyan-300/20 pl-6">
            {c.osmosis.stages.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-12%' }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
              >
                <span className="absolute -left-[34px] top-5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/40 bg-[#0A1E3F] text-[0.6rem] font-bold text-cyan-200">
                  {s.index}
                </span>
                <div className="font-bold text-white">{s.title}</div>
                <p className="mt-1 text-sm text-slate-300/85">{s.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Sticky pH meter + extras */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-xl">
              <div className="mx-auto flex items-end justify-center gap-4">
                {/* vertical tube */}
                <div className="relative h-56 w-14 overflow-hidden rounded-full border border-white/10 bg-slate-800/60">
                  <motion.div
                    className="absolute bottom-0 left-0 w-full rounded-full"
                    style={{
                      height: fill,
                      background: 'linear-gradient(to top, #22D3EE, #7DF9FF)',
                      boxShadow: '0 0 24px rgba(125,249,255,0.6)',
                    }}
                  />
                  {/* bubbles */}
                  {[...Array(4)].map((_, k) => (
                    <motion.span
                      key={k}
                      className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white/70"
                      style={{ bottom: `${10 + k * 12}%` }}
                      animate={{ y: [0, -40, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: k * 0.5 }}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold uppercase tracking-widest text-cyan-200/80">
                    {c.osmosis.phLabel}
                  </div>
                  <div className="font-serif text-5xl font-black text-white">{ph.toFixed(1)}</div>
                  <div className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-cyan-300">
                    {ph >= 10 ? 'Alcalina' : ''}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-cyan-100/80">{c.osmosis.phNote}</p>
            </div>

            <div className="mt-4 space-y-2">
              {c.osmosis.extras.map((e) => (
                <div
                  key={e}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  SCENE 7 — FINALE: THE GLASS OF PURE WATER                          */
/* ================================================================== */
export function FinaleScene({ c, waLink }: { c: JourneyContent; waLink: string }) {
  const [slide, setSlide] = useState(50);

  return (
    <Section id="chapter-7" index={7} className="text-center">
      <div className="mx-auto max-w-3xl">
        <Kicker>{c.finale.kicker}</Kicker>
        <SceneTitle text={c.finale.title} className="mx-auto max-w-2xl" />
        <Reveal delay={0.2} className="mx-auto mt-6 max-w-xl text-lg text-cyan-100/90">
          {c.finale.tagline}
        </Reveal>

        {/* Before / after slider */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="relative h-56 select-none overflow-hidden rounded-3xl border border-white/10">
            {/* after (clean) */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #0A1E3F, #22D3EE 120%)' }}
            />
            <div className="absolute inset-0 flex items-center justify-end pr-6 text-cyan-100">
              <Sparkles className="mr-2 h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">
                {c.finale.afterLabel}
              </span>
            </div>
            {/* before (turbid) — clipped */}
            <div
              className="absolute inset-0"
              style={{
                width: `${slide}%`,
                background: 'linear-gradient(135deg, #422b0a, #92700f 120%)',
              }}
            >
              <div className="absolute inset-0 flex items-center pl-6 text-amber-100">
                <Wind className="mr-2 h-5 w-5" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  {c.finale.beforeLabel}
                </span>
              </div>
            </div>
            {/* handle */}
            <div className="absolute top-0 h-full w-0.5 bg-white/80" style={{ left: `${slide}%` }}>
              <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg">
                <Droplet className="h-4 w-4" />
              </div>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={slide}
            onChange={(e) => setSlide(Number(e.target.value))}
            aria-label={`${c.finale.beforeLabel} / ${c.finale.afterLabel}`}
            className="mt-3 w-full accent-cyan-400"
          />
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <MagneticButton>
            <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-8 py-4 font-bold text-slate-900 shadow-[0_10px_40px_-8px_rgba(34,211,238,0.7)] transition-transform">
              <Calendar className="h-5 w-5" />
              {c.finale.ctaPrimary}
            </span>
          </MagneticButton>
          <MagneticButton as="a" href={waLink}>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-white/5 px-6 py-4 font-semibold text-cyan-100 backdrop-blur transition-colors hover:bg-white/10">
              <Phone className="h-5 w-5" />
              {c.finale.ctaSecondary}
            </span>
          </MagneticButton>
        </div>
      </div>

      {/* Footer waves */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 120" className="h-24 w-full" preserveAspectRatio="none">
          <motion.path
            fill="rgba(34,211,238,0.12)"
            initial={{ d: 'M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z' }}
            animate={{
              d: [
                'M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z',
                'M0,60 C360,0 1080,120 1440,60 L1440,120 L0,120 Z',
                'M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    </Section>
  );
}
