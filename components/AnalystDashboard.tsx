
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
  MessageSquare, CalendarCheck, Play, CheckCircle2
} from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';
import { toast } from 'sonner';
import { ShareProposalModal } from './ShareProposalModal';
import { MarketingService } from '../lib/marketing';
import { Task } from '../types';

interface DashboardMetrics {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  activePresentations: number;
  totalNoSales: number;
  monthlyGoal: number;
  leadsByStatus: { name: string; value: number }[];
  salesTrend: { name: string; sales: number }[];
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
  const { user, signOut } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAllLeads, setShowAllLeads] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ name: string; zip: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TASKS'>('OVERVIEW');
  const [isScheduling, setIsScheduling] = useState(false);
  const [executingTask, setExecutingTask] = useState<Task | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [taskForm, setTaskForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'MESSAGE' as 'CALL' | 'MESSAGE' | 'EMAIL' | 'VISIT',
    notes: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .or(`analyst.eq.${user.email},analyst_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalLeads = clients.length;
      const sales = clients.filter(c => c.status === 'SALE' || c.status === 'INSTALLED' || c.status === 'ACTIVE');
      const totalSales = sales.length;
      const noSales = clients.filter(c => c.status === 'NO SALE').length;
      const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;
      const presentations = clients.filter(c => c.status === 'PRESENTATION' || c.status === 'SCHEDULED');

      const statusCounts = clients.reduce((acc: any, client: any) => {
        acc[client.status] = (acc[client.status] || 0) + 1;
        return acc;
      }, {});

      const leadsByStatus = Object.keys(statusCounts).map(key => ({
        name: key,
        value: statusCounts[key]
      }));

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
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

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('analyst_id', user.id)
        .eq('status', 'PENDING')
        .order('scheduled_for', { ascending: true });

      setMetrics({
        totalLeads,
        totalSales,
        totalNoSales: noSales,
        conversionRate,
        activePresentations: presentations.length,
        monthlyGoal: 10,
        leadsByStatus,
        salesTrend: trendData
      });

      setAllLeads(clients);
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
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Overview & Leads
              </button>
              <button
                onClick={() => setActiveTab('TASKS')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'TASKS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Today's Tasks
                {pendingTasks.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingTasks.length}</span>
                )}
              </button>
            </div>
            <h1 className="md:hidden text-lg font-bold text-slate-700">Analyst Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user?.email}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Analyst</p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign Out"
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const latest = allLeads[0];
                setShareTarget({
                  name: latest?.name || '',
                  zip: latest?.zip_code || ''
                });
              }}
              className="flex items-center justify-center gap-2 border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-700 px-5 py-3 rounded-xl font-bold text-sm transition-all"
            >
              <Share2 size={16} />
              Compartilhar
            </button>
            <button
              onClick={onNewProposal}
              className="flex items-center justify-center gap-2 bg-aqua-600 hover:bg-aqua-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-aqua-500/30 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              <Plus size={20} />
              New Proposal
            </button>
          </div>
        </div>


        {activeTab === 'OVERVIEW' ? (
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
                              onClick={() => setShareTarget({ name: lead.name, zip: lead.zip_code || '' })}
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
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Your Pending Tasks</h3>
              <p className="text-sm text-slate-500">Stay on top of your follow-ups to close more deals.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingTasks.map((task) => {
                const client = allLeads.find(l => l.id === task.client_id);
                const isOverdue = new Date(task.scheduled_for) < new Date();

                return (
                  <div key={task.id} className={`p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/10' : ''}`}>
                    <div className="flex gap-4 items-start">
                      <div className={`p-3 rounded-xl ${task.type === 'MESSAGE' ? 'bg-blue-100 text-blue-600' : task.type === 'CALL' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {task.type === 'MESSAGE' ? <MessageSquare size={24} /> : task.type === 'CALL' ? <Phone size={24} /> : <CalendarCheck size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">{task.title}</h4>
                          {isOverdue && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full tracking-wider">Overdue</span>}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">{client ? client.name : 'Unknown Client'}</p>
                        {task.notes && <p className="text-xs text-slate-500 line-clamp-2 max-w-lg">Goal: {task.notes}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(task.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (task.type === 'MESSAGE' || task.type === 'EMAIL') {
                          setExecutingTask(task);
                          const tid = toast.loading('Gerando mensagem com Inteligência Artificial...');
                          const draft = await MarketingService.generateFollowUpMessage(
                            client?.name || 'Cliente',
                            client?.status || 'LEAD',
                            task.notes || 'Fazer follow-up para tentar fechar a venda.'
                          );
                          setGeneratedDraft(draft);
                          toast.dismiss(tid);
                        } else {
                          // Just mark done for calls/visits
                          try {
                            await supabase.from('tasks').update({ status: 'COMPLETED' }).eq('id', task.id);
                            toast.success('Tarefa concluída!');
                            fetchDashboardData();
                          } catch (e) { }
                        }
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
                    >
                      <Play size={16} />
                      {task.type === 'MESSAGE' ? 'Generate AI Draft' : 'Mark Done'}
                    </button>
                  </div>
                );
              })}

              {pendingTasks.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">All caught up!</h3>
                  <p className="text-sm">You have no pending tasks. Great job!</p>
                </div>
              )}
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
          clientName={shareTarget.name}
          clientZip={shareTarget.zip}
        />
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
