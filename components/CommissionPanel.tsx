import React, { useState } from 'react';
import {
  TrendingUp, DollarSign, Users, Star, ArrowUp, Award, Target, Calculator
} from 'lucide-react';
import {
  HierarchyRole,
  ROLE_LABELS_PT,
  ROLE_COMMISSION,
  ROLE_COLORS,
  calcPersonalCommission,
  calcDifferentialBonus,
  calcRecruitmentBonus,
  getLevelGoal,
  RECRUITMENT_BONUS_ROLES,
} from '../utils/commissions';

/* ─────────────────── Types ─────────────────── */
interface AnalystStat {
  id: string;
  name: string;
  role: HierarchyRole;
  totalSales: number;
  totalLeads: number;
  conversionRate: number;
}

interface CommissionPanelProps {
  /** Current role of the logged-in user */
  role: HierarchyRole;
  /** Personal sales count */
  personalSales: number;
  /** Team sales count (all downline) */
  teamSales: number;
  /** List of direct downline analysts (for manager view) */
  teamAnalysts?: AnalystStat[];
  /** Expected monthly earnings fetched from log */
  monthlyEarnings?: { personal: number; team: number; total: number };
}

/* ─────────────────── Helpers ─────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/* ─────────────────── Sub-components ─────────────────── */

/** Personal earnings summary card */
const EarningsCard: React.FC<{ role: HierarchyRole; monthlyEarnings?: { personal: number; team: number; total: number } }> = ({ role, monthlyEarnings }) => {
  const personalCommission = calcPersonalCommission(role);
  const colors = ROLE_COLORS[role];
  
  const personal = monthlyEarnings?.personal || 0;
  const team = monthlyEarnings?.team || 0;
  const total = monthlyEarnings?.total || 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-6`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <DollarSign size={128} />
      </div>
      <div className="flex items-start justify-between mb-4 flex-col sm:flex-row gap-4">
        <div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text} opacity-70`}>
            Desempenho no Mês Atual
          </span>
          <h3 className={`text-4xl font-black ${colors.text} tracking-tight mt-1`}>{fmt(total)}</h3>
        </div>
        <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black mb-1 ${colors.badge} shadow-sm border ${colors.border}`}>
            {ROLE_LABELS_PT[role]}
          </span>
          <span className={`text-[10px] uppercase font-black tracking-widest ${colors.text} opacity-60`}>
            Bônus Base: {fmt(personalCommission)}/venda
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-white/40 border border-white/20 backdrop-blur-sm">
        <div className="flex sm:block items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
            <TrendingUp size={12} className={colors.text} /> Suas Vendas
          </p>
          <p className={`text-xl font-black text-slate-800`}>{fmt(personal)}</p>
        </div>
        <div className="flex sm:block items-center justify-between pt-3 sm:pt-0 border-t sm:border-0 border-white/20">
          <p className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">
            <Users size={12} className="text-indigo-500" /> Bônus Equipe
          </p>
          <p className={`text-xl font-black text-indigo-700`}>{fmt(team)}</p>
        </div>
      </div>
    </div>
  );
};

/** Progress to next level */
const NextLevelCard: React.FC<{ role: HierarchyRole; personalSales: number; teamSales: number }> = ({
  role, personalSales, teamSales
}) => {
  const goal = getLevelGoal(role, personalSales, teamSales);

  if (goal.isTopLevel) {
    return (
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center">
          <Award size={24} className="text-yellow-600" />
        </div>
        <div>
          <h3 className="font-black text-yellow-800 text-lg">Nível Máximo!</h3>
          <p className="text-yellow-700 text-sm">Você é Embaixador — o topo da hierarquia.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <ArrowUp size={16} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Próximo Nível</p>
            <h3 className="font-black text-slate-900">{goal.nextLabel}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Bônus máx.</p>
          <p className="font-black text-teal-600">{fmt(goal.nextCommission)}/venda</p>
        </div>
      </div>

      {/* Personal sales progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
          <span>Vendas Pessoais</span>
          <span>{personalSales} / {goal.personalNeeded}</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-700"
            style={{ width: `${goal.personalProgress}%` }}
          />
        </div>
      </div>

      {/* Team sales progress */}
      {goal.teamNeeded > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1 font-semibold">
            <span>Vendas da Equipe</span>
            <span>{teamSales} / {goal.teamNeeded}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${goal.teamProgress}%` }}
            />
          </div>
        </div>
      )}

      {goal.salesToNext > 0 && (
        <div className="mt-4 p-3 bg-teal-50 border border-teal-100 rounded-xl text-center">
          <p className="text-sm font-black text-teal-800">
            🎯 {goal.salesToNext} venda{goal.salesToNext !== 1 ? 's' : ''} para {goal.nextLabel}
          </p>
        </div>
      )}
    </div>
  );
};

/** Commission structure reference card */
const CommissionTableCard: React.FC<{ currentRole: HierarchyRole }> = ({ currentRole }) => {
  const ROLE_ORDER: HierarchyRole[] = [
    'analyst_jr', 'analyst_sr', 'mentor_jr', 'mentor_sr',
    'manager_jr', 'manager_sr', 'director_jr', 'director_sr',
    'master', 'ambassador',
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Target size={16} className="text-slate-600" />
        </div>
        <h3 className="font-black text-slate-900">Ganhos por Mérito Próprio</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {ROLE_ORDER.map(role => {
          const isCurrent = role === currentRole;
          const colors = ROLE_COLORS[role];
          return (
            <div
              key={role}
              className={`flex items-center justify-between px-5 py-3 transition-colors ${isCurrent ? `${colors.bg} font-black` : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                {isCurrent && <Star size={12} className="text-teal-600 fill-teal-600" />}
                <span className={`text-sm ${isCurrent ? colors.text + ' font-black' : 'text-slate-600'}`}>
                  {ROLE_LABELS_PT[role]}
                </span>
              </div>
              <span className={`text-sm font-black ${isCurrent ? colors.text : 'text-slate-500'}`}>
                {fmt(ROLE_COMMISSION[role])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BLUR_ROLES: HierarchyRole[] = ['director_jr', 'director_sr', 'master', 'ambassador'];

/** Team leaderboard for manager view */
const TeamLeaderboard: React.FC<{ analysts: AnalystStat[]; myRole: HierarchyRole }> = ({ analysts, myRole }) => {
  const sorted = [...analysts].sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Users size={16} className="text-indigo-600" />
          </div>
          <h3 className="font-black text-slate-900">Performance da Equipe</h3>
        </div>
        <span className="text-xs font-bold text-slate-400">{analysts.length} analista{analysts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
              <th className="px-5 py-3 text-left">#</th>
              <th className="px-5 py-3 text-left">Analista</th>
              <th className="px-5 py-3 text-left">Cargo</th>
              <th className="px-5 py-3 text-right">Vendas</th>
              <th className="px-5 py-3 text-right">Comissão Gerada</th>
              <th className="px-5 py-3 text-right">Seu Diferencial</th>
              <th className="px-5 py-3 text-right">Conv.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((analyst, idx) => {
              const analystRole = (analyst.role && ROLE_COLORS[analyst.role as HierarchyRole]) ? analyst.role as HierarchyRole : 'analyst_jr';
              const commission = calcPersonalCommission(analystRole);
              const totalComm = commission * analyst.totalSales;
              const myDiff = calcDifferentialBonus(myRole, analystRole) * analyst.totalSales;
              const colors = ROLE_COLORS[analystRole];
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
              const blurred = BLUR_ROLES.includes(analystRole);

              return (
                <tr key={analyst.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-black text-slate-500 text-base">{medal}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600">
                        {analyst.name?.[0] ?? 'A'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{analyst.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${colors.badge}`}>
                      {ROLE_LABELS_PT[analystRole]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-black text-slate-900">{analyst.totalSales}</td>
                  <td className="px-5 py-4 text-right font-bold text-emerald-600">
                    <span className={blurred ? 'blur-sm select-none' : ''}>{fmt(totalComm)}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-indigo-600">
                    <span className={blurred ? 'blur-sm select-none' : ''}>{fmt(myDiff)}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-slate-500">{analyst.conversionRate.toFixed(0)}%</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                  Nenhum analista cadastrado na sua equipe ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────── Commission Calculator ─────────────────── */

const APPROVAL_PCTS = [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00];
const FIXED_COSTS = 50; // Convention $25 + Insurance $25
const BASE_DEDUCTION = 4790;

interface CalcState {
  saleType: 'city' | 'well';
  salePrice: number;
  approvalPct: number;
  installCost: number;
}

const CommissionCalculator: React.FC<{ role: HierarchyRole }> = ({ role }) => {
  const maxCommission = ROLE_COMMISSION[role];

  const [c, setC] = useState<CalcState>({
    saleType: 'city',
    salePrice: 7990,
    approvalPct: 0.80,
    installCost: 550,
  });

  const minPrice = c.saleType === 'city' ? 7990 : 8990;
  const maxPrice = c.saleType === 'city' ? 8790 : 11990;

  // Clamp price when type changes
  const setType = (t: 'city' | 'well') => {
    const newMin = t === 'city' ? 7990 : 8990;
    const newMax = t === 'city' ? 8790 : 11990;
    setC(prev => ({
      ...prev,
      saleType: t,
      salePrice: Math.min(Math.max(prev.salePrice, newMin), newMax),
    }));
  };

  const gross    = c.salePrice * c.approvalPct;
  const netComm  = Math.max(0, gross - BASE_DEDUCTION - c.installCost - FIXED_COSTS);
  const earned   = Math.min(netComm, maxCommission);
  const cappedAt = netComm > maxCommission;

  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <Calculator size={16} className="text-teal-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-900">Calculadora de Comissão</h3>
          <p className="text-xs text-slate-500">Simule quanto você ganha por venda</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Sale type */}
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tipo de Água</p>
          <div className="grid grid-cols-2 gap-3">
            {(['city', 'well'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${
                  c.saleType === t
                    ? 'border-teal-500 bg-teal-500 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                }`}
              >
                {t === 'city' ? 'Agua de Cidade' : 'Agua de Poco'}
                <span className="block text-[10px] font-normal mt-0.5 opacity-80">
                  {t === 'city' ? '$7,990 – $8,790' : '$8,990 – $11,990'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sale price */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Valor da Venda</p>
            <p className="text-xs font-black text-teal-700">{fmt(c.salePrice)}</p>
          </div>
          <input
            type="range" min={minPrice} max={maxPrice} step={10}
            value={c.salePrice}
            onChange={e => setC(prev => ({ ...prev, salePrice: +e.target.value }))}
            className="w-full accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>{fmt(minPrice)}</span><span>{fmt(maxPrice)}</span>
          </div>
        </div>

        {/* Approval % */}
        <div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Aprovação Financeira</p>
          <div className="flex flex-wrap gap-2">
            {APPROVAL_PCTS.map(p => (
              <button
                key={p}
                onClick={() => setC(prev => ({ ...prev, approvalPct: p }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                  c.approvalPct === p
                    ? 'bg-teal-500 border-teal-500 text-white shadow'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                }`}
              >
                {(p * 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>

        {/* Installation cost */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Custo de Instalação</p>
            <p className="text-xs font-black text-slate-700">{fmt(c.installCost)}</p>
          </div>
          <input
            type="range" min={450} max={650} step={10}
            value={c.installCost}
            onChange={e => setC(prev => ({ ...prev, installCost: +e.target.value }))}
            className="w-full accent-slate-400"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>$450</span><span>$650</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Valor aprovado ({(c.approvalPct * 100).toFixed(0)}%)</span>
            <span>{fmt(gross)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Deducao base</span>
            <span className="text-red-400">- {fmt(BASE_DEDUCTION)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Instalacao</span>
            <span className="text-red-400">- {fmt(c.installCost)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Custos fixos (Convencao + Seguro)</span>
            <span className="text-red-400">- {fmt(FIXED_COSTS)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-lg">
            <span className="text-slate-800">Sua Comissao</span>
            <span className={earned > 0 ? 'text-teal-600' : 'text-red-500'}>{fmt(earned)}</span>
          </div>
          {cappedAt && (
            <p className="text-[10px] text-amber-600 font-bold text-center pt-1">
              Cap de {fmt(maxCommission)} aplicado ({ROLE_LABELS_PT[role]})
            </p>
          )}
          {earned <= 0 && (
            <p className="text-[10px] text-red-500 font-bold text-center pt-1">
              Aprovacao insuficiente para cobrir custos nesta venda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Main Export ─────────────────── */
export const CommissionPanel: React.FC<CommissionPanelProps> = ({
  role, personalSales, teamSales, teamAnalysts = [], monthlyEarnings
}) => {
  const safeRole = (role && ROLE_COLORS[role]) ? role : 'analyst_jr';
  const isManager = !RECRUITMENT_BONUS_ROLES.includes(safeRole);

  return (
    <div className="space-y-6">
      {/* Row 1: Earnings + Next Level */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EarningsCard role={safeRole} monthlyEarnings={monthlyEarnings} />
        <NextLevelCard role={safeRole} personalSales={personalSales} teamSales={teamSales} />
      </div>

      {/* Row 2: Table + Leaderboard (for managers) or just Table */}
      {isManager && teamAnalysts.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TeamLeaderboard analysts={teamAnalysts} myRole={safeRole} />
          </div>
          <div>
            <CommissionTableCard currentRole={safeRole} />
          </div>
        </div>
      ) : (
        <CommissionTableCard currentRole={safeRole} />
      )}

      {/* Commission Calculator */}
      <CommissionCalculator role={safeRole} />

      {/* Stats banner - Stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 text-center">
          <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase mb-1 flex justify-center items-center gap-1">
            <TrendingUp size={12} /> Vendas Pessoais
          </p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{personalSales}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 text-center">
          <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase mb-1 flex justify-center items-center gap-1">
            <Users size={12} /> Vendas Equipe
          </p>
          <p className="text-2xl md:text-3xl font-black text-slate-900">{teamSales}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5 text-center text-ellipsis overflow-hidden">
          <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase mb-1 flex justify-center items-center gap-1">
            <DollarSign size={12} /> Comissão Máx.
          </p>
          <p className="text-2xl md:text-3xl font-black text-teal-600 truncate">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(ROLE_COMMISSION[safeRole])}
          </p>
        </div>
      </div>
    </div>
  );
};

export type { AnalystStat };
