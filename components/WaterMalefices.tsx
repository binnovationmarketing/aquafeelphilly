
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
      className="perspective-1000 h-[420px] w-full cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <MotionDiv
        className="relative w-full h-full transition-all duration-700 preserve-3d shadow-xl rounded-[1.5rem]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden ${cat.bgColor} ${cat.borderColor} border rounded-[1.5rem] p-6 flex flex-col z-20 hover:shadow-2xl transition-shadow`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2.5 rounded-xl shadow-sm shrink-0">
              {cat.icon}
            </div>
            <h3 className="text-lg font-black text-slate-800 leading-none uppercase tracking-tight">{cat.title}</h3>
          </div>
          
          <ul className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {cat.items.map((item: string, i: number) => (
              <li key={i} className="flex gap-3 text-slate-700">
                <div className="mt-0.5 shrink-0">
                  <HeartCrack size={14} className="text-red-500" />
                </div>
                <span className="text-xs font-semibold leading-snug">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse border-t border-slate-200 pt-4">
            <RotateCcw size={12} />
            {tAction}
          </div>
        </div>

        {/* Back Side (Realidade Oculta) */}
        <div 
          className="absolute inset-0 backface-hidden rounded-[1.5rem] overflow-hidden bg-slate-950 flex flex-col z-10"
          style={{ transform: 'rotateY(180deg)' }}
        >
          {/* HD Image Section */}
          <div className="h-1/2 relative overflow-hidden">
            <img 
              src={cat.imageUrl} 
              alt={cat.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1200';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <div className="bg-red-600 p-1 rounded">
                    <AlertTriangle size={10} className="text-white" />
                </div>
                <span className="text-white font-black uppercase text-[8px] tracking-widest">{cat.impactLabel}</span>
            </div>
          </div>

          {/* Fear Trigger Section */}
          <div className="flex-1 p-5 flex flex-col justify-center bg-slate-950">
             <h4 className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 border-b border-red-500/20 pb-1">
               {cat.backTitle}
             </h4>
             <p className="text-slate-200 text-xs font-medium leading-relaxed italic border-l-2 border-red-600 pl-3">
               "{cat.fearTrigger}"
             </p>
             
             <button className="mt-auto bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-black uppercase text-[8px] tracking-widest mx-auto transition-all border border-white/10 w-full">
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
      imageUrl: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&q=80&w=800', 
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
      imageUrl: 'https://images.unsplash.com/photo-1512496011951-a6994413c2ca?auto=format&fit=crop&q=80&w=800', 
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
      imageUrl: 'https://images.unsplash.com/photo-1537673156264-9dd4940f1a46?auto=format&fit=crop&q=80&w=800',
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
      imageUrl: 'https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?auto=format&fit=crop&q=80&w=800', 
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
