import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Award, GitMerge, ChevronDown, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface TaskRef {
  id: string;
  client_id: string;
  analyst_id: string;
  title: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  type: string;
  notes: string;
  created_at: string;
  client?: any; // the parent client info
}

export const RecommendationsPanel: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<TaskRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // New Referral Modal
  const [isAddMode, setIsAddMode] = useState<string | null>(null);
  const [newRef, setNewRef] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch analyst clients
      const { data: clientData, error: cErr } = await supabase
        .from('clients')
        .select('*')
        .or(`analyst.eq.${user.email},analyst_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (cErr) throw cErr;

      // Fetch tasks that represent referrals. Let's assume referrals are saved as tasks of type "VISIT" or "CALL" with "Indicação" in title,
      // or we can just fetch all pending/completed tasks for these clients to map them.
      // Better yet, the schema has `referrals` JSON array on the clients table.
      setClients(clientData || []);

      // If we use the task system as referrals, we fetch tasks.
      const { data: taskData, error: tErr } = await supabase
        .from('tasks')
        .select(`*, client:client_id(name, email)`)
        .eq('analyst_id', user.id)
        .order('created_at', { ascending: false });
        
      if (tErr) throw tErr;
      
      const referralTasks = taskData?.filter(t => t.title.toLowerCase().includes('recomendação') || t.title.toLowerCase().includes('indicação') || t.type === 'REFERRAL') || [];
      setTasks(referralTasks);

      // Expand all by default
      if (clientData) {
        setExpandedClients(new Set(clientData.map(c => c.id)));
      }
    } catch (err: any) {
      toast.error('Erro ao carregar recomendações: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (clientId: string) => {
    const next = new Set(expandedClients);
    if (next.has(clientId)) next.delete(clientId);
    else next.add(clientId);
    setExpandedClients(next);
  };

  const handleCreateReferral = async (clientId: string) => {
    if (!user || !newRef.name) return;
    const toastId = toast.loading('Adicionando recomendação...');
    try {
      const { data, error } = await supabase.from('tasks').insert({
        client_id: clientId,
        analyst_id: user.id,
        title: `Recomendação: ${newRef.name}`,
        notes: `Tel: ${newRef.phone}${newRef.email ? ` | Email: ${newRef.email}` : ''}${newRef.address ? ` | Endereço: ${newRef.address}` : ''}`,
        status: 'PENDING',
        type: 'REFERRAL',
        scheduled_for: new Date().toISOString().split('T')[0]
      }).select().single();

      if (error) throw error;

      toast.success('Recomendação adicionada!', { id: toastId });
      setIsAddMode(null);
      setNewRef({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao adicionar: ' + err.message, { id: toastId });
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'PENDING'|'COMPLETED'|'CANCELLED') => {
    try {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (err: any) {
      toast.error('Erro ao atualizar status: ' + err.message);
    }
  };

  // Group referrals by client
  const referralsByClient: Record<string, TaskRef[]> = {};
  tasks.forEach(t => {
    if (!referralsByClient[t.client_id]) referralsByClient[t.client_id] = [];
    referralsByClient[t.client_id].push(t);
  });

  // Show all clients so users can always add recommendations
  const clientsInView = clients;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <GitMerge size={24} className="text-aqua-600" />
            Organograma de Recomendações
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Cada cliente convertido a partir de uma indicação garante <strong className="text-emerald-600">$500</strong> de bônus para quem recomendou.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-aqua-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Rede...</p>
        </div>
      ) : clientsInView.length === 0 && !isAddMode ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Sem Clientes Cadastrados</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Você pode adicionar novas recomendações diretamente nos cards dos seus clientes no Dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12 pt-6">
          {/* We'll also list clients that *could* have referrals to make it easy to add */}
          {clients.map(client => {
            const clientRefs = referralsByClient[client.id] || [];
            const isExpanded = expandedClients.has(client.id);
            const isAdding = isAddMode === client.id;
            
            // Only show if they have referrals OR we are adding OR we just want to see everybody (let's show all clients for now so they can add)
            
            return (
              <div key={client.id} className="relative">
                {/* Client Root Node */}
                <div className="relative z-10 flex items-center justify-between bg-slate-800 text-white rounded-2xl p-5 shadow-lg max-w-md mx-auto md:mx-0 border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-aqua-500/20 rounded-full flex items-center justify-center border border-aqua-500/30">
                      <Users size={20} className="text-aqua-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Cliente Origem</p>
                      <h4 className="font-bold text-lg leading-tight">{client.name}</h4>
                      <p className="text-xs text-slate-400">{clientRefs.length} recomendação(ões)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setIsAddMode(isAdding ? null : client.id); if (!isExpanded) toggleExpand(client.id); }} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-aqua-600 flex items-center justify-center transition-colors" title="Adicionar Recomendação">
                      <Plus size={18} />
                    </button>
                    {clientRefs.length > 0 && (
                      <button onClick={() => toggleExpand(client.id)} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                        <ChevronDown size={18} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Branches / Children */}
                {isExpanded && (clientRefs.length > 0 || isAdding) && (
                  <div className="relative pl-8 md:pl-20 pt-6 space-y-6">
                    {/* Connecting Top Line */}
                    <div className="absolute left-[2.5rem] md:left-[5.5rem] top-0 bottom-8 w-px bg-slate-300"></div>

                    {clientRefs.map((ref, idx) => (
                      <div key={ref.id} className="relative z-10 flex items-center group">
                        {/* Connecting Horizontal Line */}
                        <div className="absolute -left-12 w-12 h-px bg-slate-300"></div>
                        
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group-hover:border-aqua-300 transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-500 flex items-center gap-1">
                                  {ref.status === 'PENDING' ? <Clock size={10}/> : ref.status === 'COMPLETED' ? <CheckCircle size={10} className="text-emerald-500"/> : <XCircle size={10} className="text-red-500"/>}
                                  {ref.status}
                                </span>
                            </div>
                            <h5 className="font-bold text-slate-800 text-base">{ref.title.replace('Recomendação:', '').trim()}</h5>
                            {ref.notes && <p className="text-xs text-slate-500 mt-1">{ref.notes}</p>}
                          </div>

                          <div className="flex items-center gap-6 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100">
                            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200">
                              <Award size={16} className="text-emerald-600" />
                              <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-black tracking-widest opacity-80 leading-none">Bônus Futuro</span>
                                <span className="text-sm font-black leading-tight">$500</span>
                              </div>
                            </div>

                            <select
                              value={ref.status}
                              onChange={(e) => updateTaskStatus(ref.id, e.target.value as any)}
                              className="text-xs font-bold border border-slate-200 rounded-lg px-2 py-2 outline-none focus:border-aqua-500 bg-slate-50"
                            >
                              <option value="PENDING">Pendente</option>
                              <option value="COMPLETED">Vendido (Concluído)</option>
                              <option value="CANCELLED">Cancelado</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add Mode Form Node */}
                    {isAdding && (
                      <div className="relative z-10 flex items-center">
                        <div className="absolute -left-12 w-12 h-px bg-slate-300"></div>
                        <div className="bg-aqua-50 border border-aqua-200 rounded-2xl p-5 flex-1 shadow-inner">
                          <h6 className="text-xs font-black uppercase tracking-widest text-aqua-800 mb-3">Nova Recomendação</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <input
                              type="text"
                              placeholder="Nome do indicado"
                              value={newRef.name}
                              onChange={e => setNewRef({ ...newRef, name: e.target.value })}
                              className="text-sm border border-aqua-100 rounded-xl px-4 py-3 outline-none focus:border-aqua-500 w-full bg-white/50"
                            />
                            <input
                              type="tel"
                              placeholder="Telefone"
                              value={newRef.phone}
                              onChange={e => setNewRef({ ...newRef, phone: e.target.value })}
                              className="text-sm border border-aqua-100 rounded-xl px-4 py-3 outline-none focus:border-aqua-500 w-full bg-white/50"
                            />
                            <input
                              type="email"
                              placeholder="E-mail (Opcional)"
                              value={newRef.email}
                              onChange={e => setNewRef({ ...newRef, email: e.target.value })}
                              className="text-sm border border-aqua-100 rounded-xl px-4 py-3 outline-none focus:border-aqua-500 w-full bg-white/50"
                            />
                            <input
                              type="text"
                              placeholder="Endereço Completo"
                              value={newRef.address}
                              onChange={e => setNewRef({ ...newRef, address: e.target.value })}
                              className="text-sm border border-aqua-100 rounded-xl px-4 py-3 outline-none focus:border-aqua-500 w-full bg-white/50"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsAddMode(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-white rounded-lg transition-colors">Cancelar</button>
                            <button onClick={() => handleCreateReferral(client.id)} className="px-5 py-2 text-xs font-bold bg-aqua-600 text-white rounded-lg shadow-md hover:bg-aqua-700 transition-colors">Adicionar Bônus</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
