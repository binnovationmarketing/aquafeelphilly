
import React, { useState } from 'react';
import { 
  Home, 
  User, 
  Baby, 
  Dog, 
  AlertTriangle, 
  HeartCrack,
  RotateCcw
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { motion } from 'framer-motion';

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface WaterMaleficesProps {
  lang: Language;
}

const CategoryCard: React.FC<{ cat: any; lang: Language }> = ({ cat, lang }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const tAction = translations[lang].malefices.flipAction;

  return (
    <div 
      className="perspective-1000 h-[480px] w-full cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <MotionDiv
        className="relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-[1.5rem]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden ${cat.bgColor} ${cat.borderColor} border-2 rounded-[1.5rem] p-6 flex flex-col z-20 hover:shadow-2xl transition-shadow`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white p-3 rounded-xl shadow-md shrink-0">
              {cat.icon}
            </div>
            <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{cat.title}</h3>
          </div>
          
          <ul className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {cat.items.map((item: string, i: number) => (
              <li key={i} className="flex gap-4 text-slate-800 items-start">
                <div className="mt-1 shrink-0">
                  <HeartCrack size={18} className="text-red-500" />
                </div>
                <span className="text-sm font-extrabold leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse border-t border-slate-300 pt-5">
            <RotateCcw size={14} />
            {tAction}
          </div>
        </div>

        {/* Back Side (Realidade Oculta) */}
        <div 
          className="absolute inset-0 backface-hidden rounded-[1.5rem] overflow-hidden bg-[#040b16] flex flex-col z-10"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* HD Image Section */}
          <div className="h-[55%] relative overflow-hidden">
            <img 
              src={cat.imageUrl} 
              alt={cat.title} 
              className="w-full h-full object-cover filter contrast-125 saturate-50"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#040b16] via-[#040b16]/40 to-transparent"></div>
            <div className="absolute bottom-4 left-5 flex items-center gap-3">
                <div className="bg-red-600 p-1.5 rounded-md shadow-lg shadow-red-600/50">
                    <AlertTriangle size={14} className="text-white" />
                </div>
                <span className="text-white font-black uppercase text-xs tracking-[0.15em] drop-shadow-md">{cat.impactLabel}</span>
            </div>
          </div>

          {/* Fear Trigger Section */}
          <div className="flex-1 p-6 flex flex-col justify-center bg-[#040b16]">
             <h4 className="text-red-500 text-sm font-black uppercase tracking-[0.2em] mb-4 border-b border-red-500/20 pb-2">
               {cat.backTitle}
             </h4>
             <p className="text-slate-100 text-base font-bold leading-relaxed border-l-4 border-red-600 pl-4 italic opacity-90">
               "{cat.fearTrigger}"
             </p>
             
             <button className="mt-auto bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest mx-auto transition-all border border-white/10 w-full flex items-center justify-center gap-2">
               Voltar
             </button>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};

export const WaterMalefices: React.FC<WaterMaleficesProps> = ({ lang }) => {
  const t = translations[lang].malefices;

  const categories = [
    {
      icon: <Home size={20} className="text-amber-500" />,
      title: t.home.title,
      items: [t.home.m1, t.home.m2, t.home.m3],
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800', 
      backTitle: t.home.backTitle,
      fearTrigger: t.home.fearTrigger,
      impactLabel: t.home.impactLabel
    },
    {
      icon: <User size={20} className="text-blue-500" />,
      title: t.adults.title,
      items: [t.adults.m1, t.adults.m2, t.adults.m3],
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800', 
      backTitle: t.adults.backTitle,
      fearTrigger: t.adults.fearTrigger,
      impactLabel: t.adults.impactLabel
    },
    {
      icon: <Baby size={20} className="text-pink-500" />,
      title: t.children.title,
      items: [t.children.m1, t.children.m2, t.children.m3],
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=800',
      backTitle: t.children.backTitle,
      fearTrigger: t.children.fearTrigger,
      impactLabel: t.children.impactLabel
    },
    {
      icon: <Dog size={20} className="text-emerald-500" />,
      title: t.pets.title,
      items: [t.pets.m1, t.pets.m2, t.pets.m3],
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      imageUrl: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&q=80&w=800', 
      backTitle: t.pets.backTitle,
      fearTrigger: t.pets.fearTrigger,
      impactLabel: t.pets.impactLabel
    }
  ];

  return (
    <section id="malefices" className="py-20 bg-slate-50 px-4 overflow-hidden relative">
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-red-200">
            <AlertTriangle size={12} />
            <span>Alerta de Saúde</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 mb-4 tracking-tight">
            {t.title}
          </h2>
        </div>

        {/* GRID 4 COLUNAS EM TELAS GRANDES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, idx) => (
            <CategoryCard key={idx} cat={cat} lang={lang} />
          ))}
        </div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>
    </section>
  );
};
