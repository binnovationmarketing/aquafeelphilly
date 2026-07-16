/** Shared layout atoms for Journey scenes. */
import React from 'react';
import { motion } from 'framer-motion';
import { Reveal, WordReveal } from './primitives';

export function Section({
  id,
  index,
  children,
  className = '',
  min = 'min-h-screen',
}: {
  id: string;
  index: number;
  children: React.ReactNode;
  className?: string;
  min?: string;
}) {
  return (
    <section
      id={id}
      data-chapter={index}
      className={`relative flex ${min} w-full items-center overflow-hidden py-24 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
    </section>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/5 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-cyan-200/90 backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
        {children}
      </div>
    </Reveal>
  );
}

export function SceneTitle({ text, className = '' }: { text: string; className?: string }) {
  return (
    <h2
      className={`font-serif text-4xl font-black leading-[1.05] text-white sm:text-5xl md:text-6xl ${className}`}
    >
      <WordReveal text={text} />
    </h2>
  );
}

export function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 ${className}`}
      style={{ boxShadow: '0 30px 60px -20px rgba(2,6,23,0.7)' }}
    >
      {children}
    </motion.div>
  );
}
