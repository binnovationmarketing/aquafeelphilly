
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Droplets,
  AlertTriangle,
  ArrowRight,
  MapPin,
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react';
import { Language, translations } from '../utils/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { FluidDropdown } from './ui/fluid-dropdown';
import { Component as UrgencyChart } from './ui/real-time-analytics';
import { supabase } from '../lib/supabase';
import { ClientAccessModal } from './ClientAccessModal';
import { toast } from 'sonner';

interface ComparisonCalculatorProps {
  clientId?: string;
  lang: Language;
  isExpired?: boolean;
  onSaveProposal?: (data: {
    waterMonthly: number;
    cleaningMonthly: number;
    creditRange: string;
    plan: string;
    monthlyAmount: number;
  }) => Promise<void>;
}

type RegionId = 'NE' | 'SOUTH';
type CreditRangeId = 'RANGE1' | 'RANGE2' | 'RANGE3' | 'RANGE4' | 'RANGE5';

export const ComparisonCalculator: React.FC<ComparisonCalculatorProps> = ({
  clientId,
  lang,
  isExpired = false,
  onSaveProposal
}) => {
  const waterTotal = useAppStore((state: any) => state.waterTotal);
  const cleaningTotal = useAppStore((state: any) => state.cleaningTotal);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('180x');
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('NE');
  const [selectedCredit, setSelectedCredit] = useState<CreditRangeId>('RANGE3');
  const [customWater, setCustomWater] = useState<number>(waterTotal);
  const [customCleaning, setCustomCleaning] = useState<number>(cleaningTotal);

  useEffect(() => {
    setCustomWater(waterTotal);
    setCustomCleaning(cleaningTotal);
  }, [waterTotal, cleaningTotal]);

  const t = translations[lang].calculator;

  // Lógica de Preços e Fatores de Crédito
  const SYSTEM_PRICE = selectedRegion === 'NE' ? 8790 : 7990;

  const factors: Record<CreditRangeId, { '180x': number; '120x': number; '60x': number }> = {
    RANGE1: { '180x': 1.14, '120x': 1.38, '60x': 2.17 },
    RANGE2: { '180x': 1.24, '120x': 1.47, '60x': 2.25 },
    RANGE3: { '180x': 1.37, '120x': 1.59, '60x': 2.39 },
    RANGE4: { '180x': 1.55, '120x': 1.74, '60x': 2.61 },
    RANGE5: { '180x': 1.62, '120x': 1.80, '60x': 2.70 }
  };

  const creditFactors = factors[selectedCredit];
  const calculateMonthly = (factor: number) => Math.round((SYSTEM_PRICE * factor) / 100);

  const plans = [
    { id: '180x', label: `180 ${t.months}`, amount: calculateMonthly(creditFactors['180x']), months: 180 },
    { id: '120x', label: `120 ${t.months}`, amount: calculateMonthly(creditFactors['120x']), months: 120 },
    { id: '60x', label: `60 ${t.months}`, amount: calculateMonthly(creditFactors['60x']), months: 60 },
    { id: 'cash', label: t.cash, amount: SYSTEM_PRICE, isFull: true, months: 0 },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[0];
  const monthlyTotalSpending = customWater + customCleaning;

  // Autosave changes to the DB for follow-up
  useEffect(() => {
    if (!clientId) return;

    const timeoutId = setTimeout(async () => {
      const scoreMap: Record<CreditRangeId, number> = {
        RANGE1: 740,
        RANGE2: 720,
        RANGE3: 680,
        RANGE4: 640,
        RANGE5: 600,
      };

      try {
        await supabase
          .from('clients')
          .update({
            water_consumption: customWater,
            cleaning_consumption: customCleaning,
            credit_score: scoreMap[selectedCredit],
            financing_months: currentPlan.months,
            monthly_payment: currentPlan.amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientId);
      } catch (error) {
        console.error('Auto-save CRM error:', error);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [clientId, customWater, customCleaning, selectedCredit, selectedPlan, currentPlan.amount, currentPlan.months, selectedRegion]);



  const regionOptions = [
    { id: 'NE', label: 'NJ, PA, DE', icon: MapPin },
    { id: 'SOUTH', label: 'MD, VA, DC, NC', icon: MapPin }
  ];

  const creditOptions = [
    { id: 'RANGE1', label: '740+', score: "EXCELLENT" },
    { id: 'RANGE2', label: '700-739', score: "GREAT" },
    { id: 'RANGE3', label: '660-699', score: "GOOD" },
    { id: 'RANGE4', label: '620-659', score: "FAIR" },
    { id: 'RANGE5', label: '619-', score: "CHALLENGED" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-20">
      <div className="flex flex-col lg:flex-row shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-100 bg-white">

        {/* LADO ESQUERDO (LOJA/MERCADO) */}
        <div className="w-full lg:w-1/2 p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col justify-between bg-slate-50/50">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                <ShoppingCart className="text-slate-600" size={28} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {lang === 'pt' ? 'Loja (Mercado)' : lang === 'es' ? 'Tienda (Mercado)' : 'Market / Store'}
                </h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase mt-2">
                  {lang === 'pt' ? 'Gastos com água e sabão' : lang === 'es' ? 'Gastos en agua y jabón' : 'Water & Soap Expenses'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500">
                <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Droplets size={14} className="text-blue-500" />
                  {lang === 'pt' ? 'Gastos em Água Mensal' : lang === 'es' ? 'Gastos en Agua Mensual' : 'Monthly Water Expenses'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={customWater}
                    onChange={(e) => setCustomWater(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 rounded-xl text-slate-900 font-black text-xl md:text-2xl outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-emerald-500">
                <label className="flex items-center gap-2 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  <ShoppingCart size={14} className="text-emerald-500" />
                  {lang === 'pt' ? 'Gastos em Sabão Mensal' : lang === 'es' ? 'Gastos en Jabón Mensual' : 'Monthly Soap Expenses'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={customCleaning}
                    onChange={(e) => setCustomCleaning(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 rounded-xl text-slate-900 font-black text-xl md:text-2xl outline-none"
                  />
                </div>
              </div>

              <ul className="text-xs text-slate-500 space-y-3 font-bold mt-6 px-2">
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">⚠️</span> <span>Água contaminada por plásticos e produtos químicos</span></li>
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">💸</span> <span>Sem retorno financeiro a longo prazo</span></li>
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">♾️</span> <span>Gasto por toda a vida</span></li>
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">🚫</span> <span>Nada de retorno financeiro</span></li>
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">🏥</span> <span>Nenhum retorno de saúde</span></li>
                <li className="flex gap-3 items-start"><span className="shrink-0 pt-0.5">📈</span> <span>Produtos cada vez mais caros</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-center relative shadow-xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-[0.3em]">
                {lang === 'pt' ? 'Custo Mensal Perdido' : lang === 'es' ? 'Costo Mensual Perdido' : 'Monthly Cost Lost'}
              </p>
              <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">${monthlyTotalSpending.toFixed(2)}</div>
              <div className="mt-5 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                <AlertTriangle size={12} />
                {lang === 'pt' ? 'Dinheiro sem retorno na saúde' : lang === 'es' ? 'Dinero sin retorno en la salud' : 'Money with no health return'}
              </div>
            </div>
          </div>
        </div>

        {/* LADO DIREITO (PROJETO AQUAFEEL) */}
        <div className={`w-full lg:w-1/2 p-6 md:p-10 flex flex-col relative ${isExpired ? 'bg-slate-900' : 'bg-slate-950 text-white'}`}>
          <div className="mb-8 flex items-center gap-4">
            <div className="w-14 h-14 bg-aqua-500/20 rounded-2xl flex items-center justify-center border border-aqua-500/30 shrink-0">
              <Droplets size={28} className="text-aqua-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none">Projeto Aquafeel</h2>
              <p className="text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase mt-2 text-aqua-400">
                {lang === 'pt' ? 'Água pura em toda a casa' : lang === 'es' ? 'Agua pura en todo el hogar' : 'Pure water throughout your home'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
            <ul className="space-y-5">
              <li className="flex gap-4 items-start text-sm md:text-base font-bold text-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <span className="mt-1">Tanque duplo de purificação para toda a casa (Garantia de 25 Anos)</span>
              </li>
              <li className="flex gap-4 items-start text-sm md:text-base font-bold text-slate-200">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <span className="mt-1">Sistema de RO Alcalino (Melhor sistema do mercado - Watts) (Garantia de 25 anos)</span>
              </li>
              <li className="flex gap-4 items-start text-sm md:text-base font-bold text-slate-200">
                <div className="w-8 h-8 rounded-full bg-[#11caa0]/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle size={16} className="text-[#11caa0]" />
                </div>
                <div>
                  <span className="text-[#11caa0] font-black uppercase tracking-widest text-[10px] block mb-1">Recomende e ganhe:</span>
                  3 analises de agua na casa que qualifiquem de familias e receba 1 ano de Sabões orgânicos para toda a casa gratis
                </div>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <FluidDropdown label="Selecione Custo Base de Região" options={regionOptions} selectedId={selectedRegion} onSelect={(id) => setSelectedRegion(id as RegionId)} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {plans.map((p) => (
              <button
                key={p.id} onClick={() => setSelectedPlan(p.id)}
                className={`py-4 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedPlan === p.id ? 'bg-white text-slate-950 border-white shadow-lg transform scale-[1.02]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-8 overflow-hidden">
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Score de Crédito Estimado</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {creditOptions.map((opt) => (
                <button
                  key={opt.id} onClick={() => setSelectedCredit(opt.id as CreditRangeId)}
                  className={`flex flex-col min-w-[110px] p-3 rounded-xl border transition-all shrink-0 ${selectedCredit === opt.id ? 'bg-aqua-500 border-aqua-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <span className="text-[10px] font-black opacity-70 mb-1">{opt.score}</span>
                  <span className="text-sm font-black">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center mb-8 py-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Mensalidade Aquafeel</p>
            <div className="text-6xl md:text-7xl font-black text-white tracking-tighter flex items-start gap-1">
              <span className="text-2xl mt-3 opacity-30">$</span>{currentPlan.amount}
              {currentPlan.id !== 'cash' && <span className="text-lg text-slate-400 mt-auto mb-4 font-bold">/mês</span>}
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <a
              href="https://aquafeelsolutions.com/credit-form/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/50"
            >
              <span className="uppercase tracking-[0.2em] text-sm md:text-base">Aplique Já</span>
              <ArrowRight size={20} className="animate-pulse" />
            </a>

            {onSaveProposal && (
              <button
                onClick={() => {
                  onSaveProposal({
                    waterMonthly: customWater,
                    cleaningMonthly: customCleaning,
                    creditRange: selectedCredit,
                    plan: selectedPlan,
                    monthlyAmount: currentPlan.amount
                  });
                }}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                <Save size={18} />
                {lang === 'pt' ? 'Guardar Proposta' : lang === 'es' ? 'Guardar Propuesta' : 'Save Proposal'}
              </button>
            )}
          </div>
        </div>
      </div>

      <UrgencyChart
        waterMonthly={customWater}
        soapMonthly={customCleaning}
        fixedMonthly={currentPlan.id === 'cash' ? (SYSTEM_PRICE / 12) : currentPlan.amount}
        cashPrice={SYSTEM_PRICE}
        lang={lang}
        financingMonths={currentPlan.months}
        creditScoreLabel={creditOptions.find(o => o.id === selectedCredit)?.score || "GOOD"}
      />

      {isClientModalOpen && (
        <ClientAccessModal onClose={() => setIsClientModalOpen(false)} />
      )}
    </div>
  );
};
