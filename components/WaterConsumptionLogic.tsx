import React, { useState, useEffect } from 'react';
import { Droplets, Utensils, Users, Calculator, Heart } from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { useAppStore } from '../src/store/useAppStore';

interface WaterConsumptionLogicProps {
  lang: Language;
}

const darkInput =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 font-mono text-lg font-bold text-white placeholder-slate-600 outline-none transition-all focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/40';

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <section className="relative overflow-hidden bg-[#020617] px-4 py-24">
      <div className="pointer-events-none absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-200">
            <Calculator size={12} />
            <span>{t.title}</span>
          </div>
          <h2 className="font-serif text-4xl font-black text-white md:text-5xl">{t.intro}</h2>
        </div>

        {/* Water Calculation Card */}
        <div className="mb-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-10">
          <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300">
            <Droplets size={16} className="text-cyan-300" />
            {t.gallonEquivalence}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Users size={14} className="text-cyan-300" />
                {t.dailyDrinkCost}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={dailyDrinkCost || ''}
                onChange={(e) => setDailyDrinkCost(Number(e.target.value))}
                className={darkInput}
                placeholder="0"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Utensils size={14} className="text-amber-300" />
                {t.dailyCookCost}
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={dailyCookCost || ''}
                onChange={(e) => setDailyCookCost(Number(e.target.value))}
                className={darkInput}
                placeholder="0"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/10 to-transparent p-6 text-center">
            <p className="relative z-10 mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-200/80">
              {t.monthlyTotal}
            </p>
            <div className="relative z-10 mb-3 font-serif text-5xl font-black tracking-tight text-white">
              {formatCurrency(waterTotal)}
            </div>
            <p className="relative z-10 mx-auto max-w-2xl text-xs font-medium italic leading-relaxed text-slate-300 md:text-sm">
              “{t.consciousness.replace('{total}', formatCurrency(waterTotal))}”
            </p>
          </div>
        </div>

        {/* Aquafeel Program Section */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.35)]">
            <Heart size={30} fill="currentColor" />
          </div>
          <h3 className="mb-3 font-serif text-2xl font-black text-white md:text-3xl">{t.programTitle}</h3>
          <p className="leading-relaxed text-slate-400">{t.programDesc}</p>
        </div>

        {/* Hygiene Expenses Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-10">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-400" />

          <div className="mb-8">
            <label className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Users size={14} className="text-emerald-300" />
              {t.familySize}
            </label>
            <input
              type="number"
              min="1"
              value={familySize}
              onChange={(e) => setFamilySize(Math.max(1, Number(e.target.value)))}
              className={`${darkInput} max-w-xs`}
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: t.laundryCost, value: laundryCost, set: setLaundryCost },
              { label: t.kitchenCost, value: kitchenCost, set: setKitchenCost },
              { label: t.bathroomCost, value: bathroomCost, set: setBathroomCost },
            ].map((f, i) => (
              <div key={i} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {f.label}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    value={f.value || ''}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-6 pr-3 font-mono font-bold text-white outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6 md:flex-row">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                {t.hygieneTotal}
              </p>
              <p className="font-serif text-3xl font-black text-emerald-200">
                {formatCurrency(hygieneTotal)}
              </p>
            </div>
            <div className="h-px w-full bg-emerald-400/20 md:h-12 md:w-px" />
            <div className="text-right md:text-left">
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                {t.costPerPerson}
              </p>
              <p className="font-serif text-3xl font-black text-emerald-200">
                {formatCurrency(costPerPerson)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
