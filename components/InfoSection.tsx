
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

          {/* Card 2 */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:bg-white hover:border-blue-100 cursor-default group">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Microscope size={24} />
                </div>
                <h3 className="font-bold text-xl text-slate-800">{t.analysisTitle}</h3>
             </div>
             <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                {t.analysisBody}
             </p>
             <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertOctagon size={16} className="text-red-500 mt-1 shrink-0" />
                    <span>{t.virus}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertOctagon size={16} className="text-red-500 mt-1 shrink-0" />
                    <span>{t.heavyMetals}</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-700">
                    <AlertOctagon size={16} className="text-red-500 mt-1 shrink-0" />
                    <span>{t.chlorine}</span>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
