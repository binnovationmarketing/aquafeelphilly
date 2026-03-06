import React, { useState, useEffect } from 'react';
import { Leaf, DollarSign, Check, ShoppingBag, Truck, Users } from 'lucide-react';
import { Language, translations } from '../utils/i18n';

interface SoapLifestyleProps {
  onTotalChange: (total: number) => void;
  lang: Language;
}

export const SoapLifestyle: React.FC<SoapLifestyleProps> = ({ onTotalChange, lang }) => {
  const [laundry, setLaundry] = useState<number>(0);
  const [kitchen, setKitchen] = useState<number>(0);
  const [bathroom, setBathroom] = useState<number>(0);
  
  const t = translations[lang].soap;
  const totalSpend = laundry + kitchen + bathroom;

  useEffect(() => {
    onTotalChange(totalSpend);
  }, [totalSpend, onTotalChange]);

  return (
    <section className="py-20 bg-slate-50 px-4 border-t border-slate-200">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-800 px-5 py-2 rounded-full mb-6 shadow-sm">
            <Leaf size={16} fill="currentColor" />
            <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">{t.partner}</span>
          </div>
          <h2 className="text-3xl md:text-6xl font-serif font-black text-slate-900 mb-6 tracking-tighter">
            Pure Selects: <span className="text-emerald-600">{t.title}</span>
          </h2>
          <p className="text-base md:text-2xl text-slate-500 max-w-4xl mx-auto leading-relaxed font-medium">
            {t.subtitle} 
            <span className="font-black text-emerald-700 block mt-2 uppercase text-sm tracking-widest"> {t.features}</span>
          </p>
          <div className="mt-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            {t.learnMore} <a href="https://pureselects.com/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4">pureselects.com</a>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
          
          {/* CALCULADORA DE SABÃO */}
          <div className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-4 mb-10">
                 <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-600/20">
                   <DollarSign size={24} />
                 </div>
                 <div>
                   <h3 className="font-black text-xl md:text-2xl text-slate-900 uppercase tracking-tighter leading-none">{t.currentSpend}</h3>
                   <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">{t.spendSub}</p>
                 </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.laundry}</label>
                    <span className="font-black text-emerald-600 text-lg">${laundry}</span>
                  </div>
                  <input type="range" min="0" max="200" step="5" value={laundry} onChange={(e) => setLaundry(Number(e.target.value))} className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.kitchen}</label>
                    <span className="font-black text-emerald-600 text-lg">${kitchen}</span>
                  </div>
                  <input type="range" min="0" max="200" step="5" value={kitchen} onChange={(e) => setKitchen(Number(e.target.value))} className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.bathroom}</label>
                    <span className="font-black text-emerald-600 text-lg">${bathroom}</span>
                  </div>
                  <input type="range" min="0" max="300" step="5" value={bathroom} onChange={(e) => setBathroom(Number(e.target.value))} className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100">
               <div className="bg-slate-950 p-8 rounded-[2rem] text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-125 duration-1000">
                    <ShoppingBag size={120} className="text-emerald-400" />
                  </div>
                  <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2 block">{t.total} MENSAL EM SABÃO</span>
                  <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">${totalSpend}</div>
               </div>
            </div>
          </div>

          {/* REALIDADE AQUAFEEL */}
          <div className="h-full flex flex-col gap-6 md:gap-8">
             <div className="bg-slate-950 text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex-1 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
                <h3 className="text-2xl md:text-3xl font-black mb-10 relative z-10 tracking-tighter uppercase">{t.reality}</h3>
                
                <div className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>{t.market}</span>
                      <span className="text-red-500">${totalSpend}/mo</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-1000" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Custo de Entrega (Pure Selects)</span>
                      <span className="text-amber-400">$16.25/mo</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000" 
                        style={{ width: totalSpend > 0 ? `${Math.min((16.25 / totalSpend) * 100, 100)}%` : '5%' }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      <span>{t.referral}</span>
                      <span className="text-emerald-400">$0.00/mo</span>
                    </div>
                    <div className="h-6 bg-white/10 rounded-full overflow-hidden flex items-center px-4 relative border border-emerald-500/20">
                       <span className="text-[10px] font-black text-emerald-400 tracking-[0.3em] uppercase animate-pulse">{t.free}</span>
                       <div className="absolute right-2 text-emerald-500"><Check size={14} /></div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/5 p-2 rounded-lg"><Users size={18} className="text-emerald-500" /></div>
                        <div>
                          <p className="text-sm font-bold text-white">{t.howTo1}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">Garantia Vitalícia*</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-white/5 p-2 rounded-lg"><Truck size={18} className="text-emerald-500" /></div>
                        <div>
                          <p className="text-sm font-bold text-white">{t.howTo2}</p>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mt-1">Direto na sua porta</p>
                        </div>
                      </div>
                   </div>
                   <div className="bg-emerald-600/20 border border-emerald-500/30 p-4 rounded-2xl text-center shrink-0">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1 block">Benefício Único</span>
                      <span className="text-lg font-black text-white">VIP LIFETIME</span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};