import React from 'react';
import { 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  Calendar, 
  CreditCard, 
  Microscope, 
  Gem,
  Award
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface HeroSectionProps {
  clientName: string;
  spouseName?: string;
  lang: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ clientName, spouseName, lang }) => {
  const displayName = spouseName ? `${clientName} & ${spouseName}` : clientName;
  const t = translations[lang].hero;

  const benefits = [
    {
      icon: <Gift className="text-red-500" size={24} />,
      title: t.cashbackTitle,
      sub: t.cashbackValue,
      highlight: true,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] group-hover:border-red-500/50'
    },
    {
      icon: <ShieldCheck className="text-gold-500" size={24} />,
      title: t.warrantyTitle,
      sub: t.warrantySub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] group-hover:border-yellow-500/50'
    },
    {
      icon: <Gem className="text-aqua-400" size={24} />,
      title: t.installTitle,
      sub: t.installSub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] group-hover:border-aqua-400/50'
    },
    {
      icon: <Sparkles className="text-emerald-400" size={24} />,
      title: t.soapTitle,
      sub: t.soapSub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:border-emerald-400/50'
    },
    {
      icon: <Calendar className="text-blue-400" size={24} />,
      title: t.paymentTitle,
      sub: t.paymentSub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:border-blue-400/50'
    },
    {
      icon: <CreditCard className="text-purple-400" size={24} />,
      title: t.penaltyTitle,
      sub: t.penaltySub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:border-purple-400/50'
    },
    {
      icon: <Microscope className="text-teal-400" size={24} />,
      title: t.analysisTitle,
      sub: t.analysisSub,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(20,184,166,0.3)] group-hover:border-teal-400/50'
    },
    {
      icon: <Award className="text-amber-400" size={24} />,
      title: "Premium",
      sub: t.systemCard,
      highlight: false,
      glowColor: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] group-hover:border-amber-400/50'
    }
  ];

  return (
    <div className="relative bg-aqua-950 text-white pt-16 md:pt-24 pb-24 md:pb-40 px-4 overflow-hidden">
      {/* Background de Luxo Profundo */}
      <div className="absolute inset-0 bg-[#020d1a]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-aqua-900/20 to-transparent opacity-50"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-red-600/10 rounded-full blur-[100px] md:blur-[150px] animate-soft-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-aqua-500/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center flex flex-col items-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 md:gap-3 mb-6 md:mb-10 bg-gradient-to-r from-red-600 to-red-800 text-white px-6 md:px-10 py-2 md:py-3 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.3)] border border-white/10 animate-in fade-in zoom-in duration-700">
            <Gift size={18} className="fill-white md:w-[22px] animate-float" /> 
            <span className="text-[10px] md:text-sm font-black tracking-[0.2em] md:tracking-[0.3em] uppercase">{t.platinum}</span>
          </div>
          
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tighter text-white font-sans animate-in fade-in slide-in-from-top-8 duration-1000">
            <span className="opacity-70 text-lg md:text-3xl lg:text-4xl block mb-2 font-light tracking-widest">{t.welcomeHome}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 block drop-shadow-sm uppercase">
              {displayName}
            </span>
          </h1>
          
          <p className="text-base md:text-xl lg:text-2xl text-slate-400 font-light mb-10 md:mb-16 max-w-4xl mx-auto leading-relaxed tracking-wide px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            {t.subtitle} <br className="hidden md:block" />
            <span className="text-white font-bold inline-flex items-center gap-2 mt-4 px-3 md:px-4 py-1 md:py-2 border-b-2 border-red-500 transition-all duration-300 hover:text-red-400 hover:border-white">
               {t.systemName}
            </span>
          </p>
        </div>

        {/* Grid de Benefícios de Luxo (Perfeito 4x2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              style={{ animationDelay: `${index * 100}ms` }}
              className={`group animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both`}
            >
              <div className={`glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl flex flex-col items-center text-center transition-all duration-500 h-full ${benefit.glowColor} ${benefit.highlight ? 'ring-2 ring-red-500/50 bg-red-500/10' : ''}`}>
                <div className="mb-3 md:mb-4 bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                  {benefit.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.25em] mb-1 group-hover:text-slate-300 transition-colors">
                    {benefit.title}
                  </h4>
                  <p className={`text-xs md:text-lg font-bold tracking-tight transition-all duration-300 leading-tight ${benefit.highlight ? 'text-red-400 group-hover:text-red-300' : 'text-white'}`}>
                    {benefit.sub}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};