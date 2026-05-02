import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ROLE_LABELS } from '../contexts/AuthContext';
import { Shield, UserCog, Check } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [analysts, setAnalysts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysts();
  }, []);

  const fetchAnalysts = async () => {
    try {
      const { data, error } = await supabase.from('analysts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnalysts(data || []);
    } catch (err: any) {
      toast.error('Erro ao buscar analistas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (analystId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('analysts').update({ role: newRole }).eq('id', analystId);
      if (error) throw error;
      toast.success('Cargo atualizado com sucesso!');
      setAnalysts(analysts.map(a => a.id === analystId ? { ...a, role: newRole } : a));
    } catch (err: any) {
      toast.error('Erro ao atualizar cargo: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Carregando equipe...</div>;
  }

  return (
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
              <th className="p-4 border-b border-slate-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {analysts.map(analyst => (
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
                      <p className="font-bold text-slate-800">{analyst.full_name || analyst.first_name || 'Usuário'}</p>
                      <p className="text-xs text-slate-500">ID: {analyst.id.substring(0,8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{analyst.email}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {ROLE_LABELS[analyst.role as keyof typeof ROLE_LABELS] || analyst.role}
                  </span>
                </td>
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
  );
};
