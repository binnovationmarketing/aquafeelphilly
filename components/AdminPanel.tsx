import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ROLE_LABELS, useAuth } from '../contexts/AuthContext';
import {
  Star, Trophy, MapPin, Shield, UserCog, Check,
  TrendingUp, Users, DollarSign, Calendar, KeyRound, Loader2, Eye, EyeOff,
} from 'lucide-react';

const ADMIN_EMAIL = 'binnovationmarketing@gmail.com';
const RESET_FN_URL = 'https://dznjduuyxwndqgrayxgw.supabase.co/functions/v1/admin-reset-password';
import {
  ROLE_COMMISSION,
  ROLE_COLORS,
  ROLE_LABELS_PT,
  HierarchyRole,
} from '../utils/commissions';

// ─── types ───────────────────────────────────────────────────────────────────

interface Analyst {
  id: string;
  first_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
}

interface AnalystStats {
  monthlySales: number;
  annualSales: number;
  monthlyEarnings: number;
  annualEarnings: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const displayName = (a: Analyst): string =>
  a.full_name || a.first_name || 'Usuário';

const commissionForRole = (role: string): number =>
  ROLE_COMMISSION[role as HierarchyRole] ?? 1500;

const roleColors = (role: string) =>
  ROLE_COLORS[role as HierarchyRole] ?? ROLE_COLORS['analyst_jr'];

const firstDayOf = (unit: 'month' | 'year'): string => {
  const now = new Date();
  const d =
    unit === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);
  return d.toISOString();
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

// ─── bar colors ──────────────────────────────────────────────────────────────

const barColor = (sales: number): string => {
  if (sales < 2) return 'bg-red-400';
  if (sales < 4) return 'bg-yellow-400';
  if (sales < 6) return 'bg-blue-500';
  if (sales < 10) return 'bg-emerald-500';
  return 'bg-gradient-to-r from-amber-400 to-yellow-300';
};

// ─── milestone config ─────────────────────────────────────────────────────────

const MILESTONES = [
  { at: 2,  label: 'Ativo',         icon: 'pin',    color: 'text-slate-500'  },
  { at: 4,  label: 'Meta Regional', icon: 'pin',    color: 'text-blue-500'   },
  { at: 6,  label: 'GOLD',          icon: 'star',   color: 'text-emerald-500' },
  { at: 10, label: 'Viagem',        icon: 'trophy', color: 'text-amber-500'  },
] as const;

const MAX_DISPLAY = 12;

// ─── sub-components ───────────────────────────────────────────────────────────

const MilestoneIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = '' }) => {
  if (icon === 'star')   return <Star  size={12} className={className} />;
  if (icon === 'trophy') return <Trophy size={12} className={className} />;
  return <MapPin size={12} className={className} />;
};

// ─── timeline card ────────────────────────────────────────────────────────────

const TimelineCard: React.FC<{ analyst: Analyst; stats: AnalystStats }> = ({ analyst, stats }) => {
  const { monthlySales, annualSales, monthlyEarnings, annualEarnings } = stats;
  const pct = Math.min(monthlySales / MAX_DISPLAY, 1) * 100;
  const colors = roleColors(analyst.role);
  const initial = displayName(analyst).charAt(0).toUpperCase();
  const roleLabel =
    ROLE_LABELS_PT[analyst.role as HierarchyRole] ||
    ROLE_LABELS[analyst.role as keyof typeof ROLE_LABELS] ||
    analyst.role;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colors.badge}`}>
          {analyst.avatar_url ? (
            <img src={analyst.avatar_url} alt={displayName(analyst)} className="w-full h-full object-cover rounded-full" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800 truncate">{displayName(analyst)}</p>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors.badge}`}>
            {roleLabel}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500">Mês</p>
          <p className="font-bold text-slate-800">{monthlySales} vendas</p>
        </div>
      </div>

      {/* bar */}
      <div className="relative mb-6">
        {/* milestone labels above */}
        <div className="relative h-5 mb-1">
          {MILESTONES.map((m) => {
            const leftPct = (m.at / MAX_DISPLAY) * 100;
            return (
              <div
                key={m.at}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPct}%` }}
              >
                <span className={`text-[10px] font-semibold leading-none ${m.color}`}>{m.label}</span>
              </div>
            );
          })}
        </div>

        {/* track */}
        <div className="relative h-3 bg-slate-100 rounded-full overflow-visible">
          {/* fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(monthlySales)}`}
            style={{ width: `${pct}%` }}
          />

          {/* milestone dots */}
          {MILESTONES.map((m) => {
            const leftPct = (m.at / MAX_DISPLAY) * 100;
            const reached = monthlySales >= m.at;
            return (
              <div
                key={m.at}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${leftPct}%` }}
              >
                <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center z-10
                  ${reached
                    ? 'border-white bg-white shadow-md'
                    : 'border-slate-300 bg-white'
                  }`}
                >
                  <MilestoneIcon icon={m.icon} className={reached ? m.color : 'text-slate-300'} />
                </div>
              </div>
            );
          })}

          {/* analyst position pin */}
          {monthlySales > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
              style={{ left: `${pct}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-700 shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
              </div>
            </div>
          )}
        </div>

        {/* scale labels */}
        <div className="relative h-4 mt-0.5">
          {[0, 3, 6, 9, 12].map((n) => (
            <span
              key={n}
              className="absolute -translate-x-1/2 text-[10px] text-slate-400"
              style={{ left: `${(n / MAX_DISPLAY) * 100}%` }}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Mês</span>
          </div>
          <p className="text-sm font-bold text-slate-700">{monthlySales} vendas</p>
          <p className="text-xs text-emerald-600 font-semibold">{fmt(monthlyEarnings)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ano</span>
          </div>
          <p className="text-sm font-bold text-slate-700">{annualSales} vendas</p>
          <p className="text-xs text-emerald-600 font-semibold">{fmt(annualEarnings)}</p>
        </div>
      </div>
    </div>
  );
};

// ─── stats header ─────────────────────────────────────────────────────────────

const StatsHeader: React.FC<{
  analysts: Analyst[];
  statsMap: Record<string, AnalystStats>;
}> = ({ analysts, statsMap }) => {
  const totalSales = analysts.reduce((s, a) => s + (statsMap[a.id]?.monthlySales ?? 0), 0);
  const totalEarnings = analysts.reduce((s, a) => s + (statsMap[a.id]?.monthlyEarnings ?? 0), 0);
  const avg = analysts.length > 0 ? totalSales / analysts.length : 0;
  const top = [...analysts].sort(
    (a, b) => (statsMap[b.id]?.monthlySales ?? 0) - (statsMap[a.id]?.monthlySales ?? 0)
  )[0];

  const cards = [
    { icon: <TrendingUp size={18} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Vendas Equipe (Mês)', value: String(totalSales) },
    { icon: <DollarSign size={18} className="text-blue-600" />, bg: 'bg-blue-50', label: 'Total Gerado (Mês)', value: fmt(totalEarnings) },
    { icon: <Users size={18} className="text-indigo-600" />, bg: 'bg-indigo-50', label: 'Média por Analista', value: avg.toFixed(1) },
    { icon: <Star size={18} className="text-amber-600" />, bg: 'bg-amber-50', label: 'Top Performer', value: top ? displayName(top) : '—' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-2xl p-4 flex items-start gap-3`}>
          <div className="mt-0.5">{c.icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">{c.label}</p>
            <p className="text-lg font-bold text-slate-800 truncate">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const isAdminUser = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [tab, setTab] = useState<'equipe' | 'cargos'>('equipe');
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, AnalystStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password reset modal state
  const [resetTarget, setResetTarget] = useState<Analyst | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetPassword = async () => {
    if (!resetTarget || resetPwd.length < 6) return;
    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sem sessão ativa.');

      const res = await fetch(RESET_FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: resetTarget.id, newPassword: resetPwd }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');

      toast.success(`Senha de ${displayName(resetTarget)} atualizada!`);
      setResetTarget(null);
      setResetPwd('');
    } catch (err: any) {
      toast.error('Erro ao redefinir senha: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. analysts
      const { data: analystData, error: aErr } = await supabase
        .from('analysts')
        .select('*')
        .order('first_name');
      if (aErr) throw aErr;
      const team: Analyst[] = analystData || [];

      // 2. monthly clients
      const { data: monthlyData, error: mErr } = await supabase
        .from('clients')
        .select('analyst_id')
        .in('status', ['SALE', 'INSTALLED', 'ACTIVE'])
        .gte('updated_at', firstDayOf('month'));
      if (mErr) throw mErr;

      // 3. annual clients
      const { data: annualData, error: yErr } = await supabase
        .from('clients')
        .select('analyst_id')
        .in('status', ['SALE', 'INSTALLED', 'ACTIVE'])
        .gte('updated_at', firstDayOf('year'));
      if (yErr) throw yErr;

      // count per analyst
      const monthlyCounts: Record<string, number> = {};
      for (const row of monthlyData || []) {
        if (row.analyst_id) monthlyCounts[row.analyst_id] = (monthlyCounts[row.analyst_id] ?? 0) + 1;
      }
      const annualCounts: Record<string, number> = {};
      for (const row of annualData || []) {
        if (row.analyst_id) annualCounts[row.analyst_id] = (annualCounts[row.analyst_id] ?? 0) + 1;
      }

      // build stats
      const map: Record<string, AnalystStats> = {};
      for (const a of team) {
        const commission = commissionForRole(a.role);
        const ms = monthlyCounts[a.id] ?? 0;
        const as_ = annualCounts[a.id] ?? 0;
        map[a.id] = {
          monthlySales: ms,
          annualSales: as_,
          monthlyEarnings: ms * commission,
          annualEarnings: as_ * commission,
        };
      }

      setAnalysts(team);
      setStatsMap(map);
    } catch (err: any) {
      const msg = err?.message || 'Erro desconhecido';
      setError(msg);
      toast.error('Erro ao carregar dados: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (analystId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('analysts').update({ role: newRole }).eq('id', analystId);
      if (error) throw error;
      toast.success('Cargo atualizado com sucesso!');
      setAnalysts((prev) => prev.map((a) => (a.id === analystId ? { ...a, role: newRole } : a)));
    } catch (err: any) {
      toast.error('Erro ao atualizar cargo: ' + err.message);
    }
  };

  // ── loading / error states ──
  if (loading) {
    return (
      <div className="p-10 text-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
        <p className="text-slate-500 font-medium">Carregando equipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 font-semibold mb-2">Erro ao carregar dados</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button
          onClick={loadAll}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* tab bar */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('equipe')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'equipe'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={15} />
          Equipe
        </button>
        <button
          onClick={() => setTab('cargos')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'cargos'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield size={15} />
          Gestão de Cargos
        </button>
      </div>

      {/* ── EQUIPE TAB ── */}
      {tab === 'equipe' && (
        <div>
          <StatsHeader analysts={analysts} statsMap={statsMap} />
          {analysts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">Nenhum analista encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {analysts.map((a) => (
                <TimelineCard key={a.id} analyst={a} stats={statsMap[a.id] ?? { monthlySales: 0, annualSales: 0, monthlyEarnings: 0, annualEarnings: 0 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CARGOS TAB ── */}
      {tab === 'cargos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Gestão de Equipe (Admin)</h2>
              <p className="text-sm text-slate-500">Altere cargos e permissões dos usuários do sistema.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4 border-b border-slate-200">Usuário</th>
                  <th className="p-4 border-b border-slate-200">Email</th>
                  <th className="p-4 border-b border-slate-200">Cargo Atual</th>
                  {isAdminUser && <th className="p-4 border-b border-slate-200 text-center">Senha</th>}
                  <th className="p-4 border-b border-slate-200 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {analysts.map((analyst) => (
                  <tr key={analyst.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500">
                          {analyst.avatar_url ? (
                            <img src={analyst.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserCog size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{displayName(analyst)}</p>
                          <p className="text-xs text-slate-500">ID: {analyst.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{analyst.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        {ROLE_LABELS[analyst.role as keyof typeof ROLE_LABELS] || analyst.role}
                      </span>
                    </td>
                    {isAdminUser && (
                      <td className="p-4 text-center">
                        <button
                          onClick={() => { setResetTarget(analyst); setResetPwd(''); setShowResetPwd(false); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                          title="Redefinir senha"
                        >
                          <KeyRound size={13} />
                          Redefinir
                        </button>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <select
                        value={analyst.role}
                        onChange={(e) => updateRole(analyst.id, e.target.value)}
                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-aqua-500 focus:border-aqua-500 block p-2 outline-none ml-auto"
                      >
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Admin Password Reset Modal ── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Redefinir Senha</h3>
                <p className="text-xs text-slate-500">{displayName(resetTarget)} — {resetTarget.email}</p>
              </div>
            </div>

            <div className="relative mb-4">
              <input
                type={showResetPwd ? 'text' : 'password'}
                value={resetPwd}
                onChange={(e) => setResetPwd(e.target.value)}
                placeholder="Nova senha (mín. 6 caracteres)"
                className="w-full rounded-xl px-4 py-3 pr-11 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowResetPwd(v => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
              >
                {showResetPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || resetPwd.length < 6}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-black text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {resetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {resetting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
