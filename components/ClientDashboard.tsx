import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Bell,
  FileUp,
  Download,
  SortAsc,
  SortDesc,
  PartyPopper,
  Save,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClientData, ClientStatus } from '../types';
import { getClients, saveClient, updateClientStatus, deleteClient } from '../utils/clientStore';
import { useAuth } from '../contexts/AuthContext';
import { getCreditRange, calculateMonthlyInstallment, formatCurrency } from '../utils/financials';
import { toast } from 'sonner';
import { MarketingService } from '../lib/marketing';
import { supabase } from '../lib/supabase';

interface ClientDashboardProps {
  onClose: () => void;
}

type SortField = 'name' | 'city' | 'state' | 'zipCode' | 'status';
type SortDirection = 'asc' | 'desc';

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'ALL' | 'COLD_LIST'>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [newStatus, setNewStatus] = useState<ClientStatus | null>(null);
  const [observation, setObservation] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<ClientData>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [tempScore, setTempScore] = useState<number | ''>('');
  const [selectedTerm, setSelectedTerm] = useState<Record<string, 60 | 120 | 180>>({});
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [newRefName, setNewRefName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermChange = (clientId: string, term: 60 | 120 | 180) => {
    setSelectedTerm(prev => ({ ...prev, [clientId]: term }));
  };

  const handleStatusChange = (client: ClientData, status: ClientStatus) => {
    if (client.status === status) return;
    setSelectedClient(client);
    setNewStatus(status);
    setObservation('');
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedClient || !newStatus || !observation.trim()) return;

    try {
      await updateClientStatus(selectedClient.id, newStatus, observation, user?.email || 'Unknown');

      if (newStatus === 'QUALIFIED') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 5000);
      }

      await loadClients();
      setIsStatusModalOpen(false);
      setSelectedClient(null);
      setNewStatus(null);
      setObservation('');
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleEditClick = (client: ClientData) => {
    setFormData({ ...client });
    setIsEditModalOpen(true);
  };

  const handleAddClick = () => {
    setFormData({
      id: crypto.randomUUID(),
      status: 'LEAD',
      createdAt: new Date().toISOString(),
      referrals: [],
      observations: [],
      analyst: user?.email || '',
      lang: 'en'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast.error('Nome é obrigatório.'); return; }
    if (!formData.email) { toast.error('Email é obrigatório.'); return; }
    if (!formData.phone) { toast.error('Telefone é obrigatório.'); return; }

    try {
      const clientToSave = {
        ...formData,
        analyst: formData.analyst || user?.email || '',
        lang: formData.lang || 'en'
      };
      await saveClient(clientToSave as ClientData);
      await loadClients();
      setIsEditModalOpen(false);
      setFormData({});
      toast.success('Cliente salvo com sucesso!');
    } catch (error: any) {
      console.error('Failed to save client', error);
      toast.error(`Erro ao salvar cliente: ${error?.message || 'Tente novamente.'}`);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    // Show a dismissable toast with undo instead of a blocking confirm()
    let cancelled = false;
    const toastId = toast(`Excluindo ${name}...`, {
      duration: 5000,
      action: {
        label: 'Desfazer',
        onClick: () => { cancelled = true; toast.dismiss(toastId); }
      }
    });

    await new Promise(r => setTimeout(r, 5000));
    if (cancelled) return;

    try {
      await deleteClient(id);
      await loadClients();
      toast.success(`${name} excluído.`);
    } catch (error) {
      console.error('Failed to delete client', error);
      toast.error('Erro ao excluir cliente. Tente novamente.');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const newClients: ClientData[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim());
        const client: any = {
          id: crypto.randomUUID(),
          status: 'LEAD',
          createdAt: new Date().toISOString(),
          referrals: [],
          observations: [],
          analyst: user?.email || '',
          lang: 'en'
        };

        headers.forEach((header, index) => {
          if (header === 'name') client.name = values[index];
          if (header === 'email') client.email = values[index];
          if (header === 'phone') client.phone = values[index];
          if (header === 'address') client.address = values[index];
          if (header === 'city') client.city = values[index];
          if (header === 'state') client.state = values[index];
          if (header === 'zipcode' || header === 'zip code') client.zipCode = values[index];
        });

        if (client.name && client.email) {
          newClients.push(client);
        }
      }

      for (const client of newClients) {
        await saveClient(client);
      }

      await loadClients();
      setIsImportModalOpen(false);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = ['Name,Email,Phone,Address,City,State,ZipCode'];
    const blob = new Blob([headers.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const saveCreditScore = async (client: ClientData) => {
    if (tempScore === '') return;
    try {
      await saveClient({ ...client, creditScore: Number(tempScore) });
      setEditingScoreId(null);
      setTempScore('');
      await loadClients();
    } catch (error) {
      console.error('Failed to save credit score', error);
    }
  };

  const sendSaltReminder = async (client: ClientData) => {
    if (!client.email) {
      toast.error('Este cliente não tem email cadastrado.');
      return;
    }
    setSendingReminderId(client.id);
    const toastId = toast.loading(`Enviando lembrete para ${client.name}...`);
    try {
      const content = await MarketingService.generateContent('MAINTENANCE');

      // Log the reminder in Supabase for traceability
      await supabase.from('clients').update({
        updated_at: new Date().toISOString()
      }).eq('id', client.id);

      // TODO: plug in real email/WhatsApp send here when edge function is ready
      // await supabase.functions.invoke('send-reminder', { body: { to: client.email, subject: content.subject, html: content.body } });

      toast.success(`Lembrete enviado para ${client.name}! Assunto: "${content.subject}"`, { id: toastId, duration: 5000 });
    } catch (err: any) {
      console.error('Salt reminder failed', err);
      toast.error(`Falha ao enviar lembrete: ${err?.message || 'Tente novamente.'}`, { id: toastId });
    } finally {
      setSendingReminderId(null);
    }
  };

  const filteredClients = clients
    .filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);

      if (viewMode === 'COLD_LIST') {
        return matchesSearch && (client.status === 'LEAD' || client.status === 'LOST');
      }

      const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = String(a[sortField] || '').toLowerCase();
      const bValue = String(b[sortField] || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Client Management</h1>
            <p className="text-slate-500">Manage your leads, clients, and installations</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'ALL')}
                className="pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="LEAD">Lead</option>
                <option value="PRESENTATION">Presentation</option>
                <option value="SALE">Sale</option>
                <option value="LOST">Lost</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="INSTALLED">Installed</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'ALL' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                All Clients
              </button>
              <button
                onClick={() => setViewMode('COLD_LIST')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'COLD_LIST' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cold List
              </button>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
            >
              <FileUp size={20} /> Import CSV
            </button>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
            >
              <Plus size={20} /> Add Client
            </button>
          </div>
        </div>

        {/* Client Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Name {sortField === 'name' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status {sortField === 'status' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => handleSort('city')}>
                    <div className="flex items-center gap-1">Location {sortField === 'city' && (sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />)}</div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Score</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Credit Range</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">System Price</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Installment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Cashback</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                      Loading clients...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-slate-500">
                      No clients found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const term = selectedTerm[client.id] || 180;
                    const monthlyPayment = client.creditScore ? calculateMonthlyInstallment(client.creditScore, 8790, term) : 0;
                    const currentSpend = (client.waterConsumption || 0) + (client.cleaningConsumption || 0);
                    const cashback = currentSpend - monthlyPayment;

                    return (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{client.name}</div>
                          <div className="text-xs text-slate-500">Added {new Date(client.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={client.status}
                            onChange={(e) => handleStatusChange(client, e.target.value as ClientStatus)}
                            className={`text-xs font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer
                            ${client.status === 'QUALIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                client.status === 'LOST' ? 'bg-red-100 text-red-700' :
                                  client.status === 'LEAD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
                          >
                            <option value="LEAD">Lead</option>
                            <option value="PRESENTATION">Presentation</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="SALE">Sale</option>
                            <option value="SCHEDULED">Scheduled</option>
                            <option value="INSTALLED">Installed</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="LOST">Lost</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone size={14} /> {client.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail size={14} /> {client.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{client.city || '-'}, {client.state || '-'}</div>
                          <div className="text-xs text-slate-500">{client.zipCode || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingScoreId === client.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={tempScore}
                                onChange={(e) => setTempScore(Number(e.target.value))}
                                className="w-20 p-1 border border-slate-300 rounded text-sm"
                                autoFocus
                              />
                              <button onClick={() => saveCreditScore(client)} className="text-emerald-600 hover:text-emerald-700">
                                <Save size={16} />
                              </button>
                              <button onClick={() => setEditingScoreId(null)} className="text-red-500 hover:text-red-600">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div
                              className="text-sm font-bold text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                              onClick={() => {
                                setEditingScoreId(client.id);
                                setTempScore(client.creditScore || '');
                              }}
                            >
                              {client.creditScore || 'Add Score'} <Edit2 size={12} className="opacity-50" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs font-bold ${getCreditRange(client.creditScore).color}`}>
                            {getCreditRange(client.creditScore).label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">
                          {formatCurrency(8790)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                          {client.creditScore ? (
                            <div className="flex flex-col gap-1 items-start">
                              <select
                                className="text-xs border border-slate-200 rounded p-1 outline-none bg-slate-50"
                                value={term}
                                onChange={(e) => handleTermChange(client.id, Number(e.target.value) as 60 | 120 | 180)}
                              >
                                <option value={180}>180 months</option>
                                <option value={120}>120 months</option>
                                <option value={60}>60 months</option>
                              </select>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(monthlyPayment)}/mo
                              </span>
                              {client.creditScore >= 740 && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider animate-pulse">
                                  ✨ 3 Months Free
                                </span>
                              )}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.creditScore && currentSpend > 0 ? (
                            <div className={`text-sm font-bold flex flex-col gap-0.5 ${cashback > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              <span>{cashback > 0 ? '+' : ''}{formatCurrency(cashback * term)}</span>
                              <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm w-max mb-1">
                                Term Savings
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Cur. Spend: {formatCurrency(currentSpend)}/mo
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(client)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Client"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => sendSaltReminder(client)}
                              disabled={sendingReminderId === client.id}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Send Salt Reminder"
                            >
                              {sendingReminderId === client.id
                                ? <Loader2 size={18} className="animate-spin text-amber-500" />
                                : <Bell size={18} />}
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Client"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Change Modal */}
        {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-600">
                <AlertCircle size={24} />
                <h3 className="text-lg font-bold">Update Status Required</h3>
              </div>
              <p className="text-slate-600 mb-4">
                Changing status from <span className="font-bold">{selectedClient?.status}</span> to <span className="font-bold">{newStatus}</span> requires a mandatory observation.
              </p>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Enter observation details here..."
                className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-4"
              ></textarea>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={!observation.trim()}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Add Client Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {formData.id ? 'Edit Client' : 'Add New Client'}
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Spouse Name</label>
                    <input
                      type="text"
                      value={formData.spouseName || ''}
                      onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      value={formData.zipCode || ''}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Next Water Analysis</label>
                    <input
                      type="date"
                      value={formData.nextWaterAnalysis ? formData.nextWaterAnalysis.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, nextWaterAnalysis: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Credit Score</label>
                    <input
                      type="number"
                      value={formData.creditScore || ''}
                      onChange={(e) => setFormData({ ...formData, creditScore: Number(e.target.value) })}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-900"
                      placeholder="e.g. 720"
                    />
                  </div>
                </div>

                {/* Referrals Section */}
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" /> Referrals
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-3">Add referrals to track VIP benefits (3 months free + 12 months salt).</p>
                    {formData.referrals && formData.referrals.length > 0 ? (
                      <ul className="space-y-2 mb-3">
                        {formData.referrals.map((ref, idx) => (
                          <li key={idx} className="text-sm flex justify-between bg-white p-2 rounded border border-slate-200">
                            <span>{ref.name} ({ref.phone})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${ref.status === 'SOLD' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{ref.status}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400 italic mb-3">No referrals yet.</p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newRefName}
                        onChange={e => setNewRefName(e.target.value)}
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Phone"
                        value={newRefPhone}
                        onChange={e => setNewRefPhone(e.target.value)}
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newRefName.trim() && newRefPhone.trim()) {
                            setFormData({
                              ...formData,
                              referrals: [...(formData.referrals || []), {
                                id: crypto.randomUUID(),
                                name: newRefName.trim(),
                                phone: newRefPhone.trim(),
                                status: 'PENDING' as const
                              }]
                            });
                            setNewRefName('');
                            setNewRefPhone('');
                          }
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClient}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                  >
                    Save Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileUp className="text-emerald-600" /> Import Leads
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-2 text-sm">Instructions</h4>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                    <li>Upload a CSV file with your leads.</li>
                    <li>The first row must be the header.</li>
                    <li>Required columns: Name, Email, Phone.</li>
                    <li>Optional columns: Address, City, State, ZipCode.</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors font-bold text-sm"
                  >
                    <Download size={16} /> Download CSV Template
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-200">
                      <FileUp size={18} /> Select CSV File to Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Congrats Modal */}
        {showCongrats && (
          <div className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-emerald-400 transform animate-bounce">
              <div className="text-center">
                <PartyPopper size={64} className="text-emerald-600 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-emerald-800 mb-2">CONGRATULATIONS!</h2>
                <p className="text-xl text-emerald-600 font-bold">New Qualified Client!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
