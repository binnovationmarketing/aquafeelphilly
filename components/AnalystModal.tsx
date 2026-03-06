import React, { useState } from 'react';
import { User, X, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface Analyst {
  name: string;
  phone: string;
}

interface AnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  clientName: string;
}

export const AnalystModal: React.FC<AnalystModalProps> = ({ isOpen, onClose, lang, clientName }) => {
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const t = translations[lang].modal;

  const analysts: Analyst[] = [
    { name: 'Jorge Martinez', phone: '+13012120498' },
    { name: 'Freddy Silva', phone: '+15713200025' },
    { name: 'Sonia Aguilar', phone: '+12406542413' },
    { name: 'Carlos Henrique', phone: '+12407806473' },
  ];

  if (!isOpen) return null;

  const handleSelect = (analyst: Analyst) => {
    setSelectedAnalyst(analyst);
    setIsConfirming(true);
  };

  const handleConfirm = () => {
    if (selectedAnalyst) {
      const message = encodeURIComponent(`Olá ${selectedAnalyst.name}, sou o(a) ${clientName}. Vi a proposta VIP e quero garantir meus 3 meses grátis.`);
      window.open(`https://wa.me/${selectedAnalyst.phone.replace('+', '')}?text=${message}`, '_blank');
      onClose();
      setIsConfirming(false);
      setSelectedAnalyst(null);
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent, analyst: Analyst) => {
    e.stopPropagation();
    const message = encodeURIComponent(`Olá ${analyst.name}, sou o(a) ${clientName}. Vi a proposta VIP e quero garantir meus 3 meses grátis.`);
    window.open(`https://wa.me/${analyst.phone.replace('+', '')}?text=${message}`, '_blank');
  };

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleCancel = () => {
    setIsConfirming(false);
    setSelectedAnalyst(null);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop Translucido */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 md:p-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-500 overflow-hidden">
        
        {/* Background Decorativo Interno */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-aqua-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

        {!isConfirming ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-start mb-8">
              <div className="text-left">
                <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{t.title}</h2>
                <p className="text-slate-400 text-sm mt-2 font-medium">{t.subtitle}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid gap-4">
              {analysts.map((analyst, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(analyst)}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-all duration-300 group w-full text-left active:scale-[0.98] cursor-pointer relative"
                >
                  <div className="bg-aqua-600/20 p-3 rounded-xl group-hover:bg-aqua-600 group-hover:text-white transition-all duration-300 text-aqua-400 shadow-inner">
                    <User size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg group-hover:text-aqua-400 transition-colors tracking-tight">{analyst.name}</div>
                    <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1 mb-2">Water Analyst</div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => handlePhoneClick(e, analyst.phone)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Phone size={12} /> {analyst.phone}
                      </button>
                      <button 
                        onClick={(e) => handleWhatsAppClick(e, analyst)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg transition-colors"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 absolute right-4 top-1/2 -translate-y-1/2">
                    <ChevronRight size={20} className="text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-aqua-600/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-aqua-500/30 shadow-2xl animate-float">
                <User size={48} className="text-aqua-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">{t.confirmTitle}</h2>
            <p className="text-slate-300 mb-10 text-lg font-medium px-4">
               {t.confirmMessage.replace('{name}', selectedAnalyst?.name || '')}
            </p>

            <div className="grid gap-4">
                <button 
                    onClick={handleConfirm}
                    className="w-full bg-gradient-to-r from-aqua-600 to-blue-700 hover:from-aqua-500 hover:to-blue-600 text-white font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 active:scale-95 shimmer group"
                >
                    <MessageSquare size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="uppercase tracking-widest">{t.yes}</span>
                </button>
                <button 
                    onClick={handleCancel}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                    {t.no}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};