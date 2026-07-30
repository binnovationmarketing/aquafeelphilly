import React, { useState } from 'react';
import { Home, User, Baby, Dog, AlertTriangle, HeartCrack, RotateCcw } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { motion } from 'framer-motion';

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface WaterMaleficesProps {
  lang: Language;
}

interface Cat {
  icon: React.ReactNode;
  accent: string;
  title: string;
  items: string[];
  imageUrl: string;
  backTitle: string;
  fearTrigger: string;
  impactLabel: string;
}

const CategoryCard: React.FC<{ cat: Cat; lang: Language }> = ({ cat, lang }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const tAction = translations[lang].malefices.flipAction;

  return (
    <div
      className="perspective-1000 h-[440px] w-full cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <MotionDiv
        className="relative w-full h-full preserve-3d rounded-[1.5rem]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Front — dark glass with glowing accent */}
        <div className="absolute inset-0 backface-hidden z-20 flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-3xl"
            style={{ background: cat.accent }}
          />
          <div className="relative mb-6 flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${cat.accent}22`, color: cat.accent, boxShadow: `0 0 24px ${cat.accent}44` }}
            >
              {cat.icon}
            </div>
            <h3 className="font-serif text-2xl font-black leading-tight text-white">{cat.title}</h3>
          </div>

          <ul className="relative flex-1 space-y-4">
            {cat.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-200">
                <HeartCrack size={16} className="mt-0.5 shrink-0" style={{ color: cat.accent }} />
                <span className="text-sm font-semibold leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <div className="relative mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">
            <RotateCcw size={13} className="animate-pulse" />
            {tAction}
          </div>
        </div>

        {/* Back — image + fear trigger */}
        <div
          className="absolute inset-0 backface-hidden z-10 flex flex-col overflow-hidden rounded-[1.5rem] bg-[#040b16]"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="relative h-[52%] overflow-hidden">
            <img
              src={cat.imageUrl}
              alt={cat.title}
              className="h-full w-full object-cover contrast-125 saturate-50"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040b16] via-[#040b16]/40 to-transparent" />
            <div className="absolute bottom-4 left-5 flex items-center gap-2">
              <div className="rounded-md bg-red-600 p-1.5 shadow-lg shadow-red-600/50">
                <AlertTriangle size={13} className="text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.15em] text-white drop-shadow">
                {cat.impactLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center bg-[#040b16] p-6">
            <h4 className="mb-3 border-b border-red-500/20 pb-2 text-xs font-black uppercase tracking-[0.2em] text-red-400">
              {cat.backTitle}
            </h4>
            <p className="border-l-4 border-red-600 pl-4 text-base font-bold italic leading-relaxed text-slate-100/90">
              “{cat.fearTrigger}”
            </p>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export const WaterMalefices: React.FC<WaterMaleficesProps> = ({ lang }) => {
  const t = translations[lang].malefices;

  const categories: Cat[] = [
    {
      icon: <Home size={22} />,
      accent: '#F59E0B',
      title: t.home.title,
      items: [t.home.m1, t.home.m2, t.home.m3],
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
      backTitle: t.home.backTitle,
      fearTrigger: t.home.fearTrigger,
      impactLabel: t.home.impactLabel,
    },
    {
      icon: <User size={22} />,
      accent: '#38BDF8',
      title: t.adults.title,
      items: [t.adults.m1, t.adults.m2, t.adults.m3],
      imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800',
      backTitle: t.adults.backTitle,
      fearTrigger: t.adults.fearTrigger,
      impactLabel: t.adults.impactLabel,
    },
    {
      icon: <Baby size={22} />,
      accent: '#F472B6',
      title: t.children.title,
      items: [t.children.m1, t.children.m2, t.children.m3],
      imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800',
      backTitle: t.children.backTitle,
      fearTrigger: t.children.fearTrigger,
      impactLabel: t.children.impactLabel,
    },
    {
      icon: <Dog size={22} />,
      accent: '#34D399',
      title: t.pets.title,
      items: [t.pets.m1, t.pets.m2, t.pets.m3],
      imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&q=80&w=800',
      backTitle: t.pets.backTitle,
      fearTrigger: t.pets.fearTrigger,
      impactLabel: t.pets.impactLabel,
    },
  ];

  return (
    <section id="malefices" className="relative overflow-hidden bg-[#020617] px-4 py-24">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-[1400px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-300">
            <AlertTriangle size={12} />
            <span>Alerta de Saúde</span>
          </div>
          <h2 className="font-serif text-4xl font-black text-white md:text-5xl">{t.title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} cat={cat} lang={lang} />
          ))}
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </section>
  );
};
