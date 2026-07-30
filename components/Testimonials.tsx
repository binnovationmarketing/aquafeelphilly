import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface TestimonialsProps {
  lang: Language;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ lang }) => {
  const t = translations[lang].testimonials;

  const cards = [
    { quote: t.t1, initials: 'MJ', name: 'Mariana J.', place: 'New Jersey', accent: '#38BDF8', featured: false },
    { quote: t.t2, initials: 'RC', name: 'Roberto & Carla', place: 'Pennsylvania', accent: '#22D3EE', featured: true },
    { quote: t.t3, initials: 'AL', name: 'Ana Lucia', place: 'Florida', accent: '#7DF9FF', featured: false },
  ];

  return (
    <section className="relative overflow-hidden bg-[#020617] px-4 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="font-serif text-4xl font-black text-white md:text-5xl">{t.title}</h2>
          <p className="mt-4 text-slate-400">{t.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`relative overflow-hidden rounded-3xl border bg-white/[0.04] p-8 backdrop-blur-xl transition-all hover:bg-white/[0.06] ${
                c.featured ? 'border-cyan-300/30 md:-translate-y-4' : 'border-white/10'
              }`}
              style={c.featured ? { boxShadow: '0 30px 70px -25px rgba(34,211,238,0.35)' } : undefined}
            >
              <Quote className="absolute right-6 top-6 text-white/5" size={44} />
              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mb-6 leading-relaxed italic text-slate-200">“{c.quote}”</p>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-slate-900"
                  style={{ background: c.accent, boxShadow: `0 0 20px ${c.accent}55` }}
                >
                  {c.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.place}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
