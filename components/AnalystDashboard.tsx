
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, TrendingUp,
  CheckCircle, Plus, LogOut, Search, Filter, X, Mail, Phone, MapPin, Clock, Share2,
  MessageSquare, CalendarCheck, Calendar as CalendarIcon, Play, CheckCircle2, Shield, FileText, UserCog,
  DollarSign, ClipboardList, Users2, UserPlus, MessageCircle
} from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';
import { toast } from 'sonner';
import { ShareProposalModal } from './ShareProposalModal';
import { MarketingService } from '../lib/marketing';
import { Task } from '../types';
import { CommissionPanel } from './CommissionPanel';
import { RecommendationsPanel } from './RecommendationsPanel';
import { AdminPanel } from './AdminPanel';
import { HierarchyRole, ROLE_LABELS_PT } from '../utils/commissions';

interface DashboardMetrics {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  activePresentations: number;
  totalNoSales: number;
  monthlyGoal: number;
  leadsByStatus: { name: string; value: number }[];
  salesTrend: { name: string; sales: number }[];
  teamTotalSales?: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  zip_code?: string;
  status: string;
  created_at: string;
  analyst?: string;
}

export const AnalystDashboard: React.FC<{ onNewProposal: () => void }> = ({ onNewProposal }) => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAllLeads, setShowAllLeads] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RECOMMENDATIONS' | 'COMMISSIONS' | 'TEAM_MANAGEMENT'>('OVERVIEW');
  const [isScheduling, setIsScheduling] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignupLinkModal, setShowSignupLinkModal] = useState(false);
  const [signupPhone, setSignupPhone] = useState('');
  const [profileData, setProfileData] = useState({ full_name: '', avatar_url: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [executingTask, setExecutingTask] = useState<Task | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'MESSAGE' as 'CALL' | 'MESSAGE' | 'EMAIL' | 'VISIT',
    notes: ''
  });
  const [monthlyEarnings, setMonthlyEarnings] = useState({ personal: 0, team: 0, total: 0 });

  useEffect(() => {
    fetchDashboardData();
    if (profile) {
      setProfileData({
        full_name: profile.full_name || profile.first_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from('analysts').update(profileData).eq('id', user.id);
      if (error) throw error;
      // Refresh profile in context without a page reload (prevents white screen)
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
      setShowProfileModal(false);
    } catch (err: any) {
      toast.error('Erro ao salvar perfil: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Supabase Realtime: notify analyst when a client opens their proposal ──
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('proposal-views')
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'clients',
          filter: `analyst_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const old     = payload.old as any;

          // Detect first proposal open (proposal_opened_at just got set)
          if (!old.proposal_opened_at && updated.proposal_opened_at) {
            toast(`👀 ${updated.name} abriu sua proposta agora!`, {
              description: 'Ótimo momento para um follow-up — entre em contato em até 5 min.',
              duration: 12000,
              action: {
                label: 'Ver lead',
                onClick: () => {
                  setSelectedLead(updated);
                  setShowAllLeads(true);
                },
              },
            });
          }

          // Detect re-opens (view_count incremented)
          if (
            old.view_count !== undefined &&
            updated.view_count > (old.view_count || 0) &&
            old.proposal_opened_at
          ) {
            toast(`🔁 ${updated.name} revisitou a proposta`, {
              description: `Visualizações: ${updated.view_count}`,
              duration: 8000,
            });
          }

          // Refresh leads list to show updated engagement data
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ── Supabase Realtime: notify this analyst (as leader) when downline closes a sale ──
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('commission-notifications')
      .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'commissions_log',
          filter: `beneficiary_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.commission_type === 'personal') return; // personal shown separately
          const emoji = row.commission_type === 'recruitment' ? '💰' : '🏆';
          const label = row.commission_type === 'recruitment' ? 'Bônus Recrutamento' : 'Bônus Diferencial';
          toast.success(`${emoji} ${label}: +$${Number(row.amount).toLocaleString()}`, {
            description: 'Uma venda foi fechada na sua equipe!',
            duration: 10000,
          });
          fetchDashboardData();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Run all queries concurrently to dramatically improve loading speed
      const [
        { data: clients, error: clientsError },
        { data: tasksData, error: tasksError },
        { data: monthCommissions, error: commsError },
        { data: downline, error: downlineError }
      ] = await Promise.all([
        supabase.from('clients').select('*').or(`analyst.eq.${user.email},analyst_id.eq.${user.id}`).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('analyst_id', user.id).eq('status', 'PENDING').order('scheduled_for', { ascending: true }),
        supabase.from('commissions_log').select('amount, commission_type').eq('beneficiary_id', user.id).gte('created_at', firstDayOfMonth),
        supabase.from('analyst_performance').select('total_sales').eq('sponsored_by', user.id)
      ]);

      if (clientsError) throw clientsError;

      const totalLeads = clients ? clients.length : 0;
      const sales = clients ? clients.filter(c => c.status === 'SALE' || c.status === 'INSTALLED' || c.status === 'ACTIVE') : [];
      const totalSales = sales.length;
      const noSales = clients ? clients.filter(c => c.status === 'NO SALE').length : 0;
      const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;
      const presentations = clients ? clients.filter(c => c.status === 'PRESENTATION' || c.status === 'SCHEDULED') : [];

      const statusCounts = clients ? clients.reduce((acc: any, client: any) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {}) : {};

      const leadsByStatus = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
      }));

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const trendData = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = months[d.getMonth()];
        const year = d.getFullYear();

        const monthlySales = sales.filter(c => {
          const cDate = new Date(c.created_at);
          return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === year;
        }).length;

        trendData.push({ name: monthName, sales: monthlySales });
      }

      let pEarn = 0, tEarn = 0;
      monthCommissions?.forEach((c: any) => {
        if (c.commission_type === 'personal') pEarn += Number(c.amount);
        else tEarn += Number(c.amount);
      });
      setMonthlyEarnings({ personal: pEarn, team: tEarn, total: pEarn + tEarn });

      const teamTotalSales = downline?.reduce((sum, a) => sum + (a.total_sales || 0), 0) || 0;

      setMetrics({
        totalLeads,
        totalSales,
        totalNoSales: noSales,
        conversionRate,
        activePresentations: presentations.length,
        monthlyGoal: 10,
        leadsByStatus,
        salesTrend: trendData,
        teamTotalSales
      });

      setAllLeads(clients || []);
      setPendingTasks(tasksData || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      toast.error('Erro ao carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleTask = async () => {
    if (!selectedLead || !user) return;
    try {
      const { error } = await supabase.from('tasks').insert([{
        client_id: selectedLead.id,
        analyst_id: user.id,
        title: `Follow-up ${taskForm.type}`,
        status: 'PENDING',
        type: taskForm.type,
        scheduled_for: new Date(taskForm.date).toISOString(),
        notes: taskForm.notes
      }]);

      if (error) throw error;
      toast.success('Follow-up agendado com sucesso!');
      setIsScheduling(false);
      setTaskForm({ date: new Date().toISOString().split('T')[0], type: 'MESSAGE', notes: '' });
      fetchDashboardData(); // Refresh tasks
    } catch (error) {
      console.error('Error scheduling task:', error);
      toast.error('Erro ao agendar tarefa.');
    }
  };

  const handleCloseSale = async (lead: Lead) => {
    if (!user) return;
    if (!window.confirm(`Confirmar fechamento de venda para ${lead.name}?`)) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: 'SALE' })
        .eq('id', lead.id);
      if (error) throw error;
      toast.success(`✅ Venda fechada! Comissões calculadas automaticamente.`, { duration: 8000 });
      setSelectedLead(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(`Erro ao fechar venda: ${err.message}`);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch =
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.zip_code?.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedLeads = showAllLeads ? filteredLeads : filteredLeads.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-slate-200 h-16" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Skeleton welcome */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-11 w-40 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          {/* Skeleton KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                    <div className="h-8 w-16 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Skeleton charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-6" />
              <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="h-5 w-28 bg-slate-200 rounded animate-pulse mb-6" />
              <div className="h-64 bg-slate-100 rounded-full mx-auto animate-pulse" />
            </div>
          </div>
          {/* Skeleton table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex gap-4 items-center">
                  <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AquaFeelLogo width="120px" />
            <span className="hidden md:inline-block h-6 w-px bg-slate-200"></span>
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap hide-scrollbar">
              <button
                onClick={() => setActiveTab('COMMISSIONS')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'COMMISSIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <DollarSign size={14} /> Comissões
              </button>
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ClipboardList size={14} /> Leads
              </button>
              <button
                onClick={() => setActiveTab('RECOMMENDATIONS')}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'RECOMMENDATIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Users2 size={14} /> Recomendações
              </button>
              {(profile?.role !== 'analyst_jr' || user?.email === 'binnovationmarketing@gmail.com') && (
                <button
                  onClick={() => setActiveTab('TEAM_MANAGEMENT')}
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'TEAM_MANAGEMENT'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Shield size={14} /> Equipe
                </button>
              )}
            </div>
            <h1 className="md:hidden text-lg font-bold text-slate-700">Analyst Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{profileData.full_name || user?.email}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                {profile?.role ? (ROLE_LABELS_PT[profile.role as HierarchyRole] ?? profile.role) : 'Analista'}
              </p>
            </div>
            <div 
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-slate-200 border-2 border-aqua-500 flex items-center justify-center overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              title="Editar Perfil"
            >
              {profileData.avatar_url ? (
                <img src={profileData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCog size={18} className="text-slate-500" />
              )}
            </div>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome & Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Welcome back!</h2>
            <p className="text-slate-500">Here's what's happening with your leads today.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowSignupLinkModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-3 rounded-xl font-bold text-xs transition-all"
            >
              <UserPlus size={15} /> Cadastro Cliente
            </button>
            <button
              onClick={() => {
                const latest = allLeads[0];
                if (latest) setShareTarget({ id: latest.id, name: latest.name });
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-700 px-4 py-3 rounded-xl font-bold text-xs transition-all"
            >
              <Share2 size={15} /> Compartilhar
            </button>
            <button
              onClick={onNewProposal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-aqua-600 hover:bg-aqua-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg shadow-aqua-500/30 transition-all transform hover:-translate-y-1 active:scale-95 text-xs sm:text-sm"
            >
              <Plus size={18} /> Nova Proposta
            </button>
          </div>
        </div>


        {activeTab === 'TEAM_MANAGEMENT' ? (
          <AdminPanel />
        ) : activeTab === 'COMMISSIONS' ? (
          <CommissionPanel
            role={(profile?.role as HierarchyRole) || 'analyst_jr'}
            personalSales={metrics?.totalSales || 0}
            teamSales={metrics?.teamTotalSales || 0}
            monthlyEarnings={monthlyEarnings}
            teamAnalysts={[]}
          />
        ) : activeTab === 'OVERVIEW' ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KpiCard
                title="Total Leads"
                value={metrics?.totalLeads || 0}
                icon={Users}
                color="blue"
                trend={`${allLeads.filter(l => {
                  const d = new Date(l.created_at);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length} this month`}
              />
              <KpiCard
                title="No Sales"
                value={metrics?.totalNoSales || 0}
                icon={Filter}
                color="amber"
                trend="presentations"
              />
              <KpiCard
                title="Closed Sales"
                value={metrics?.totalSales || 0}
                icon={CheckCircle}
                color="emerald"
                trend={`${metrics?.monthlyGoal ? Math.round((metrics.totalSales / metrics.monthlyGoal) * 100) : 0}% of goal`}
              />
              <KpiCard
                title="Conversion Rate"
                value={`${metrics?.conversionRate.toFixed(1)}%`}
                icon={TrendingUp}
                color="purple"
                trend="all time"
              />
            </div>

            {/* ── Upcoming Appointments ──────────────────────────────── */}
            {pendingTasks.filter(t => t.type === 'VISIT' && t.scheduled_for).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-aqua-50 flex items-center justify-center">
                    <CalendarIcon size={18} className="text-aqua-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Agendamentos Próximos</h3>
                    <p className="text-xs text-slate-500">Visitas e entrevistas confirmadas pelo portal</p>
                  </div>
                  <span className="ml-auto bg-aqua-100 text-aqua-700 text-xs font-black px-2.5 py-1 rounded-full">
                    {pendingTasks.filter(t => t.type === 'VISIT' && t.scheduled_for).length}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {pendingTasks
                    .filter(t => t.type === 'VISIT' && t.scheduled_for)
                    .slice(0, 10)
                    .map(task => {
                      const dt = new Date(task.scheduled_for);
                      const dateLabel = dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
                      const timeLabel = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      const isInterview = task.title?.toLowerCase().includes('entrevista') || task.notes?.toLowerCase().includes('trabalho');
                      // Parse notes for details
                      const notesLines = (task.notes || '').split('\n').filter(Boolean);
                      return (
                        <div key={task.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                          {/* Date badge */}
                          <div className={`shrink-0 w-14 text-center py-2 rounded-xl ${isInterview ? 'bg-purple-50 text-purple-700' : 'bg-aqua-50 text-aqua-700'}`}>
                            <p className="text-[10px] font-black uppercase tracking-wider">{dateLabel.split(',')[0]}</p>
                            <p className="text-xl font-black leading-none mt-0.5">{dt.getDate()}</p>
                            <p className="text-[10px] font-bold">{timeLabel}</p>
                          </div>
                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-slate-800 text-sm truncate">{task.title?.replace(/^📅\s*/, '')}</p>
                              <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isInterview ? 'bg-purple-100 text-purple-600' : 'bg-aqua-100 text-aqua-600'}`}>
                                {isInterview ? 'Entrevista' : 'Visita'}
                              </span>
                            </div>
                            {notesLines.map((line, i) => (
                              <p key={i} className="text-xs text-slate-500 truncate">{line}</p>
                            ))}
                          </div>
                          {/* Mark done */}
                          <button
                            onClick={async () => {
                              await supabase.from('tasks').update({ status: 'COMPLETED' }).eq('id', task.id);
                              setPendingTasks(prev => prev.filter(t => t.id !== task.id));
                            }}
                            className="shrink-0 text-xs text-slate-400 hover:text-emerald-600 font-bold transition-colors"
                            title="Marcar como concluído"
                          >
                            ✓
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="sales" fill="#00AEEF" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Lead Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.leadsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metrics?.leadsByStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {metrics?.leadsByStatus.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leads Table with Search & Filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    {showAllLeads ? `All Leads (${filteredLeads.length})` : 'Recent Leads'}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-48 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-aqua-500 outline-none"
                      />
                    </div>
                    {/* Filter */}
                    <div className="relative">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-aqua-500 outline-none appearance-none cursor-pointer"
                      >
                        <option value="ALL">All Status</option>
                        <option value="LEAD">Lead</option>
                        <option value="PRESENTATION">Presentation</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="SALE">Sale</option>
                        <option value="NO SALE">No Sale</option>
                        <option value="INSTALLED">Installed</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setShowAllLeads(prev => !prev)}
                      className="text-sm text-aqua-600 font-bold hover:text-aqua-500 whitespace-nowrap"
                    >
                      {showAllLeads ? 'Show Less' : 'View All'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Client Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{lead.name}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-6 py-4">{new Date(lead.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-500">{lead.email || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setShareTarget({ id: lead.id, name: lead.name })}
                              className="p-1.5 text-slate-400 hover:text-aqua-600 hover:bg-aqua-50 rounded-lg transition-colors"
                              title="Compartilhar proposta"
                            >
                              <Share2 size={15} />
                            </button>
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="text-aqua-600 hover:text-aqua-500 font-bold text-xs uppercase"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayedLeads.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          {searchTerm || statusFilter !== 'ALL' ? 'No leads match your search.' : 'No leads found. Start a new proposal!'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!showAllLeads && filteredLeads.length > 5 && (
                <div className="p-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowAllLeads(true)}
                    className="text-sm text-aqua-600 font-bold hover:text-aqua-500"
                  >
                    Show all {filteredLeads.length} leads →
                  </button>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'RECOMMENDATIONS' ? (
          <RecommendationsPanel />
        ) : null}

        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-aqua-100 text-aqua-600 rounded-full flex items-center justify-center">
                  <UserCog size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Editar Perfil</h3>
                  <p className="text-sm text-slate-500">Altere sua foto e nome de exibição.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome de Exibição / Nickname</label>
                  <input 
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-aqua-500 focus:border-aqua-500 block p-3 outline-none"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL da Foto de Perfil (Opcional)</label>
                  <input 
                    type="url"
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-aqua-500 focus:border-aqua-500 block p-3 outline-none"
                    placeholder="https://suafoto.com/imagem.jpg"
                  />
                  <p className="text-xs text-slate-400 mt-1">Cole o link (URL) de uma imagem para ser seu avatar circular.</p>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setShowProfileModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSavingProfile} className="px-5 py-2.5 text-sm font-bold text-white bg-aqua-600 hover:bg-aqua-500 rounded-xl disabled:opacity-50 flex items-center gap-2">
                    {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedLead.name}</h3>
                <StatusBadge status={selectedLead.status} />
              </div>
              <button
                onClick={() => { setSelectedLead(null); setIsScheduling(false); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              {selectedLead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Mail size={14} className="text-blue-500" />
                  </div>
                  <span className="text-slate-600">{selectedLead.email}</span>
                </div>
              )}
              {selectedLead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Phone size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-slate-600">{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.zip_code && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <MapPin size={14} className="text-amber-500" />
                  </div>
                  <span className="text-slate-600">ZIP: {selectedLead.zip_code}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                  <Clock size={14} className="text-slate-500" />
                </div>
                <span className="text-slate-600">Added {new Date(selectedLead.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {isScheduling ? (
              <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Schedule Follow-up</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                    <input type="date" value={taskForm.date} onChange={e => setTaskForm({ ...taskForm, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-aqua-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                    <select value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value as any })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-aqua-500">
                      <option value="MESSAGE">WhatsApp / SMS</option>
                      <option value="EMAIL">Email</option>
                      <option value="CALL">Phone Call</option>
                      <option value="VISIT">In-Person Visit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Objective / Notes for AI</label>
                    <textarea value={taskForm.notes} onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })} placeholder="Ex: Perguntar sobre o bônus de dezembro" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-aqua-500 h-20 resize-none"></textarea>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsScheduling(false)} className="flex-1 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200">Cancel</button>
                    <button onClick={handleScheduleTask} className="flex-1 py-2 text-sm font-bold bg-aqua-600 text-white rounded-lg hover:bg-aqua-500 shadow-md">Salvar</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                {/* ── Close Sale CTA —  only shown for non-sale statuses ── */}
                {!['SALE','INSTALLED','ACTIVE'].includes(selectedLead.status) ? (
                  <button
                    onClick={() => handleCloseSale(selectedLead)}
                    className="w-full py-3 text-sm font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    ✅ Fechar Venda — Calcular Comissões
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.from('client_points').select('referral_token').eq('client_id', selectedLead.id).single();
                        if (error || !data) throw new Error('Portal ainda não ativado ou token não encontrado.');
                        const url = `https://aquafeelphilly.com/vip?token=${data.referral_token}`;
                        await navigator.clipboard.writeText(url);
                        toast.success('Link do Portal VIP copiado para a área de transferência!');
                      } catch (err: any) {
                        toast.error(err.message);
                      }
                    }}
                    className="w-full py-3 text-sm font-black bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-950 rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
                  >
                    👑 Copiar Link do Portal VIP (Indicações)
                  </button>
                )}
                
                {(selectedLead as any).proposal_pdf_url && (
                  <a
                    href={(selectedLead as any).proposal_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 text-sm font-bold bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={16} className="text-white" />
                    Ver PDF da Proposta
                  </a>
                )}

                <button
                  onClick={() => setIsScheduling(true)}
                  className="w-full py-3 text-sm font-bold bg-slate-50 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <CalendarCheck size={16} className="text-aqua-600" />
                  Agendar Follow-up
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { onNewProposal(); setSelectedLead(null); }}
                    className="flex-1 py-2 text-sm font-bold bg-aqua-600 text-white rounded-xl hover:bg-aqua-500 transition-colors"
                  >
                    New Proposal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {executingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-aqua-600" /> AI Draft Ready
              </h3>
              <button onClick={() => setExecutingTask(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedDraft}</p>
            </div>
            <div className="text-xs text-slate-500 mb-6 px-2 text-center bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200">
              This message will be sent to the client (simulation). In production, this connects to WhatsApp/Twilio API.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setExecutingTask(null)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await supabase.from('tasks').update({ status: 'COMPLETED', ai_draft: generatedDraft }).eq('id', executingTask.id);
                    toast.success('Mensagem enviada com sucesso! ✅');
                    setExecutingTask(null);
                    fetchDashboardData();
                  } catch (e) { }
                }}
                className="flex-1 py-3 text-sm font-bold bg-aqua-600 text-white rounded-xl hover:bg-aqua-500 shadow-lg shadow-aqua-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Play size={16} /> Authorize & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareTarget && (
        <ShareProposalModal
          isOpen={true}
          onClose={() => setShareTarget(null)}
          clientId={shareTarget.id}
          clientName={shareTarget.name}
        />
      )}

      {/* Signup Link Modal */}
      {showSignupLinkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800">Enviar Cadastro via WhatsApp</h3>
                <p className="text-slate-500 text-xs">O cliente recebe o link de cadastro direto no WhatsApp</p>
              </div>
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-4 focus-within:ring-2 focus-within:ring-emerald-400 transition-all">
              <span className="pl-4 pr-2 flex items-center gap-1.5 text-slate-500 font-bold text-sm shrink-0">+1</span>
              <input
                type="tel" placeholder="215-000-0000" value={signupPhone}
                onChange={e => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 bg-transparent pr-4 py-3 text-slate-900 text-sm focus:outline-none"
                autoFocus
              />
            </div>

            {/* Preview message */}
            {signupPhone.length >= 7 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-1">Mensagem que será enviada:</p>
                Olá! Aqui é da Aquafeel Philly 💧<br/>
                Clique no link para criar sua conta gratuita no Portal VIP e acompanhar seus pontos:<br/>
                <span className="text-emerald-600 font-bold">{window.location.origin}/client-signup</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowSignupLinkModal(false); setSignupPhone(''); }}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <a
                href={signupPhone.length >= 7
                  ? `https://wa.me/1${signupPhone}?text=${encodeURIComponent(`Olá! Aqui é da Aquafeel Philly 💧\n\nClique no link abaixo para criar sua conta gratuita no Portal VIP Aquafeel e começar a acompanhar seus pontos e recompensas:\n\n👉 ${window.location.origin}/client-signup\n\nQualquer dúvida, estou à disposição! 😊`)}`
                  : undefined
                }
                target="_blank" rel="noopener noreferrer"
                onClick={() => { if (signupPhone.length >= 7) { setShowSignupLinkModal(false); setSignupPhone(''); } }}
                className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${
                  signupPhone.length >= 7
                    ? 'bg-[#25D366] text-white hover:bg-[#1ebe5d] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                }`}
              >
                <MessageCircle size={16} /> Enviar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colorClasses: any = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 mb-2">{value}</h3>
        <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
          <TrendingUp size={12} className="text-emerald-500" />
          {trend}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    LEAD: 'bg-slate-100 text-slate-600',
    PRESENTATION: 'bg-blue-100 text-blue-700',
    SALE: 'bg-emerald-100 text-emerald-700',
    'NO SALE': 'bg-slate-200 text-slate-800',
    LOST: 'bg-red-100 text-red-700',
    SCHEDULED: 'bg-amber-100 text-amber-700',
    INSTALLED: 'bg-green-100 text-green-700',
    ACTIVE: 'bg-teal-100 text-teal-700',
    QUALIFIED: 'bg-purple-100 text-purple-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status] || styles.LEAD}`}>
      {status}
    </span>
  );
};
