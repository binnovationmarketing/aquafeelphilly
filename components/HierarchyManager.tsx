import React, { useState, useEffect } from 'react';
import { Users, ChevronDown, GitBranch, Save, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { HierarchyRole, ROLE_LABELS_PT, ROLE_COLORS, ROLE_COMMISSION } from '../utils/commissions';

/* ─── Types ─── */
interface AnalystNode {
  id: string;
  email: string;
  display_name: string;
  role: HierarchyRole;
  sponsored_by: string | null;
  active: boolean;
  total_sales: number;
  personal_commission: number;
  recruitment_bonus: number;
  differential_bonus: number;
  total_earnings: number;
}

/* ─── Helpers ─── */
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const ROLE_OPTIONS: HierarchyRole[] = [
  'analyst_jr', 'analyst_sr', 'mentor_jr', 'mentor_sr',
  'manager_jr', 'manager_sr', 'director_jr', 'director_sr',
  'master', 'ambassador',
];

/* ─── Tree Node ─── */
const TreeNode: React.FC<{
  analyst: AnalystNode;
  children: AnalystNode[];
  all: AnalystNode[];
  depth: number;
}> = ({ analyst, children, all, depth }) => {
  const [open, setOpen] = useState(depth < 2);
  const colors = ROLE_COLORS[analyst.role] || ROLE_COLORS['analyst_jr'];

  return (
    <div style={{ paddingLeft: depth > 0 ? '1.5rem' : '0' }}>
      <div
        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1 ${colors.bg} border ${colors.border} hover:opacity-90 transition-all cursor-pointer`}
        onClick={() => setOpen(!open)}
      >
        <div className={`w-8 h-8 rounded-full bg-white/60 flex items-center justify-center font-black text-sm ${colors.text}`}>
          {analyst.display_name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${colors.text} truncate`}>{analyst.display_name}</div>
          <div className="text-[10px] text-slate-400 truncate">{analyst.email}</div>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
          {ROLE_LABELS_PT[analyst.role]}
        </span>
        <span className="text-[10px] font-bold text-emerald-600 whitespace-nowrap">
          {fmt(analyst.total_earnings ?? 0)}
        </span>
        {children.length > 0 && (
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>
      {open && children.length > 0 && (
        <div className="border-l-2 border-slate-100 ml-4 pl-0">
          {children.map(child => (
            <TreeNode
              key={child.id}
              analyst={child}
              children={all.filter(a => a.sponsored_by === child.id)}
              all={all}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
export const HierarchyManager: React.FC = () => {
  const [analysts, setAnalysts] = useState<AnalystNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<HierarchyRole>('analyst_jr');
  const [editSponsor, setEditSponsor] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'tree' | 'table'>('table');

  useEffect(() => { fetchAnalysts(); }, []);

  const fetchAnalysts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysts')
        .select('id, email, full_name, first_name, last_name, role, sponsored_by, active, total_sales, personal_commission, recruitment_bonus, differential_bonus')
        .eq('active', true)
        .order('email');

      if (error) throw error;

      const nodes: AnalystNode[] = (data ?? []).map(a => ({
        id: a.id,
        email: a.email,
        display_name: a.full_name || `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email,
        role: (a.role as HierarchyRole) || 'analyst_jr',
        sponsored_by: a.sponsored_by ?? null,
        active: a.active ?? true,
        total_sales: a.total_sales ?? 0,
        personal_commission: a.personal_commission ?? 0,
        recruitment_bonus: a.recruitment_bonus ?? 0,
        differential_bonus: a.differential_bonus ?? 0,
        total_earnings: (a.personal_commission ?? 0) + (a.recruitment_bonus ?? 0) + (a.differential_bonus ?? 0),
      }));

      setAnalysts(nodes);
    } catch (err: any) {
      toast.error('Erro ao carregar analistas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (analyst: AnalystNode) => {
    setEditingId(analyst.id);
    setEditRole(analyst.role);
    setEditSponsor(analyst.sponsored_by ?? '');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('analysts')
        .update({
          role: editRole,
          sponsored_by: editSponsor || null,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Analista atualizado com sucesso!');
      setEditingId(null);
      fetchAnalysts();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = analysts.filter(a =>
    a.display_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  // Roots = no sponsor
  const roots = analysts.filter(a => !a.sponsored_by);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <GitBranch size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Hierarquia da Equipe</h2>
            <p className="text-xs text-slate-400">{analysts.length} analista{analysts.length !== 1 ? 's' : ''} ativos — defina cargo e patrocinador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('table')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'table' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Tabela
          </button>
          <button
            onClick={() => setView('tree')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'tree' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            🌳 Árvore
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 font-medium">
          <strong>Como funciona:</strong> Defina o cargo de cada analista e selecione quem o recrutou (Patrocinador).
          Quando uma venda for fechada, o bônus diferencial sobe automaticamente por toda a cadeia de patrocínio.
        </p>
      </div>

      {/* Tree View */}
      {view === 'tree' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-black text-slate-900 mb-4 text-sm">Árvore de Hierarquia</h3>
          {roots.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              Nenhuma hierarquia definida ainda. Configure os patrocinadores na tabela.
            </p>
          ) : (
            <div className="space-y-1">
              {roots.map(root => (
                <TreeNode
                  key={root.id}
                  analyst={root}
                  children={analysts.filter(a => a.sponsored_by === root.id)}
                  all={analysts}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar analista..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
                    <th className="px-5 py-3 text-left">Analista</th>
                    <th className="px-5 py-3 text-left">Cargo</th>
                    <th className="px-5 py-3 text-left">Patrocinador</th>
                    <th className="px-5 py-3 text-right">Vendas</th>
                    <th className="px-5 py-3 text-right">Ganhos Totais</th>
                    <th className="px-5 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(analyst => {
                    const isEditing = editingId === analyst.id;
                    const sponsor = analysts.find(a => a.id === analyst.sponsored_by);
                    const colors = ROLE_COLORS[analyst.role] || ROLE_COLORS['analyst_jr'];

                    return (
                      <tr key={analyst.id} className={`hover:bg-slate-50/80 transition-colors ${isEditing ? 'bg-indigo-50/50' : ''}`}>
                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${colors.bg} ${colors.text}`}>
                              {analyst.display_name?.[0]?.toUpperCase() ?? 'A'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{analyst.display_name}</div>
                              <div className="text-[10px] text-slate-400">{analyst.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role — editable */}
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value as HierarchyRole)}
                              className="text-xs border border-indigo-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-300 font-bold"
                            >
                              {ROLE_OPTIONS.map(r => (
                                <option key={r} value={r}>
                                  {ROLE_LABELS_PT[r]} — {fmt(ROLE_COMMISSION[r])}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black ${colors.badge}`}>
                              {ROLE_LABELS_PT[analyst.role]}
                            </span>
                          )}
                        </td>

                        {/* Sponsor — editable */}
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <select
                              value={editSponsor}
                              onChange={e => setEditSponsor(e.target.value)}
                              className="text-xs border border-indigo-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-indigo-300 font-bold max-w-[180px]"
                            >
                              <option value="">— Sem patrocinador —</option>
                              {analysts
                                .filter(a => a.id !== analyst.id)
                                .map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.display_name} ({ROLE_LABELS_PT[a.role]})
                                  </option>
                                ))}
                            </select>
                          ) : (
                            <span className="text-slate-600 text-xs font-medium">
                              {sponsor ? sponsor.display_name : <span className="text-slate-300">—</span>}
                            </span>
                          )}
                        </td>

                        {/* Sales */}
                        <td className="px-5 py-4 text-right font-black text-slate-900">{analyst.total_sales}</td>

                        {/* Earnings */}
                        <td className="px-5 py-4 text-right">
                          <div className="font-bold text-emerald-600">{fmt(analyst.total_earnings)}</div>
                          <div className="text-[10px] text-slate-400">
                            P:{fmt(analyst.personal_commission)} R:{fmt(analyst.recruitment_bonus)} D:{fmt(analyst.differential_bonus)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => saveEdit(analyst.id)}
                                disabled={saving}
                                className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-500 flex items-center gap-1 disabled:opacity-50"
                              >
                                <Save size={12} />
                                {saving ? 'Salvando...' : 'Salvar'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(analyst)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100"
                            >
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                        Nenhum analista encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
