import React, { useState } from 'react';
import { 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Send, 
  MessageCircle, 
  X, 
  CheckCircle, 
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClientData, Referral } from '../types';

interface ClientAccessModalProps {
  onClose: () => void;
}

export const ClientAccessModal: React.FC<ClientAccessModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'LOGIN' | 'DASHBOARD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [analystPhone, setAnalystPhone] = useState<string | null>(null);

  // Referral Form State
  const [referral, setReferral] = useState({
    name: '',
    phone: '',
    address: '',
    date: ''
  });
  const [referralSuccess, setReferralSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Find client by email
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (clientError) throw clientError;

      if (!clients || clients.length === 0) {
        throw new Error('Client not found. Please check your email.');
      }

      const foundClient = clients[0] as ClientData;
      setClient(foundClient);

      // 2. Find analyst phone
      if (foundClient.analyst) {
        const { data: analystData } = await supabase
          .from('analysts')
          .select('phone')
          .eq('email', foundClient.analyst)
          .single();
        
        if (analystData) {
          setAnalystPhone(analystData.phone);
        }
      }

      setStep('DASHBOARD');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setLoading(true);

    try {
      const newReferral: Referral = {
        id: crypto.randomUUID(),
        name: referral.name,
        phone: referral.phone,
        status: 'PENDING',
        address: referral.address,
        appointmentDate: referral.date
      };
      
      const updatedReferrals = [...(client.referrals || []), newReferral];

      const { error } = await supabase
        .from('clients')
        .update({ referrals: updatedReferrals })
        .eq('id', client.id);

      if (error) throw error;

      setReferralSuccess(true);
      setReferral({ name: '', phone: '', address: '', date: '' });
      
      // Refresh client data
      setClient({ ...client, referrals: updatedReferrals as any });

      setTimeout(() => setReferralSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    if (analystPhone) {
      const cleanPhone = analystPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      alert('Analyst phone number not available.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X size={20} className="text-slate-400" />
        </button>

        {step === 'LOGIN' ? (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Client Access</h2>
              <p className="text-slate-500 text-sm mt-2">Enter your email to access your client dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900"
                    placeholder="client@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2">
                  <X size={14} /> {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Access Dashboard'}
              </button>
            </form>
          </div>
        ) : (
          <div className="max-h-[80vh] overflow-y-auto">
            <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 z-0"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-1">Welcome, {client?.name.split(' ')[0]}!</h2>
                <p className="text-slate-400 text-sm">Manage your referrals and contact your consultant</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Talk to Consultant Button */}
              <button 
                onClick={openWhatsApp}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                Talk to Consultant
              </button>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Add Referral
                </h3>
                
                {referralSuccess ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle size={24} />
                    <div>
                      <p className="font-bold">Referral Added!</p>
                      <p className="text-xs">Your consultant has been notified.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAddReferral} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          placeholder="Name" 
                          required
                          value={referral.name}
                          onChange={(e) => setReferral({...referral, name: e.target.value})}
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          placeholder="Phone" 
                          required
                          value={referral.phone}
                          onChange={(e) => setReferral({...referral, phone: e.target.value})}
                          className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        placeholder="Address" 
                        value={referral.address}
                        onChange={(e) => setReferral({...referral, address: e.target.value})}
                        className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date"
                        placeholder="Appointment Date" 
                        value={referral.date}
                        onChange={(e) => setReferral({...referral, date: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-600"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Send Referral</>}
                    </button>
                  </form>
                )}
              </div>

              {/* Recent Referrals List */}
              {client?.referrals && client.referrals.length > 0 && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Your Referrals</h4>
                  <div className="space-y-2">
                    {client.referrals.map((ref: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{ref.name}</p>
                          <p className="text-xs text-slate-500">{ref.status}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          ref.status === 'SOLD' ? 'bg-emerald-500' : 
                          ref.status === 'CONTACTED' ? 'bg-blue-500' : 'bg-slate-300'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
