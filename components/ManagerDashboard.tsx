
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  RefreshCw,
  LogOut,
  Calendar,
  MapPin,
  Mail,
  CloudLightning,
  UserCheck,
  TrendingUp,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  Download,
  MessageSquare,
  CheckCircle,
  Send
} from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';
import { ClientDashboard } from './ClientDashboard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CommissionPanel, AnalystStat } from './CommissionPanel';
import { HierarchyRole } from '../utils/commissions';
import { HierarchyManager } from './HierarchyManager';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { MarketingService } from '../lib/marketing';

// Tipos
interface Lead {
  id: string;
  created_at: string;
  name: string;
  spouse_name: string;
  email: string;
  zip_code: string;
  analyst: string; // Stores email directly
  status: 'LEAD' | 'PRESENTATION' | 'SALE' | 'LOST' | 'INSTALLED' | 'ACTIVE' | 'MAINTENANCE';
  analyst_details?: {
    first_name: string;
    last_name: string;
    manager_name: string;
  };
}

export const ManagerDashboard: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { user, profile, signOut } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [marketingLogs, setMarketingLogs] = useState<string[]>([]);
  const [isRunningCampaign, setIsRunningCampaign] = useState(false);
  const [teamAnalysts, setTeamAnalysts] = useState<AnalystStat[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchTeamAnalysts();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      // Fetch clients and join with analysts table to get details
      // Note: Supabase join syntax depends on foreign keys. 
      // If 'analyst' column in clients is just an email string and not a FK to analysts table, we might need to fetch separately or adjust schema.
      // Assuming for now we fetch clients and then maybe enrich or just show what we have.
      // Ideally, clients.analyst should be a FK to analysts.email or analysts.id

      // Let's try to fetch clients first.
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (clientsError) throw clientsError;

      // Now let's try to fetch analyst details for these clients.
      // We can collect all unique analyst emails.
      const analystEmails = [...new Set(clientsData?.map(c => c.analyst).filter(Boolean))];

      let analystsMap: Record<string, any> = {};

      if (analystEmails.length > 0) {
        const { data: analystsData, error: analystsError } = await supabase
          .from('analysts')
          .select('email, first_name, last_name, manager_name')
          .in('email', analystEmails);

        if (!analystsError && analystsData) {
          analystsData.forEach(a => {
            analystsMap[a.email] = a;
          });
        }
      }

      // Merge data
      const enrichedLeads = clientsData?.map(client => ({
        ...client,
        analyst_details: analystsMap[client.analyst]
      })) || [];

      setLeads(enrichedLeads);
    } catch (error) {
      console.error("Erro ao buscar leads", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamAnalysts = async () => {
    try {
      const { data: performanceData, error } = await supabase
        .from('analyst_performance')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      if (!performanceData) return;

      const stats = performanceData.map((p: any) => ({
        id: p.id,
        name: p.display_name,
        role: (p.role as HierarchyRole) || 'analyst_jr',
        totalSales: p.total_sales,
        totalLeads: p.total_leads,
        conversionRate: p.conversion_rate,
      } as AnalystStat));

      setTeamAnalysts(stats);
    } catch (err) {
      console.error('Error fetching team analysts:', err);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onExit();
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Nome', 'Conjuge', 'Email', 'CEP', 'Analista', 'Gerente', 'Status'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${new Date(lead.created_at).toLocaleDateString()}"`,
        `"${lead.name}"`,
        `"${lead.spouse_name || ''}"`,
        `"${lead.email}"`,
        `"${lead.zip_code}"`,
        `"${lead.analyst_details ? `${lead.analyst_details.first_name} ${lead.analyst_details.last_name}` : lead.analyst || 'N/A'}"`,
        `"${lead.analyst_details?.manager_name || 'N/A'}"`,
        `"${lead.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const runNurture = async () => {
    setIsRunningCampaign(true);
    setMarketingLogs(prev => [...prev, 'Starting Nurture Campaign (Leads/Lost)...']);
    try {
      const result = await MarketingService.runNurtureCampaign();
      setMarketingLogs(prev => [
        ...prev,
        `Processed ${result.processed} leads.`,
        ...result.logs
      ]);
    } catch (err) {
      setMarketingLogs(prev => [...prev, `Error: ${err}`]);
    } finally {
      setIsRunningCampaign(false);
    }
  };

  const runMaintenance = async () => {
    setIsRunningCampaign(true);
    setMarketingLogs(prev => [...prev, 'Starting Maintenance Campaign (Customers)...']);
    try {
      const result = await MarketingService.runMaintenanceCampaign();
      setMarketingLogs(prev => [
        ...prev,
        `Processed ${result.processed} customers.`,
        ...result.logs
      ]);
    } catch (err) {
      setMarketingLogs(prev => [...prev, `Error: ${err}`]);
    } finally {
      setIsRunningCampaign(false);
    }
  };

  // Métricas
  const totalLeads = leads.length;
  const totalPresentations = leads.filter(l => l.status === 'PRESENTATION' || l.status === 'SALE').length;
  const totalSales = leads.filter(l => l.status === 'SALE').length;

  // Projeção: Base 2x1 (2 apresentações = 1 venda)
  // Se temos X apresentações que não viraram venda, projetamos X/2 novas vendas
  const activePresentations = leads.filter(l => l.status === 'PRESENTATION').length;
  const projectedSales = Math.floor(activePresentations / 2);
  const conversionRate = totalPresentations > 0 ? ((totalSales / totalPresentations) * 100).toFixed(1) : '0';

  // Dados para Gráficos
  const funnelData = [
    { name: 'Leads', value: totalLeads, fill: '#64748b' },
    { name: 'Apresentações', value: totalPresentations, fill: '#3b82f6' },
    { name: 'Vendas', value: totalSales, fill: '#10b981' },
  ];

  const salesProjectionData = [
    { name: 'Vendas Atuais', value: totalSales },
    { name: 'Projeção (+)', value: projectedSales },
  ];

  const COLORS = ['#10b981', '#f59e0b'];

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.zip_code?.includes(searchTerm) ||
      lead.analyst?.toLowerCase().includes(searchLower) ||
      lead.analyst_details?.first_name?.toLowerCase().includes(searchLower) ||
      lead.analyst_details?.last_name?.toLowerCase().includes(searchLower)
    );
  });

  const getHeatmapColor = (status: string) => {
    switch (status) {
      case 'LEAD': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'PRESENTATION': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'SALE': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'INSTALLED': return 'bg-green-100 text-green-600 border-green-200';
      case 'ACTIVE': return 'bg-teal-100 text-teal-600 border-teal-200';
      case 'LOST': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getProgressWidth = (status: string) => {
    switch (status) {
      case 'LEAD': return '10%';
      case 'PRESENTATION': return '40%';
      case 'SALE': return '80%';
      case 'INSTALLED': return '90%';
      case 'ACTIVE': return '100%';
      case 'LOST': return '100%'; // Full width but red
      default: return '0%';
    }
  };

  const getProgressColor = (status: string) => {
    if (status === 'LOST') return 'bg-red-500';
    if (['SALE', 'INSTALLED', 'ACTIVE'].includes(status)) return 'bg-gradient-to-r from-blue-500 to-red-500'; // Heatmap style
    return 'bg-blue-500';
  };

  if (currentView === 'CLIENTS') {
    return <ClientDashboard onClose={() => { setCurrentView('DASHBOARD'); setIsMobileMenuOpen(false); }} />;
  }

  if (currentView === 'HIERARCHY') {
    return (
      <div className="min-h-screen bg-slate-50 flex relative">
        <aside className="hidden md:flex flex-col w-64 bg-[#020d1a] text-white border-r border-white/5">
          <div className="p-6 border-b border-white/5 flex justify-center">
            <AquaFeelLogo width="140px" variant="white" />
          </div>
          <nav className="p-4 space-y-1">
            {[['DASHBOARD','Dashboard'],['HIERARCHY','🌳 Hierarquia'],['COMMISSIONS','💰 Comissões'],['CLIENTS','Clientes'],['MARKETING','Marketing']].map(([k,l]) => (
              <button key={k} onClick={() => setCurrentView(k)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === k ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}>{l}</button>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors w-full"><LogOut size={14} /> Sair</button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-xl font-black text-slate-900">🌳 Hierarquia da Equipe</h2>
            <button onClick={() => setCurrentView('DASHBOARD')} className="text-sm text-slate-500 hover:text-slate-900 font-bold">← Voltar</button>
          </header>
          <div className="p-8">
            <HierarchyManager />
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'COMMISSIONS') {
    const myRole = (profile?.role as HierarchyRole) || 'manager_jr';
    const mySales = teamAnalysts.find(a => a.id === user?.id)?.totalSales ?? 0;
    const teamTotal = teamAnalysts.reduce((s, a) => s + a.totalSales, 0);
    return (
      <div className="min-h-screen bg-slate-50 flex relative">
        {/* Sidebar intentionally simple in commission view */}
        <aside className="hidden md:flex flex-col w-64 bg-[#020d1a] text-white border-r border-white/5">
          <div className="p-6 border-b border-white/5 flex justify-center">
            <AquaFeelLogo width="140px" variant="white" />
          </div>
          <nav className="p-4 space-y-1">
            {[['DASHBOARD','Dashboard Geral'],['COMMISSIONS','💰 Comissões'],['CLIENTS','Clientes'],['MARKETING','Marketing']] .map(([k,l]) => (
              <button key={k} onClick={() => setCurrentView(k)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === k ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}>{l}</button>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors w-full"><LogOut size={14} /> Sair</button>
          </div>
        </aside>
        <main className="flex-1 overflow-auto h-screen">
          <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between sticky top-0 z-20">
            <h2 className="text-xl font-black text-slate-900">Comissões &amp; Hierarquia</h2>
            <button onClick={() => setCurrentView('DASHBOARD')} className="text-sm text-slate-500 hover:text-slate-900 font-bold">← Voltar</button>
          </header>
          <div className="p-8">
            <CommissionPanel
              role={myRole}
              personalSales={mySales}
              teamSales={teamTotal}
              teamAnalysts={teamAnalysts}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#020d1a] text-white flex flex-col border-r border-white/5 transition-transform duration-300 md:translate-x-0 md:static
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/5 flex justify-center relative">
          <AquaFeelLogo width="140px" variant="white" />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-slate-400"
          >
            <LogOut size={20} className="rotate-180" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-r from-aqua-600 to-blue-600 p-4 rounded-xl mb-6 shadow-lg">
            <p className="text-[10px] uppercase font-black opacity-80 mb-1">Total de Leads</p>
            <p className="text-3xl font-black">{totalLeads}</p>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-300 font-bold">
              <CloudLightning size={12} /> Live Sync Active
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setCurrentView('DASHBOARD'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === 'DASHBOARD' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              <LayoutDashboard size={16} /> Dashboard Geral
            </button>
            <button
              onClick={() => { setCurrentView('CLIENTS'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === 'CLIENTS' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              <UserCheck size={16} /> Gestão de Clientes
            </button>
            <button
              onClick={() => { setCurrentView('HIERARCHY'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === 'HIERARCHY' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              🌳 Hierarquia
            </button>
            <button
              onClick={() => { setCurrentView('COMMISSIONS'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === 'COMMISSIONS' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              💰 Comissões & Hierarquia
            </button>
            <button
              onClick={() => { setCurrentView('MARKETING'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${currentView === 'MARKETING' ? 'bg-white/10 text-white border-white/10' : 'text-slate-400 border-transparent hover:bg-white/5'}`}
            >
              <Mail size={16} /> Automação Marketing
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-white/5">
          <div className="mb-4 px-2">
            <p className="text-xs text-slate-400">Logado como:</p>
            <p className="text-sm font-bold text-white truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors w-full">
            <LogOut size={14} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-auto h-screen w-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <LayoutDashboard size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Painel do Gestor</h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1">Visão geral de leads e performance</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
              title="Exportar CSV"
            >
              <Download size={16} /> <span className="hidden md:inline">Exportar CSV</span>
            </button>
            <button
              onClick={fetchLeads}
              className="p-2 text-slate-400 hover:text-aqua-600 hover:bg-aqua-50 rounded-lg transition-all"
              title="Atualizar Dados"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {currentView === 'MARKETING' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nurture Campaign Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Mail size={120} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <RefreshCw className="text-blue-500" />
                    Lead Nurture Automation
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Automatically send monthly newsletters to leads who haven't purchased yet.
                    Uses AI to generate fresh content about water quality and health benefits.
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Target: Leads, Lost, Contacted
                    </div>
                    <button
                      onClick={runNurture}
                      disabled={isRunningCampaign}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                    >
                      {isRunningCampaign ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                      Run Campaign Now
                    </button>
                  </div>
                </div>

                {/* Maintenance Campaign Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MessageSquare size={120} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" />
                    Customer Success & Upsell
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Send monthly reminders to existing customers to check salt levels and offer organic soap refills.
                    Keeps customers engaged and systems running perfectly.
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Target: Active Customers
                    </div>
                    <button
                      onClick={runMaintenance}
                      disabled={isRunningCampaign}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                    >
                      {isRunningCampaign ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                      Run Campaign Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Console */}
              <div className="bg-slate-900 rounded-xl p-6 font-mono text-sm text-slate-300 h-64 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    System Logs
                  </span>
                  <button
                    onClick={() => setMarketingLogs([])}
                    className="text-xs text-slate-500 hover:text-white transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>
                {marketingLogs.length === 0 ? (
                  <div className="text-slate-600 italic">Waiting for campaign execution...</div>
                ) : (
                  <div className="space-y-1">
                    {marketingLogs.map((log, i) => (
                      <div key={i} className="border-l-2 border-slate-700 pl-2 py-0.5 hover:bg-slate-800/50 transition-colors">
                        <span className="text-slate-500 text-xs mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* KPIs Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users size={20} /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Total Leads</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{totalLeads}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><PieChartIcon size={20} /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Apresentações</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{totalPresentations}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><DollarSign size={20} /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Vendas Fechadas</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">{totalSales}</div>
                  <div className="text-xs text-emerald-600 font-bold mt-2">{conversionRate}% Conversão</div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full"></div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-amber-100 p-3 rounded-xl text-amber-600"><TrendingUp size={20} /></div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Projeção (2x1)</span>
                  </div>
                  <div className="text-3xl font-black text-slate-900">+{projectedSales}</div>
                  <div className="text-xs text-amber-600 font-bold mt-2">Novas vendas estimadas</div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Funil de Vendas</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {funnelData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={funnelData[index].fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Projeção de Fechamento</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesProjectionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {salesProjectionData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-sm text-slate-500">Baseado na regra: <span className="font-bold text-slate-900">2 Apresentações = 1 Venda</span></p>
                  </div>
                </div>
              </div>

              {/* Tabela de Leads Recentes */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Leads Recentes & Performance</h3>
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-aqua-500 outline-none"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Analista</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerente</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Heatmap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 text-xs font-medium text-slate-600">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-slate-400" />
                                {new Date(lead.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-900 text-sm">{lead.name}</div>
                              {lead.spouse_name && <div className="text-xs text-slate-500">+ {lead.spouse_name}</div>}
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                <MapPin size={10} /> {lead.zip_code}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                  {lead.analyst_details?.first_name?.[0] || lead.analyst?.[0] || 'A'}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-700">
                                    {lead.analyst_details ? `${lead.analyst_details.first_name} ${lead.analyst_details.last_name}` : lead.analyst || 'N/A'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{lead.analyst}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-xs font-medium text-slate-600">
                                {lead.analyst_details?.manager_name || '-'}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-2">
                                <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit border ${getHeatmapColor(lead.status)}`}>
                                  {lead.status}
                                </span>
                                {/* Heatmap Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(lead.status)}`}
                                    style={{ width: getProgressWidth(lead.status) }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                            {isLoading ? (
                              <div className="flex justify-center items-center gap-2">
                                <RefreshCw className="animate-spin text-aqua-600" size={20} />
                                <span>Carregando dados...</span>
                              </div>
                            ) : "Nenhum lead encontrado."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

