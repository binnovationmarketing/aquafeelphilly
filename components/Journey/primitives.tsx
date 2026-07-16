/**
 * Shared, self-contained primitives for the immersive Journey experience.
 * Built on Framer Motion 12 only — no heavy 3D deps, so it always builds.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  animate,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  CountUp — animated number that fires when it scrolls into view      */
/* ------------------------------------------------------------------ */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  duration = 1.8,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15% 0px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  WordReveal — cinematic word-by-word title reveal                    */
/* ------------------------------------------------------------------ */
export function WordReveal({
  text,
  className = '',
  delay = 0,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const words = text.split(' ');
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '110%', opacity: 0 },
              visible: {
                y: '0%',
                opacity: 1,
                transition: { type: 'spring', damping: 18, stiffness: 140 },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* ------------------------------------------------------------------ */
/*  MagneticButton — button that leans toward the cursor                */
/* ------------------------------------------------------------------ */
export function MagneticButton({
  children,
  className = '',
  strength = 0.4,
  as = 'button',
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  as?: 'button' | 'a';
  href?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  const handleMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const inner =
    as === 'a' ? (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    ) : (
      <button className={className} onClick={onClick} type="button">
        {children}
      </button>
    );

  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={handleMove}
      onMouseLeave={reset}
    >
      {inner}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  LiquidCursor — a springy water-drop cursor (desktop, pointer:fine)  */
/* ------------------------------------------------------------------ */
export function LiquidCursor() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40 });
  const sy = useSpring(y, { stiffness: 500, damping: 40 });
  const rx = useSpring(x, { stiffness: 120, damping: 20 });
  const ry = useSpring(y, { stiffness: 120, damping: 20 });
  const [enabled, setEnabled] = useState(false);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    setEnabled(true);
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement | null;
      setHot(!!t?.closest('a, button, [data-hot]'));
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 mix-blend-screen"
        style={{
          left: sx,
          top: sy,
          width: hot ? 10 : 8,
          height: hot ? 10 : 8,
          boxShadow: '0 0 12px 2px rgba(125,249,255,0.9)',
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed z-[99] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60"
        style={{
          left: rx,
          top: ry,
          width: hot ? 56 : 34,
          height: hot ? 56 : 34,
          backgroundColor: hot ? 'rgba(34,211,238,0.10)' : 'transparent',
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Reveal — simple fade/rise wrapper for panels                        */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  className = '',
  y = 40,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export type { MotionValue };
