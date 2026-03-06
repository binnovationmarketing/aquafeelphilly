import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, MessageSquare } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface UrgencyBannerProps {
  expirationDate: Date;
  lang: Language;
  isExpired?: boolean;
  onOpenAnalyst?: () => void;
}

export const UrgencyBanner: React.FC<UrgencyBannerProps> = ({ 
    expirationDate, 
    lang, 
    isExpired = false,
    onOpenAnalyst
}) => {
  const t = translations[lang].urgency;
  
  const calculateTimeLeft = () => {
    const now = new Date();
    const difference = expirationDate.getTime() - now.getTime();

    if (difference > 0) {
      return {
        hours: Math.floor((difference / (1000 * 60 * 60))),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { hours: 0, minutes: 0, seconds: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationDate, isExpired]);

  const formattedDate = expirationDate.toLocaleDateString(
    lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', 
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );

  // RENDERIZAÇÃO QUANDO EXPIRADO (ZONA DE GLOW VERMELHO PULSANTE)
  if (isExpired) {
    return (
        <div className="bg-red-600 py-12 px-4 relative z-40 shadow-2xl animate-pulse border-y border-white/20">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="bg-white text-red-600 p-3 rounded-full shadow-2xl shrink-0">
                        <AlertOctagon size={32} strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black text-white text-xl md:text-3xl uppercase tracking-tighter drop-shadow-lg">
                          {t.expiredTitle}
                        </h3>
                        <p className="text-white font-bold text-xs md:text-sm max-w-lg leading-tight opacity-90">
                          {t.expiredText}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={onOpenAnalyst}
                    className="bg-white text-red-600 hover:bg-slate-100 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] transform transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                    <MessageSquare size={18} />
                    {t.expiredButton}
                </button>
            </div>
        </div>
    );
  }

  // RENDERIZAÇÃO NORMAL (CONTAGEM REGRESSIVA ESTÁTICA)
  return (
    <div className="bg-slate-900 border-y-4 border-amber-500 py-12 px-4 relative z-40 shadow-xl">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        
        <div className="flex items-center gap-5">
            <div className="bg-amber-500 text-slate-900 p-3 rounded-full animate-pulse hidden md:block shadow-lg shadow-amber-500/50">
                <Clock size={32} strokeWidth={2.5} />
            </div>
            <div>
                <h3 className="font-bold text-white text-xl md:text-2xl uppercase tracking-tight drop-shadow-md">
                  {t.expires} <span className="text-amber-400 font-mono tracking-wider">{String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
                </h3>
                <p className="text-slate-400 mt-1 text-sm md:text-base hidden md:block">
                   {t.commission}
                </p>
            </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end bg-white/5 p-4 rounded-lg border border-white/10 w-full md:w-auto backdrop-blur-sm">
            <div className="text-amber-400 font-bold flex items-center gap-2 mb-1">
                <AlertOctagon size={18} />
                <span className="uppercase text-sm md:text-base tracking-wide">{t.limit} {formattedDate.toUpperCase()}</span>
            </div>
            <p className="text-xs text-slate-400 max-w-[300px] text-center md:text-right">
                {t.footer}
            </p>
        </div>
      </div>
    </div>
  );
};