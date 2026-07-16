/**
 * JourneyExperience — the immersive, scroll-driven "Journey of Pure Water".
 * Public marketing route. Self-contained: Framer Motion + Canvas, no heavy deps.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { Volume2, VolumeX, Globe } from 'lucide-react';
import { JOURNEY_CONTENT, type JourneyLang } from './content';
import { WaterField } from './WaterField';
import { LiquidCursor } from './primitives';
import { HeroScene, CityScene, ValveScene, VortexScene } from './ScenesA';
import { MineralsScene, HouseScene, OsmosisScene, FinaleScene } from './ScenesB';

const LANGS: { code: JourneyLang; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

const WHATSAPP = 'https://wa.me/12155551234';

/* ---------------- Ambient sound (optional, off by default) ---------- */
function useAmbientSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode } | null>(null);
  const [on, setOn] = useState(false);

  const toggle = useCallback(() => {
    setOn((prev) => {
      const next = !prev;
      try {
        if (next) {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx: AudioContext = ctxRef.current || new Ctx();
          ctxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();
          // brown-ish noise buffer -> lowpass -> slow LFO gain = gentle water hum
          const bufferSize = 2 * ctx.sampleRate;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.5;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          noise.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 520;
          const gain = ctx.createGain();
          gain.gain.value = 0.06;
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.12;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.03;
          lfo.connect(lfoGain).connect(gain.gain);
          noise.connect(filter).connect(gain).connect(ctx.destination);
          noise.start();
          lfo.start();
          nodesRef.current = { gain };
        } else if (nodesRef.current) {
          nodesRef.current.gain.gain.value = 0;
          ctxRef.current?.suspend();
        }
      } catch {
        return prev;
      }
      return next;
    });
  }, []);

  return { on, toggle };
}

/* ---------------- Side progress pipe ---------- */
function ProgressPipe({
  chapters,
  active,
  progress,
  onJump,
  skipLabel,
}: {
  chapters: string[];
  active: number;
  progress: number;
  onJump: (i: number) => void;
  skipLabel: string;
}) {
  return (
    <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <div className="relative flex flex-col items-center gap-1">
        <div className="absolute top-0 h-full w-1 rounded-full bg-white/10" />
        <div
          className="absolute top-0 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-cyan-500"
          style={{ height: `${progress * 100}%`, boxShadow: '0 0 12px rgba(34,211,238,0.7)' }}
        />
        {chapters.map((ch, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`${skipLabel}: ${ch}`}
            className="group relative z-10 flex h-8 w-8 items-center justify-center"
          >
            <span
              className={`h-3 w-3 rounded-full border-2 transition-all ${
                i <= active
                  ? 'border-cyan-300 bg-cyan-300'
                  : 'border-white/30 bg-[#020617] group-hover:border-cyan-300/60'
              }`}
            />
            <span className="pointer-events-none absolute right-9 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-[0.65rem] font-semibold text-cyan-100 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              {ch}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Preloader ---------- */
function Preloader({ done }: { done: boolean }) {
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#020617]"
          exit={{ opacity: 0, transition: { duration: 0.7 } }}
        >
          <div className="relative h-28 w-20 overflow-hidden rounded-b-full rounded-t-lg border-2 border-cyan-300/40">
            <motion.div
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-300"
              initial={{ height: '0%' }}
              animate={{ height: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <motion.div
            className="mt-6 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/70"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Aquafeel
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Main ---------- */
export function JourneyExperience() {
  const reduce = useReducedMotion();
  const [lang, setLang] = useState<JourneyLang>(() => {
    const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'pt';
    return (['pt', 'en', 'es'].includes(nav) ? nav : 'pt') as JourneyLang;
  });
  const c = JOURNEY_CONTENT[lang];
  const { on: sound, toggle: toggleSound } = useAmbientSound();

  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  useMotionValueEvent(smooth, 'change', (v) => {
    progressRef.current = v;
    setProgress(v);
    // derive active chapter from viewport center
    const sections = document.querySelectorAll('[data-chapter]');
    const mid = window.innerHeight / 2;
    let cur = 0;
    sections.forEach((s) => {
      const r = (s as HTMLElement).getBoundingClientRect();
      if (r.top <= mid) cur = Number((s as HTMLElement).dataset.chapter);
    });
    setActive(cur);
  });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const jump = useCallback(
    (i: number) => {
      document
        .getElementById(`chapter-${i}`)
        ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    },
    [reduce]
  );

  return (
    <div className="relative min-h-screen bg-[#020617] font-sans text-slate-100 lg:cursor-none">
      <Preloader done={loaded} />
      <WaterField progressRef={progressRef} />
      <LiquidCursor />

      {/* Top bar: brand + language + sound */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4">
        <div className="font-serif text-lg font-black tracking-wide text-white">
          Aqua<span className="text-cyan-300">feel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
            <Globe className="ml-1 h-3.5 w-3.5 text-cyan-300" aria-hidden />
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                  lang === l.code ? 'bg-cyan-400 text-slate-900' : 'text-slate-300 hover:text-white'
                }`}
                aria-pressed={lang === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={sound ? c.ui.soundOff : c.ui.soundOn}
            className="rounded-full border border-white/10 bg-white/5 p-2.5 text-cyan-200 backdrop-blur transition-colors hover:bg-white/10"
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <ProgressPipe
        chapters={c.nav.chapters}
        active={active}
        progress={progress}
        onJump={jump}
        skipLabel={c.ui.skipTo}
      />

      {/* Scenes — re-key on lang so word-reveal replays on switch */}
      <main key={lang}>
        <HeroScene c={c} />
        <CityScene c={c} />
        <ValveScene c={c} />
        <VortexScene c={c} />
        <MineralsScene c={c} />
        <HouseScene c={c} />
        <OsmosisScene c={c} />
        <FinaleScene c={c} waLink={WHATSAPP} />
      </main>
    </div>
  );
}

export default JourneyExperience;
