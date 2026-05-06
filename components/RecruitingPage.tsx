/**
 * RecruitingPage — /referral
 *
 * Job-opportunity landing page with:
 *  • Financial seduction / time-cost calculator
 *  • Aquafeel earnings benchmark
 *  • Testimonials
 *  • Google Calendar + WhatsApp scheduling CTA
 *
 * URL params:
 *   ?ref=ANALYST_NAME   — pre-fills "recommended by" in form
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, DollarSign, Users, CheckCircle, Star, ArrowRight,
  Calendar, MessageCircle, ChevronRight, ChevronLeft,
  Briefcase, Heart, Zap, TrendingUp, AlertTriangle,
} from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';

const M = motion.div as any;

/* ─── constants ──────────────────────────────────────────── */
const MANAGER_EMAIL = 'binnovationmarketing@gmail.com';
const MANAGER_WA    = '+12407806473';
const OFFICE        = '501 Cambria Ave, Bensalem, PA 19020';

const HOURS_YEAR = 24 * 365; // 8 760

/* ─── testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Camila Rodrigues',
    role: 'Ex-Atendente de Supermercado → Analista Jr.',
    avatar: 'CR',
    color: 'from-cyan-500 to-blue-600',
    text:
      'Trabalhava 44h por semana e mal pagava o aluguel. Em 3 meses na Aquafeel já igualei meu salário, em 6 meses o dobrei. O treinamento é real, o suporte também.',
    earnings: '$5,200 / mês',
  },
  {
    name: 'Diego Oliveira',
    role: 'Estudante → Analista Sênior em 8 meses',
    avatar: 'DO',
    color: 'from-emerald-500 to-teal-600',
    text:
      'Eu não sabia nada de vendas. Aprendi o script, aprendi a escutar o cliente e em 8 meses já estava treinando outras pessoas. A progressão é rápida se você se dedicar.',
    earnings: '$9,800 / mês',
  },
  {
    name: 'Mariana Costa',
    role: 'Mãe de dois filhos → Tempo livre + renda extra',
    avatar: 'MC',
    color: 'from-violet-500 to-purple-600',
    text:
      'O que me vendeu foi a flexibilidade. Escolho meus horários, trabalho de casa quando preciso. Meus filhos me veem mais — e ganho mais do que ganhava em 8h de escritório.',
    earnings: '$4,700 / mês',
  },
];

/* ─── calculator steps ───────────────────────────────────── */
interface CalcData {
  workHoursDay: number;
  workDaysWeek: number;
  sleepHoursDay: number;
  mealsPerDay: number;
  mealMinutes: number;
  showersPerDay: number;
  showerMinutes: number;
  exerciseDaysWeek: number;
  exerciseHoursSession: number;
  hasSpouse: boolean;
  spouseHoursDay: number;
  hasKids: boolean;
  kidsHoursDay: number;
}

const defaultData: CalcData = {
  workHoursDay: 8,
  workDaysWeek: 5,
  sleepHoursDay: 7,
  mealsPerDay: 3,
  mealMinutes: 30,
  showersPerDay: 1,
  showerMinutes: 15,
  exerciseDaysWeek: 0,
  exerciseHoursSession: 1,
  hasSpouse: false,
  spouseHoursDay: 1,
  hasKids: false,
  kidsHoursDay: 1,
};

function computeBreakdown(d: CalcData) {
  const workDay    = d.workHoursDay;
  const workWeek   = workDay * d.workDaysWeek;
  const workMonth  = workWeek * 4.33;
  const workYear   = workDay * d.workDaysWeek * 52;

  const sleepDay   = d.sleepHoursDay;
  const sleepYear  = sleepDay * 365;

  const mealDay    = (d.mealsPerDay * d.mealMinutes) / 60;
  const mealYear   = mealDay * 365;

  const showerDay  = (d.showersPerDay * d.showerMinutes) / 60;
  const showerYear = showerDay * 365;

  const exerciseWeek = d.exerciseDaysWeek * d.exerciseHoursSession;
  const exerciseYear = exerciseWeek * 52;

  const spouseDay  = d.hasSpouse ? d.spouseHoursDay : 0;
  const spouseYear = spouseDay * 365;

  const kidsDay    = d.hasKids ? d.kidsHoursDay : 0;
  const kidsYear   = kidsDay * 365;

  const totalUsedYear = workYear + sleepYear + mealYear + showerYear + exerciseYear + spouseYear + kidsYear;
  const freeYear       = Math.max(0, HOURS_YEAR - totalUsedYear);
  const freeHoursDay   = freeYear / 365;
  const freePct        = (freeYear / HOURS_YEAR) * 100;

  return {
    work:    { day: workDay,   week: workWeek,   month: workMonth,   year: workYear },
    sleep:   { day: sleepDay,  year: sleepYear },
    meal:    { day: mealDay,   year: mealYear },
    shower:  { day: showerDay, year: showerYear },
    exercise:{ week: exerciseWeek, year: exerciseYear },
    spouse:  { day: spouseDay, year: spouseYear },
    kids:    { day: kidsDay,   year: kidsYear },
    totalUsedYear,
    freeYear,
    freeHoursDay,
    freePct,
  };
}

/* ─── small helpers ──────────────────────────────────────── */
const fmt = (n: number, dec = 1) => n.toFixed(dec).replace('.', ',');
const fmtH = (n: number) => `${fmt(n, 0)}h`;

const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number;
  unit?: string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, unit = 'h', onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-300 font-medium">{label}</span>
      <span className="text-cyan-400 font-black text-sm">{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((value - min) / (max - min)) * 100}%, #334155 ${((value - min) / (max - min)) * 100}%, #334155 100%)`,
      }}
    />
    <div className="flex justify-between text-[10px] text-slate-600">
      <span>{min}{unit}</span><span>{max}{unit}</span>
    </div>
  </div>
);

const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
      value ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-400'
    }`}
  >
    <span>{label}</span>
    <span className={`w-10 h-6 rounded-full relative transition-all ${value ? 'bg-cyan-500' : 'bg-slate-700'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
    </span>
  </button>
);

/* ═══════════════════════════════════════════════════════════ */
export function RecruitingPage() {
  const [searchParams]  = useSearchParams();
  const analystRef      = searchParams.get('ref') || '';

  const [calc, setCalc]         = useState<CalcData>(defaultData);
  const [calcStep, setCalcStep] = useState(0); // 0 = not started, 1-6 = steps, 7 = result
  const [showForm, setShowForm] = useState(false);

  // Scheduling form
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const breakdown = useMemo(() => computeBreakdown(calc), [calc]);

  const set = (key: keyof CalcData) => (v: number | boolean) =>
    setCalc(prev => ({ ...prev, [key]: v }));

  /* ── Calculator Steps ── */
  const STEPS = [
    {
      title: '💼 Trabalho',
      desc: 'Quantas horas você trabalha?',
      content: (
        <div className="space-y-6">
          <Slider label="Horas por dia" value={calc.workHoursDay} min={1} max={16} onChange={set('workHoursDay')} />
          <Slider label="Dias por semana" value={calc.workDaysWeek} min={1} max={7} unit=" dias" onChange={set('workDaysWeek')} />
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Por semana', value: fmtH(calc.workHoursDay * calc.workDaysWeek) },
              { label: 'Por mês',    value: fmtH(calc.workHoursDay * calc.workDaysWeek * 4.33) },
              { label: 'Por ano',    value: fmtH(calc.workHoursDay * calc.workDaysWeek * 52) },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-white font-black text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '😴 Sono',
      desc: 'Quantas horas você dorme por dia?',
      content: (
        <div className="space-y-6">
          <Slider label="Horas de sono por dia" value={calc.sleepHoursDay} min={4} max={12} onChange={set('sleepHoursDay')} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Por mês',  value: fmtH(calc.sleepHoursDay * 30) },
              { label: 'Por ano',  value: fmtH(calc.sleepHoursDay * 365) },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-white font-black text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '🍽️ Refeições',
      desc: 'Quanto tempo você passa se alimentando?',
      content: (
        <div className="space-y-6">
          <Slider label="Refeições por dia" value={calc.mealsPerDay} min={1} max={6} unit="x" onChange={set('mealsPerDay')} />
          <Slider label="Tempo por refeição (incluindo deslocamento)" value={calc.mealMinutes} min={10} max={90} step={5} unit="min" onChange={set('mealMinutes')} />
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Por dia',  value: `${fmt((calc.mealsPerDay * calc.mealMinutes) / 60)}h` },
              { label: 'Por mês',  value: `${fmt((calc.mealsPerDay * calc.mealMinutes / 60) * 30)}h` },
              { label: 'Por ano',  value: `${fmt((calc.mealsPerDay * calc.mealMinutes / 60) * 365)}h` },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-white font-black text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '🚿 Higiene',
      desc: 'Quanto tempo no banheiro por dia?',
      content: (
        <div className="space-y-6">
          <Slider label="Banhos por dia" value={calc.showersPerDay} min={1} max={3} unit="x" onChange={set('showersPerDay')} />
          <Slider label="Minutos por banho" value={calc.showerMinutes} min={5} max={45} step={5} unit="min" onChange={set('showerMinutes')} />
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Por mês', value: `${fmt((calc.showersPerDay * calc.showerMinutes / 60) * 30)}h` },
              { label: 'Por ano', value: `${fmt((calc.showersPerDay * calc.showerMinutes / 60) * 365)}h` },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-white font-black text-lg">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '🏃 Atividade Física',
      desc: 'Você se exercita?',
      content: (
        <div className="space-y-6">
          <Slider label="Dias por semana (0 = não faço)" value={calc.exerciseDaysWeek} min={0} max={7} unit=" dias" onChange={set('exerciseDaysWeek')} />
          {calc.exerciseDaysWeek > 0 && (
            <Slider label="Horas por sessão" value={calc.exerciseHoursSession} min={0.5} max={3} step={0.5} onChange={set('exerciseHoursSession')} />
          )}
          {calc.exerciseDaysWeek === 0 && (
            <p className="text-slate-500 text-sm text-center italic">Sem atividade física contabilizada.</p>
          )}
          {calc.exerciseDaysWeek > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { label: 'Por semana', value: `${fmt(calc.exerciseDaysWeek * calc.exerciseHoursSession)}h` },
                { label: 'Por ano',    value: `${fmt(calc.exerciseDaysWeek * calc.exerciseHoursSession * 52)}h` },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">{s.label}</p>
                  <p className="text-white font-black text-lg">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '❤️ Família',
      desc: 'Quanto tempo você dedica às pessoas que ama?',
      content: (
        <div className="space-y-5">
          <Toggle label="Tem esposa / parceiro(a)?" value={calc.hasSpouse} onChange={set('hasSpouse') as any} />
          {calc.hasSpouse && (
            <Slider label="Horas por dia juntos" value={calc.spouseHoursDay} min={0.5} max={8} step={0.5} onChange={set('spouseHoursDay')} />
          )}
          <Toggle label="Tem filhos?" value={calc.hasKids} onChange={set('hasKids') as any} />
          {calc.hasKids && (
            <Slider label="Horas por dia com filhos" value={calc.kidsHoursDay} min={0.5} max={8} step={0.5} onChange={set('kidsHoursDay')} />
          )}
          {!calc.hasSpouse && !calc.hasKids && (
            <p className="text-slate-500 text-sm text-center italic">Sem dependentes contabilizados.</p>
          )}
        </div>
      ),
    },
  ];

  /* ── Calendar & WA links ── */
  const googleCalUrl = () => {
    const text      = encodeURIComponent('Entrevista Aquafeel Philly');
    const details   = encodeURIComponent(
      `Entrevista com o gestor da Aquafeel Philly.\n\nNome: ${form.name}\nTelefone: ${form.phone}\n${analystRef ? `Recomendado por: ${analystRef}` : ''}\n\nEndereço: ${OFFICE}`
    );
    const location  = encodeURIComponent(OFFICE);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&add=${encodeURIComponent(MANAGER_EMAIL)}`;
  };

  const waUrl = () => {
    const msg = encodeURIComponent(
      `Olá! Gostaria de agendar uma entrevista com a Aquafeel Philly.\n\n` +
      `👤 Nome: ${form.name}\n📞 Telefone: ${form.phone}\n` +
      (form.date ? `📅 Data: ${form.date}${form.time ? ' às ' + form.time : ''}\n` : '') +
      (analystRef ? `🔗 Recomendado por: ${analystRef}\n` : '') +
      `\nAguardo retorno! 😊`
    );
    return `https://wa.me/${MANAGER_WA}?text=${msg}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Open both links
    window.open(googleCalUrl(), '_blank');
    setTimeout(() => window.open(waUrl(), '_blank'), 800);
  };

  /* ── time budget bar ── */
  const usedPct = Math.min(100, (breakdown.totalUsedYear / HOURS_YEAR) * 100);

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="min-h-screen bg-[#020d1a] text-white overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-700/10 rounded-full blur-[140px]" />
      </div>

      {/* ─── NAVBAR ─── */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-5 border-b border-white/5">
        <AquaFeelLogo width="130px" variant="white" />
        <button
          onClick={() => document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition"
        >
          Agendar Entrevista
        </button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Oportunidade de Carreira — Aquafeel Philly
        </div>

        {analystRef && (
          <p className="text-slate-400 text-sm mb-4">
            Você foi convidado(a) por <span className="text-cyan-400 font-bold">{analystRef}</span>
          </p>
        )}

        <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
          Sua vida tem um{' '}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">preço?</span>
          <br />
          <span className="text-2xl md:text-4xl text-slate-300">Descubra o custo real do seu tempo.</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Você está trocando <strong className="text-white">horas irreversíveis da sua vida</strong> por um salário que mal cobre as contas.
          Nós calculamos. Os números vão te surpreender.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => { setCalcStep(1); document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(0,200,200,0.3)] hover:shadow-[0_0_60px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Clock size={18} /> Calcular meu tempo real →
          </button>
          <button
            onClick={() => document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 rounded-2xl border border-white/15 bg-white/5 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={16} /> Já quero agendar
          </button>
        </div>
      </section>

      {/* ─── FINANCIAL HOOK ─── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <AlertTriangle className="text-amber-400" size={28} />,
              title: 'Para ganhar $1.500/mês...',
              body: 'Trabalhando 40h/semana com salário mínimo dos EUA, você precisaria de ~3 meses de esforço contínuo apenas para acumular $1.500. E aí, você pagou o aluguel?',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
            {
              icon: <Clock className="text-red-400" size={28} />,
              title: 'O relógio não para.',
              body: 'Cada hora que passa é uma hora que você nunca recupera. A questão não é quanto você trabalha — é quanto você ganha por cada hora da sua vida.',
              color: 'border-red-500/30 bg-red-500/5',
            },
            {
              icon: <TrendingUp className="text-cyan-400" size={28} />,
              title: 'Existe outro caminho.',
              body: 'Na Aquafeel, analistas dedicando 4h/dia atingem $4.500–6.000/mês. Com 8h/dia: $9.000–12.000. Sem teto. Sem chefe te controlando.',
              color: 'border-cyan-500/30 bg-cyan-500/5',
            },
          ].map(c => (
            <div key={c.title} className={`border rounded-2xl p-6 ${c.color}`}>
              <div className="mb-4">{c.icon}</div>
              <h3 className="text-white font-black text-lg mb-3">{c.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TIME CALCULATOR ─── */}
      <section id="calculadora" className="relative z-10 px-6 py-16 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black mb-3">🕐 Calculadora do Seu Tempo</h2>
          <p className="text-slate-400">Responda honestamente. Os números não mentem.</p>
        </div>

        {calcStep === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-xl font-black mb-3">Quanto tempo você realmente tem para você?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Vamos calcular, com base na sua rotina real, quantas horas sobram das 24h do dia depois de todas as suas obrigações.
            </p>
            <button
              onClick={() => setCalcStep(1)}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 mx-auto"
            >
              Começar o cálculo <ArrowRight size={18} />
            </button>
          </div>
        )}

        {calcStep >= 1 && calcStep <= STEPS.length && (
          <M key={calcStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                Passo {calcStep} de {STEPS.length}
              </span>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i < calcStep ? 'w-6 bg-cyan-500' : 'w-4 bg-white/10'}`} />
                ))}
              </div>
            </div>

            <div className="mb-2 text-2xl font-black">{STEPS[calcStep - 1].title}</div>
            <p className="text-slate-400 text-sm mb-8">{STEPS[calcStep - 1].desc}</p>

            {STEPS[calcStep - 1].content}

            <div className="flex gap-3 mt-8">
              {calcStep > 1 && (
                <button
                  onClick={() => setCalcStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white font-bold text-sm transition-all"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
              )}
              <button
                onClick={() => setCalcStep(s => s === STEPS.length ? STEPS.length + 1 : s + 1)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {calcStep === STEPS.length ? 'Ver meu resultado 🎯' : 'Próximo'} <ChevronRight size={16} />
              </button>
            </div>
          </M>
        )}

        {/* RESULT */}
        {calcStep > STEPS.length && (
          <AnimatePresence>
            <M key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
              className="space-y-6">
              {/* Time budget bar */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-black mb-2">📊 Seu orçamento de tempo anual</h3>
                <p className="text-slate-400 text-sm mb-6">Total disponível: 8.760 horas/ano (24h × 365 dias)</p>

                <div className="space-y-3">
                  {[
                    { label: '💼 Trabalho',       hours: breakdown.work.year,    color: 'bg-blue-500' },
                    { label: '😴 Sono',            hours: breakdown.sleep.year,   color: 'bg-indigo-500' },
                    { label: '🍽️ Refeições',      hours: breakdown.meal.year,    color: 'bg-orange-500' },
                    { label: '🚿 Higiene',         hours: breakdown.shower.year,  color: 'bg-teal-500' },
                    { label: '🏃 Exercício',       hours: breakdown.exercise.year, color: 'bg-emerald-500' },
                    ...(calc.hasSpouse ? [{ label: '❤️ Parceiro(a)',  hours: breakdown.spouse.year, color: 'bg-pink-500' }] : []),
                    ...(calc.hasKids   ? [{ label: '👶 Filhos',       hours: breakdown.kids.year,   color: 'bg-yellow-500' }] : []),
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{row.label}</span>
                        <span className="font-bold text-white">{Math.round(row.hours)}h/ano</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.color}`}
                          style={{ width: `${Math.min(100, (row.hours / HOURS_YEAR) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free time reveal */}
                <div className={`mt-8 p-6 rounded-2xl border-2 ${breakdown.freeYear < 500 ? 'border-red-500/50 bg-red-500/10' : 'border-cyan-500/40 bg-cyan-500/10'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">⏰ Seu tempo livre real</p>
                      <p className="text-4xl font-black text-white">{Math.round(breakdown.freeYear)}<span className="text-lg text-slate-400">h/ano</span></p>
                      <p className="text-slate-400 text-sm">{fmt(breakdown.freeHoursDay)}h por dia — {fmt(breakdown.freePct, 0)}% da sua vida</p>
                    </div>
                    <div className={`text-5xl ${breakdown.freeYear < 500 ? 'grayscale opacity-50' : ''}`}>
                      {breakdown.freeYear < 200 ? '😰' : breakdown.freeYear < 500 ? '😟' : breakdown.freeYear < 1000 ? '🤔' : '😊'}
                    </div>
                  </div>
                  {breakdown.freeYear < 600 && (
                    <p className="mt-4 text-sm text-red-300 font-bold">
                      ⚠️ Com menos de {Math.round(breakdown.freeYear)}h livres por ano, você está trocando sua vida pelo salário atual. Vale a pena?
                    </p>
                  )}
                </div>
              </div>

              {/* Aquafeel comparison */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-8">
                <h3 className="text-xl font-black mb-2">💰 E se você virasse analista Aquafeel?</h3>
                <p className="text-slate-400 text-sm mb-6">
                  Com {Math.round(breakdown.work.year)}h/ano de trabalho você ganha seu salário atual.
                  <br />Na Aquafeel, com <strong className="text-cyan-400">muito menos horas</strong>:
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                    <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">4h/dia de dedicação</p>
                    <p className="text-2xl font-black text-cyan-400">$4.500 – 6.000</p>
                    <p className="text-slate-500 text-xs mt-1">por mês</p>
                  </div>
                  <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-5 text-center">
                    <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">8h/dia de dedicação</p>
                    <p className="text-2xl font-black text-emerald-400">$9.000 – 12.000</p>
                    <p className="text-slate-500 text-xs mt-1">por mês</p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-cyan-500 pl-4">
                  Com mais tempo livre e mais renda, você pode estar com a família, cuidar de você mesmo, e ainda construir um patrimônio real.
                  <strong className="text-white"> Isso é o que a Aquafeel oferece.</strong>
                </p>
              </div>

              <button
                onClick={() => document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(0,200,200,0.3)] hover:shadow-[0_0_60px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Calendar size={20} /> Quero agendar minha entrevista →
              </button>
            </M>
          </AnimatePresence>
        )}
      </section>

      {/* ─── EARNINGS PROOF ─── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">📈 Quanto você pode ganhar</h2>
          <p className="text-slate-400">Sem teto. Sem chefe. Com suporte real de uma equipe.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Mês 1–3',    range: '$1.500 – 3.000',  desc: 'Aprendendo + primeiras vendas',  icon: '🌱' },
            { label: 'Mês 3–6',    range: '$3.000 – 6.000',  desc: 'Ritmo estabelecido',              icon: '🔥' },
            { label: 'Mês 6–12',   range: '$6.000 – 9.000',  desc: 'Time e multiplicação',            icon: '🚀' },
            { label: 'Ano 1+',     range: '$9.000 – 15.000+', desc: 'Gerente / Mentor',               icon: '👑' },
          ].map(e => (
            <div key={e.label} className="bg-white/5 border border-white/10 hover:border-cyan-500/30 rounded-2xl p-5 text-center transition-all">
              <div className="text-3xl mb-3">{e.icon}</div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{e.label}</p>
              <p className="text-white font-black text-lg mb-2">{e.range}</p>
              <p className="text-slate-500 text-xs">{e.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <Briefcase size={20} className="text-cyan-400" />, title: 'Sem experiência necessária', body: 'Treinamento completo do zero. O que importa é atitude.' },
            { icon: <Clock size={20} className="text-emerald-400" />,  title: 'Horário flexível',           body: 'Trabalhe quando faz sentido para você. Full-time ou part-time.' },
            { icon: <Users size={20} className="text-violet-400" />,   title: 'Construa seu time',          body: 'Recrute, treine e ganhe em cima das vendas da sua equipe.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="shrink-0 mt-0.5">{f.icon}</div>
              <div>
                <p className="text-white font-black text-sm mb-1">{f.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">🗣️ Histórias Reais</h2>
          <p className="text-slate-400">Pessoas comuns. Resultados extraordinários.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-black text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} size={12} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <DollarSign size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-black text-sm">{t.earnings}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SCHEDULE CTA ─── */}
      <section id="agendar" className="relative z-10 px-6 py-20 max-w-xl mx-auto">
        <div className="bg-gradient-to-br from-white/5 to-white/3 border border-white/10 rounded-3xl p-8 md:p-10">
          {!submitted ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                  <Calendar size={12} /> Agendar Entrevista
                </div>
                <h2 className="text-2xl font-black mb-2">Dê o primeiro passo.</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Uma conversa de 30 minutos pode mudar sua vida financeira.
                  <br />Sem compromisso — só informação.
                </p>
                {analystRef && (
                  <p className="mt-3 text-xs text-slate-500">
                    Indicação de: <span className="text-cyan-400 font-bold">{analystRef}</span>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Seu nome completo *"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-4 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                />
                <input
                  required
                  type="tel"
                  placeholder="Seu telefone (WhatsApp) *"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded-2xl px-4 py-4 bg-white/5 border border-white/10 placeholder-slate-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-4 bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-2xl px-4 py-4 bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!form.name || !form.phone}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(0,200,200,0.3)] hover:shadow-[0_0_50px_rgba(0,200,200,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <Calendar size={18} /> Agendar no Google Calendar
                </button>

                <button
                  type="button"
                  disabled={!form.name || !form.phone}
                  onClick={() => window.open(waUrl(), '_blank')}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <MessageCircle size={18} /> Chamar no WhatsApp
                </button>
              </form>

              <p className="text-center text-slate-600 text-xs mt-5">
                📍 {OFFICE}
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <CheckCircle size={36} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">Perfeito! 🎉</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Seu agendamento foi enviado para o Google Calendar e nossa equipe foi notificada via WhatsApp.
                <br /><br />
                <strong className="text-white">Aguarde o contato do gestor</strong> para confirmar o horário.
              </p>
              <div className="flex gap-3">
                <a
                  href={googleCalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest text-center hover:bg-white/15 transition-all"
                >
                  Ver no Calendar
                </a>
                <a
                  href={waUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase tracking-widest text-center hover:bg-emerald-600/30 transition-all"
                >
                  Abrir WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center">
        <AquaFeelLogo width="120px" variant="white" />
        <p className="text-slate-600 text-xs mt-4">
          Aquafeel Solutions Philly © {new Date().getFullYear()} — {OFFICE}
        </p>
      </footer>
    </div>
  );
}
