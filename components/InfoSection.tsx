
import React from 'react';
import { ExternalLink, Microscope, AlertOctagon, MapPin } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface InfoSectionProps {
  lang: Language;
  zipCode?: string;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ lang, zipCode }) => {
  const t = translations[lang].info;
  
  // Se houver zipCode, usa o link direto. Se não, usa o link de busca genérico.
  const ewgLink = zipCode 
    ? `https://www.ewg.org/tapwater/search-results.php?zip5=${zipCode}`
    : "https://www.ewg.org/tapwater/";

  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-aqua-600 font-bold tracking-wider uppercase text-sm">{t.label}</span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mt-2">
            {t.title}
          </h2>
          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* YouTube Video Section */}
        <div className="mb-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-black aspect-video relative">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube-nocookie.com/embed/Dxl3FVgzPO4?rel=0&modestbranding=1"
            title="A Verdade Sobre a Água (The Truth About Water)"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Card 1 */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-white hover:border-red-100 cursor-default group">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                    <MapPin size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-800">{t.alertTitle} {zipCode && <span className="text-red-500">({zipCode})</span>}</h3>
             </div>
             <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                {t.alertBody}
             </p>
             <div className="space-y-3">
                <a href={ewgLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all group/link border border-slate-100 cursor-pointer">
                    <span className="text-sm font-bold text-slate-700">VER RELATÓRIO DO MEU ZIP CODE</span>
                    <ExternalLink size={16} className="text-aqua-500 group-hover/link:translate-x-1 transition-transform" />
                </a>
             </div>
          </div>

          {/* Visual Health Alert Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-lg relative overflow-hidden group">
             {/* Background glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors duration-700"></div>
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="bg-red-100 p-3 rounded-full text-red-600 animate-pulse">
                    <AlertOctagon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">O Ciclo Invisível</h3>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-0.5">Top 10 Danos da Água (EUA)</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
               {/* Daily Routine Icons */}
               <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Rotina Diária Exposta:</p>
                 <div className="grid grid-cols-2 gap-3">
                   {[
                     { icon: '🪥', label: 'Escovar Dentes' },
                     { icon: '🧖‍♀️', label: 'Lavar o Rosto' },
                     { icon: '🚿', label: 'Tomar Banho' },
                     { icon: '🍳', label: 'Cozinhar' },
                     { icon: '🍎', label: 'Lavar Alimentos' },
                     { icon: '👕', label: 'Lavar Roupa' },
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 hover:border-red-200 transition-colors group/item cursor-default">
                       <span className="text-xl group-hover/item:scale-110 transition-transform">{item.icon}</span>
                       <span className="text-[10px] font-bold text-slate-600 leading-tight">{item.label}</span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Contaminants List */}
               <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                 <p className="text-[10px] items-center flex gap-1 font-black uppercase text-red-600 tracking-widest mb-3">
                    <Microscope size={12} /> Contaminantes Reais:
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                    {['Arsênico', 'Cromo-6', 'Cloramina', 'Cloro', 'Hexavalentes', 'Chumbo', 'Alumínio', 'Benzeno', 'Bromo', 'Tálio', 'Ferro'].map((toxic, i) => (
                      <span key={i} className="bg-white text-[10px] font-bold px-2 py-1 rounded-md text-slate-700 shadow-sm border border-red-100/50">
                        {toxic}
                      </span>
                    ))}
                 </div>
                 <p className="text-xs text-slate-500 mt-4 font-medium leading-relaxed">
                   Mesmo fervendo a água, você <strong>concentra</strong> os metais pesados, e a pele absorve toxinas rapidamente no banho quente.
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
