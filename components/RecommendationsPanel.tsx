import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Award, GitMerge, CheckCircle, Clock, XCircle, ChevronRight, ChevronDown, Copy, UserPlus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface TreeNode {
  id: string;
  name: string;
  type: 'CLIENT' | 'REFERRAL';
  status: string;
  level: number;
  totalConverted: number;
  sales3Months: number;
  token?: string;
  children: TreeNode[];
  phone?: string;
  avatar_url?: string;
}

const PROD_URL = 'https://aquafeelphilly.com';

export const RecommendationsPanel: React.FC = () => {
  const { user, profile } = useAuth();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);

  // For Add Referral Modal
  const [isAddMode, setIsAddMode] = useState<string | null>(null);
  const [newRef, setNewRef] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    setHasError(false);

    const withTimeout = <T,>(promise: Promise<T> | PromiseLike<T>, ms: number = 8000) => {
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), ms);
      });
      return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timeoutId));
    };

    try {
      // Fetch Clients and Referrals concurrently to save time
      const [
        clientsResult,
        referralsResult
      ] = await Promise.all([
        withTimeout(supabase.from('clients').select('*').or(`analyst.eq.${user.email},analyst_id.eq.${user.id}`)),
        withTimeout(supabase.from('referrals').select('*').eq('analyst_id', user.id))
      ]) as any[];

      if (clientsResult.error) throw clientsResult.error;
      if (referralsResult.error) throw referralsResult.error;

      const clients = clientsResult.data || [];
      const referrals = referralsResult.data || [];

      // Fetch Client Points
      const clientIds = clients.map((c: any) => c.id);
      let points: any[] = [];
      if (clientIds.length > 0) {
        const ptsResult = await withTimeout(supabase.from('client_points').select('*').in('client_id', clientIds)) as any;
        points = ptsResult.data || [];
      }

      // Build the Tree
      const tree = buildTree(clients, points, referrals);
      setTreeData(tree);
    } catch (err: any) {
      console.error('Error fetching tree data:', err);
      if (err.message === 'TIMEOUT') {
        toast.error('O carregamento demorou muito (possível bloqueio de abas). Tente novamente.');
      } else {
        toast.error('Erro ao carregar organograma: ' + err.message);
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTree = (clients: any[], points: any[], referrals: any[]): TreeNode[] => {
    const nodesMap: Record<string, TreeNode> = {};

    // Helper to calculate sales in last 3 months
    const getSales3Months = (clientId: string) => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      return referrals.filter(r => 
        r.client_id === clientId && 
        r.status === 'CONVERTED' && 
        new Date(r.updated_at) >= threeMonthsAgo
      ).length;
    };

    // First pass: Create all Client nodes
    clients.forEach(c => {
      const p = points.find(pt => pt.client_id === c.id);
      nodesMap[c.id] = {
        id: c.id,
        name: c.name,
        type: 'CLIENT',
        status: c.status,
        level: p ? p.level : 1,
        totalConverted: p ? p.converted_referrals : 0,
        sales3Months: getSales3Months(c.id),
        token: p ? p.referral_token : undefined,
        children: [],
        phone: c.phone,
        avatar_url: c.avatar_url
      };
    });

    // Second pass: Process Referrals
    const roots: TreeNode[] = [];

    // Separate referrals into Converted (that are now clients) and Non-Converted
    referrals.forEach(r => {
      if (r.status === 'CONVERTED' && r.converted_client_id && nodesMap[r.converted_client_id]) {
        // This referral is a client in the system. Link it as a child.
        if (nodesMap[r.client_id]) {
          nodesMap[r.client_id].children.push(nodesMap[r.converted_client_id]);
        }
      } else {
        // This referral is not a client yet (PENDING, SCHEDULED, LOST)
        // Add as a leaf node
        const refNode: TreeNode = {
          id: r.id,
          name: r.name,
          type: 'REFERRAL',
          status: r.status,
          level: 0,
          totalConverted: 0,
          sales3Months: 0,
          children: [],
          phone: r.phone
        };
        if (nodesMap[r.client_id]) {
          nodesMap[r.client_id].children.push(refNode);
        }
      }
    });

    // Determine root nodes (Clients that were NOT referred by anyone, or whose referrer is not in this analyst's scope)
    const referredClientIds = new Set(
      referrals.filter(r => r.status === 'CONVERTED' && r.converted_client_id).map(r => r.converted_client_id)
    );

    clients.forEach(c => {
      if (!referredClientIds.has(c.id)) {
        roots.push(nodesMap[c.id]);
      }
    });

    return roots;
  };

  // Copy RECRUITMENT link — invite new analysts to join the team
  const copyRecruitLink = () => {
    const ref = profile?.first_name || user?.email?.split('@')[0] || 'Aquafeel';
    const url = `${PROD_URL}/referral?ref=${encodeURIComponent(ref)}`;
    navigator.clipboard.writeText(url);
    toast.success('Link de recrutamento copiado! Compartilhe para convidar novos analistas.');
  };

  // Copy CLIENT VIP portal link
  const copyVipLink = (token: string | undefined) => {
    if (!token) {
      toast.error('Este cliente ainda não tem um portal VIP ativo (apenas para clientes convertidos).');
      return;
    }
    const url = `${PROD_URL}/vip?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link do Portal VIP copiado! Envie para o cliente.');
  };

  const handleCreateReferral = async (clientId: string) => {
    if (!user || !newRef.name) return;
    const toastId = toast.loading('Adicionando recomendação...');
    try {
      const { error } = await supabase.from('referrals').insert({
        client_id: clientId,
        analyst_id: user.id,
        name: newRef.name,
        phone: newRef.phone,
        email: newRef.email,
        address: newRef.address,
        status: 'PENDING'
      });
      if (error) throw error;
      toast.success('Recomendação adicionada!', { id: toastId });
      setIsAddMode(null);
      setNewRef({ name: '', phone: '', email: '', address: '' });
      fetchData();
    } catch (err: any) {
      toast.error('Erro ao adicionar: ' + err.message, { id: toastId });
    }
  };

  const updateReferralStatus = async (refId: string, status: string) => {
    try {
      const { error } = await supabase.from('referrals').update({ status }).eq('id', refId);
      if (error) throw error;
      toast.success('Status atualizado com sucesso.');
      fetchData(); // reload tree
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    }
  };

  // --- Render Nodes Recursively ---
  const OrgNode = ({ node }: { node: TreeNode }) => {
    const [expanded, setExpanded] = useState(true);
    const isClient = node.type === 'CLIENT';
    const isElite = node.level === 2;
    const missingForElite = Math.max(0, 3 - node.totalConverted);

    return (
      <div className="flex flex-col items-center">
        {/* The Node Card */}
        <div className="relative group">
          <div className={`w-64 bg-white border-2 rounded-2xl p-4 shadow-sm transition-all duration-200 z-10 relative ${
            isClient 
              ? isElite ? 'border-yellow-400 hover:shadow-yellow-400/30' : 'border-[#11caa0] hover:shadow-[#11caa0]/30'
              : 'border-slate-200 border-dashed hover:border-slate-400'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 flex-shrink-0 ${
                  isClient ? (isElite ? 'border-yellow-400 bg-yellow-100 text-yellow-600' : 'border-[#11caa0] bg-[#11caa0]/10 text-[#11caa0]') : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}>
                  {node.avatar_url ? (
                    <img src={node.avatar_url} alt={node.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 leading-tight truncate w-32" title={node.name}>{node.name}</h4>
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                    {isClient ? (isElite ? 'Elite' : 'Embaixador') : node.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Hover Tooltip (Metrics) */}
            {isClient && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-72 bg-slate-900 text-white rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-50 pointer-events-none scale-95 group-hover:scale-100">
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <span className="font-bold">{node.name}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${isElite ? 'bg-yellow-500 text-yellow-950' : 'bg-[#11caa0]/20 text-[#11caa0]'}`}>
                    Nível {node.level}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vendas Totais:</span>
                    <span className="font-bold">{node.totalConverted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vendas 3 Meses:</span>
                    <span className="font-bold text-[#11caa0]">{node.sales3Months}</span>
                  </div>
                  {!isElite && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-700">
                      <span className="text-yellow-500 font-bold text-xs">Faltam {missingForElite} vendas para Elite</span>
                    </div>
                  )}
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-slate-900 border-r-[8px] border-r-transparent"></div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              {isClient ? (
                <>
                  <button onClick={copyRecruitLink} className="flex-1 bg-slate-50 hover:bg-[#11caa0] hover:text-white text-slate-700 border border-slate-200 hover:border-[#11caa0] rounded-lg py-1.5 text-xs font-bold flex items-center justify-center gap-1 transition-colors" title="Copiar link de recrutamento de analistas">
                    <UserPlus size={14} className="text-[#11caa0] group-hover:text-white"/> Convidar Time
                  </button>
                  <button onClick={() => copyVipLink(node.token)} className="w-8 flex-shrink-0 bg-slate-50 hover:bg-blue-500 hover:text-white text-slate-600 border border-slate-200 hover:border-blue-500 rounded-lg py-1.5 flex items-center justify-center transition-colors" title="Copiar Link do Portal VIP do Cliente">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => setIsAddMode(node.id)} className="w-8 flex-shrink-0 bg-slate-50 hover:bg-[#11caa0] hover:text-white text-slate-600 border border-slate-200 hover:border-[#11caa0] rounded-lg py-1.5 flex items-center justify-center transition-colors" title="Cadastrar Indicação Manual">
                    <GitMerge size={14} />
                  </button>
                </>
              ) : (
                <select
                  value={node.status}
                  onChange={(e) => updateReferralStatus(node.id, e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#11caa0] bg-slate-50"
                >
                  <option value="PENDING">Pendente</option>
                  <option value="SCHEDULED">Agendado</option>
                  <option value="HOLD">Em Espera</option>
                  <option value="CONVERTED">Marcar como Venda</option>
                  <option value="LOST">Perdido</option>
                </select>
              )}
            </div>
          </div>

          {/* Add Referral Modal Inline */}
          {isAddMode === node.id && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50">
              <h5 className="text-xs font-black uppercase text-slate-500 mb-3">Nova Indicação para {node.name.split(' ')[0]}</h5>
              <div className="space-y-2 mb-3">
                <input type="text" placeholder="Nome" value={newRef.name} onChange={e=>setNewRef({...newRef, name:e.target.value})} className="w-full text-sm p-2 border rounded-lg outline-none focus:border-[#11caa0]"/>
                <input type="tel" placeholder="Telefone" value={newRef.phone} onChange={e=>setNewRef({...newRef, phone:e.target.value})} className="w-full text-sm p-2 border rounded-lg outline-none focus:border-[#11caa0]"/>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setIsAddMode(null)} className="flex-1 text-xs py-2 bg-slate-100 text-slate-600 rounded-lg font-bold">Cancelar</button>
                <button onClick={()=>handleCreateReferral(node.id)} className="flex-1 text-xs py-2 bg-[#11caa0] text-white rounded-lg font-bold">Salvar</button>
              </div>
            </div>
          )}
        </div>

        {/* Children Render Logic */}
        {node.children.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Vertical Line from parent */}
            <div className="w-px h-6 bg-slate-300"></div>
            
            {/* Toggle Button */}
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 flex items-center justify-center hover:border-[#11caa0] hover:text-[#11caa0] z-20 shadow-sm transition-colors"
            >
              <ChevronDown size={14} className={`transform transition-transform ${expanded ? '' : '-rotate-90'}`} />
            </button>

            {expanded && (
              <>
                <div className="w-px h-6 bg-slate-300"></div>
                {/* Horizontal Line connecting children */}
                {node.children.length > 1 && (
                  <div className="h-px bg-slate-300" style={{ width: `calc(100% - ${100 / node.children.length}%)` }}></div>
                )}
                {/* Children container */}
                <div className="flex justify-center gap-8 pt-6 relative">
                  {node.children.map((child, index) => (
                    <div key={child.id} className="relative flex flex-col items-center">
                      {/* Vertical line down to child */}
                      <div className="absolute top-[-24px] w-px h-6 bg-slate-300"></div>
                      <OrgNode node={child} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <GitMerge size={24} className="text-[#11caa0]" />
            Organograma do Time
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Acompanhe o crescimento da sua rede. Clientes que convertem indicações se tornam Embaixadores e evoluem para Elite.
          </p>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-white rounded text-slate-600 transition-colors"><ZoomOut size={18}/></button>
          <button onClick={() => setZoom(1)} className="p-2 hover:bg-white rounded text-slate-600 transition-colors font-bold text-xs flex items-center w-12 justify-center">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-white rounded text-slate-600 transition-colors"><ZoomIn size={18}/></button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-50">
            <div className="animate-spin w-8 h-8 border-4 border-[#11caa0] border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Rede...</p>
          </div>
        ) : hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <XCircle size={48} className="text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">Erro ao carregar</h3>
            <p className="text-slate-500 mb-6 text-center max-w-sm">Pode haver um conflito de sessão se você tiver muitas abas abertas. Feche outras abas e tente novamente.</p>
            <button onClick={fetchData} className="px-6 py-2 bg-[#11caa0] hover:bg-[#0fbaa0] text-white font-bold rounded-lg transition-colors">
              Tentar Novamente
            </button>
          </div>
        ) : treeData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <Users size={48} className="text-slate-300 mb-4" />
             <h3 className="text-xl font-bold text-slate-700 mb-2">Sem Parceiros</h3>
             <p className="text-slate-500 max-w-sm text-center">Nenhum cliente seu tem indicações ainda. Convide seus clientes fechados a participarem do Portal VIP.</p>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-12 hide-scrollbar"
               onMouseDown={(e) => {
                 const ele = e.currentTarget;
                 let start = { x: e.pageX - ele.offsetLeft, y: e.pageY - ele.offsetTop };
                 let scrollLeft = ele.scrollLeft;
                 let scrollTop = ele.scrollTop;
                 
                 const onMouseMove = (e: MouseEvent) => {
                   const x = e.pageX - ele.offsetLeft;
                   const y = e.pageY - ele.offsetTop;
                   ele.scrollLeft = scrollLeft - (x - start.x);
                   ele.scrollTop = scrollTop - (y - start.y);
                 };
                 const onMouseUp = () => {
                   document.removeEventListener('mousemove', onMouseMove);
                   document.removeEventListener('mouseup', onMouseUp);
                 };
                 document.addEventListener('mousemove', onMouseMove);
                 document.addEventListener('mouseup', onMouseUp);
               }}>
            
            <div className="min-w-max flex justify-center origin-top transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom})` }}>
              <div className="flex gap-16">
                {treeData.map(rootNode => (
                  <OrgNode key={rootNode.id} node={rootNode} />
                ))}
              </div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
