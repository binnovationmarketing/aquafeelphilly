
import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Utensils,
  Users,
  Calculator,
  Heart
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { useAppStore } from '../src/store/useAppStore';

interface WaterConsumptionLogicProps {
  lang: Language;
}

export const WaterConsumptionLogic: React.FC<WaterConsumptionLogicProps> = ({ lang }) => {
  const t = translations[lang].logic;
  const setWaterTotal = useAppStore((state: any) => state.setWaterTotal);
  const setCleaningTotal = useAppStore((state: any) => state.setCleaningTotal);

  const [dailyDrinkCost, setDailyDrinkCost] = useState<number>(0);
  const [dailyCookCost, setDailyCookCost] = useState<number>(0);
  const [familySize, setFamilySize] = useState<number>(1);
  const [laundryCost, setLaundryCost] = useState<number>(0);
  const [kitchenCost, setKitchenCost] = useState<number>(0);
  const [bathroomCost, setBathroomCost] = useState<number>(0);

  const waterTotal = (dailyDrinkCost + dailyCookCost) * 30;
  const hygieneTotal = laundryCost + kitchenCost + bathroomCost;
  const costPerPerson = familySize > 0 ? hygieneTotal / familySize : 0;

  useEffect(() => {
    setWaterTotal(waterTotal);
  }, [waterTotal, setWaterTotal]);

  useEffect(() => {
    setCleaningTotal(hygieneTotal);
  }, [hygieneTotal, setCleaningTotal]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-200">
            <Calculator size={12} />
            <span>{t.title}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-slate-900 mb-4 tracking-tight">
            {t.intro}
          </h2>
        </div>

        {/* Water Calculation Card */}
        <div className="bg-slate-50 rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl mb-12">
          <div className="flex items-center justify-center gap-2 mb-8 text-slate-500 font-medium text-sm bg-white py-2 px-4 rounded-full shadow-sm w-fit mx-auto border border-slate-100">
            <Droplets size={16} className="text-blue-500" />
            {t.gallonEquivalence}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} className="text-blue-500" />
                {t.dailyDrinkCost}
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={dailyDrinkCost || ''}
                  onChange={(e) => setDailyDrinkCost(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-4 text-slate-900 font-mono text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:border-blue-300"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Utensils size={14} className="text-amber-500" />
                {t.dailyCookCost}
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={dailyCookCost || ''}
                  onChange={(e) => setDailyCookCost(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-4 text-slate-900 font-mono text-xl font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all group-hover:border-amber-300"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">
              {t.monthlyTotal}
            </p>
            <div className="text-4xl md:text-5xl font-black font-mono tracking-tighter mb-4 relative z-10">
              {formatCurrency(waterTotal)}
            </div>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto relative z-10 italic">
              "{t.consciousness.replace('{total}', formatCurrency(waterTotal))}"
            </p>
          </div>
        </div>

        {/* Aquafeel Program Section */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-aqua-100 text-aqua-600 mb-6 shadow-lg shadow-aqua-100/50">
            <Heart size={32} fill="currentColor" />
          </div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-4">
            {t.programTitle}
          </h3>
          <p className="text-slate-600 leading-relaxed">
            {t.programDesc}
          </p>
        </div>

        {/* Hygiene Expenses Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

          <div className="mb-8">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Users size={14} className="text-emerald-500" />
              {t.familySize}
            </label>
            <div className="relative group max-w-xs">
              <input
                type="number"
                min="1"
                value={familySize}
                onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.laundryCost}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={laundryCost || ''}
                  onChange={(e) => setLaundryCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.kitchenCost}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={kitchenCost || ''}
                  onChange={(e) => setKitchenCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.bathroomCost}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={bathroomCost || ''}
                  onChange={(e) => setBathroomCost(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-2 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t.hygieneTotal}</p>
              <p className="text-3xl font-black font-mono text-emerald-800">{formatCurrency(hygieneTotal)}</p>
            </div>
            <div className="h-px w-full md:w-px md:h-12 bg-emerald-200"></div>
            <div className="text-right md:text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">{t.costPerPerson}</p>
              <p className="text-3xl font-black font-mono text-emerald-800">{formatCurrency(costPerPerson)}</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
