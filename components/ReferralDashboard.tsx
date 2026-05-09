import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Droplet, Share2, Award, Clock, CheckCircle, LogOut } from 'lucide-react';
import { supabaseAnon } from '../lib/supabase';
import { ReferralTree } from './ui/ReferralTree';
import { toast } from 'sonner';

const PROD_URL = 'https://aquafeelphilly.com';

export function ReferralDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cadastro' | 'arvore' | 'premios'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const [newRef, setNewRef] = useState({ name: '', phone: '', email: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadPortalData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadPortalData = async () => {
    try {
      const { data: result, error } = await supabaseAnon.rpc('get_client_referral_portal', { p_token: token });
      if (error) throw error;
      if (result && result.error) {
        toast.error(result.error);
        setData(null);
      } else {
        setData(result);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar os dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const solicitarResgate = async (item: string, pontos: number) => {
    if (!token) return;
    if (data?.points?.points < pontos) {
      toast.error('Pontos insuficientes!');
      return;
    }

    if (window.confirm(`Confirmar resgate do ${item} por ${pontos} pontos?`)) {
      try {
        const { data: result, error } = await supabaseAnon.rpc('redeem_prize_from_portal', {
          p_token: token,
          p_prize_name: item,
          p_points_cost: pontos
        });
        if (error) throw error;
        if (result && result.error) {
          toast.error(result.error);
        } else {
          toast.success('Resgate solicitado com sucesso! Nossa equipe entrará em contato.');
          loadPortalData();
        }
      } catch (err: any) {
        toast.error('Erro ao solicitar resgate: ' + err.message);
      }
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newRef.name) return;
    setIsSubmitting(true);
    try {
      const { data: result, error } = await supabaseAnon.rpc('add_referral_from_portal', {
        p_token: token,
        p_name: newRef.name,
        p_phone: newRef.phone,
        p_email: newRef.email,
        p_address: newRef.address
      });
      if (error) throw error;
      if (result && result.error) {
        toast.error(result.error);
      } else {
        toast.success('Indicação cadastrada com sucesso! Você ganhou +300 pontos.');
        setNewRef({ name: '', phone: '', email: '', address: '' });
        setActiveTab('dashboard');
        loadPortalData();
      }
    } catch (err: any) {
      toast.error('Erro ao cadastrar indicação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#11caa0] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!token || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl mb-4">AQ</div>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: "'Urbanist', sans-serif" }}>Acesso Inválido</h1>
        <p className="text-slate-400 text-center max-w-md">Por favor, acesse este portal usando o link exclusivo enviado pelo seu analista da Aquafeel.</p>
      </div>
    );
  }

  const { client, points, referrals, history } = data;
  const isElite = points.level === 2;

  const referralLink = `${PROD_URL}/invite?ref=${token}`;
  const whatsappMessage = encodeURIComponent(`Oi! Estou usando a Aquafeel na minha casa e adorando. Use meu link VIP para agendar uma análise grátis e ganhar descontos: ${referralLink}`);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans pb-12" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Navigation */}
      <nav className="p-6 border-b border-slate-800 bg-slate-800/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold">AQ</div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Urbanist', sans-serif" }}>
              Aquafeel <span className="text-[#11caa0]">Philly</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Saldo Atual</p>
              <p className="text-xl font-bold text-[#11caa0]">{points.points.toLocaleString()} Points</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isElite ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-700 border-[#11caa0] text-white'}`}>
              <User size={20} />
            </div>
            <button
              onClick={() => navigate('/')}
              title="Sair do Portal"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white transition-all text-sm font-bold border border-slate-600 hover:border-red-500"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Hero */}
        <section className={`p-10 rounded-3xl shadow-2xl relative overflow-hidden bg-gradient-to-br ${isElite ? 'from-yellow-600 to-amber-900' : 'from-[#005088] to-[#11caa0]'}`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-bold" style={{ fontFamily: "'Urbanist', sans-serif" }}>Olá, {client.name.split(' ')[0]}!</h2>
              {isElite && <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Elite VIP</span>}
            </div>
            <p className="text-lg opacity-90 max-w-xl">
              Você está no <span className="font-bold underline">Nível {points.level} ({isElite ? 'Elite' : 'Embaixador'})</span>.
              {!isElite && ` Indique mais ${3 - points.converted_referrals} famílias e converta para desbloquear o Nível Elite e prêmios incríveis!`}
            </p>
            <div className="mt-6 flex gap-4">
              <button onClick={() => setActiveTab('cadastro')} className="bg-white text-blue-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-100 transition">
                Nova Indicação
              </button>
              <button onClick={() => setActiveTab('premios')} className="bg-black/20 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-black/30 transition backdrop-blur-sm border border-white/20">
                Ver Catálogo
              </button>
            </div>
          </div>
          <Droplet className="absolute -bottom-10 -right-10 text-white opacity-20 rotate-12" size={240} />
        </section>

        {/* Share Section */}
        <div className="bg-slate-800/40 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">Compartilhe seu Link VIP</h3>
            <p className="text-slate-400 text-sm">Envie para seus amigos e ganhe 300 pontos a cada cadastro.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <a 
              href={`https://wa.me/?text=${whatsappMessage}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <Share2 size={18} /> WhatsApp
            </a>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(referralLink);
                toast.success('Link copiado para a área de transferência!');
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Copiar Link
            </button>
          </div>
        </div>

        {/* Tabs Menu */}
        <div className="flex gap-8 border-b border-slate-800 overflow-x-auto pb-2 hide-scrollbar">
          <button onClick={() => setActiveTab('dashboard')} className={`py-2 px-4 font-semibold transition whitespace-nowrap ${activeTab === 'dashboard' ? 'border-b-2 border-[#11caa0] text-[#11caa0]' : 'text-slate-400 hover:text-white'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('cadastro')} className={`py-2 px-4 font-semibold transition whitespace-nowrap ${activeTab === 'cadastro' ? 'border-b-2 border-[#11caa0] text-[#11caa0]' : 'text-slate-400 hover:text-white'}`}>Cadastrar Família</button>
          <button onClick={() => setActiveTab('arvore')} className={`py-2 px-4 font-semibold transition whitespace-nowrap ${activeTab === 'arvore' ? 'border-b-2 border-[#11caa0] text-[#11caa0]' : 'text-slate-400 hover:text-white'}`}>Minha Rede</button>
          <button onClick={() => setActiveTab('premios')} className={`py-2 px-4 font-semibold transition whitespace-nowrap ${activeTab === 'premios' ? 'border-b-2 border-[#11caa0] text-[#11caa0]' : 'text-slate-400 hover:text-white'}`}>Prêmios</button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">RECOMENDAÇÕES FEITAS</p>
                <h3 className="text-3xl font-bold mt-1">{points.total_referrals} Famílias</h3>
                <div className="mt-4 flex gap-1">
                  <div className="h-2 w-full bg-[#11caa0] rounded-full"></div>
                </div>
              </div>
              <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">VENDAS CONVERTIDAS</p>
                <h3 className="text-3xl font-bold mt-1 text-[#11caa0]">{points.converted_referrals} Vendas</h3>
                <p className="text-xs text-slate-500 mt-2">A cada venda você ganha +900 pts</p>
              </div>
              <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                <p className="text-slate-400 text-sm">COMO GANHAR PONTOS</p>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between items-center"><span>Venda Convertida</span> <span className="text-[#11caa0] font-bold bg-[#11caa0]/10 px-2 py-0.5 rounded">+900</span></div>
                  <div className="flex justify-between items-center"><span>Nova Indicação</span> <span className="text-[#11caa0] font-bold bg-[#11caa0]/10 px-2 py-0.5 rounded">+300</span></div>
                </div>
              </div>
            </div>

            {/* History */}
            <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Histórico de Transações</h3>
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                      <div>
                        <p className="font-bold">{tx.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(tx.created_at).toLocaleDateString()} às {new Date(tx.created_at).toLocaleTimeString()}</p>
                      </div>
                      <div className={`font-bold text-lg ${tx.points > 0 ? 'text-[#11caa0]' : 'text-red-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8 border border-dashed border-slate-700 rounded-xl">Nenhuma transação registrada ainda.</p>
              )}
            </div>
          </div>
        )}

        {/* CADASTRO TAB */}
        {activeTab === 'cadastro' && (
          <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-2xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#11caa0]/20 rounded-full flex items-center justify-center text-[#11caa0]">
                <Share2 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Indicar Nova Família</h3>
                <p className="text-slate-400 text-sm mt-1">Ganhe +300 pontos agora e mais +900 se fecharem negócio!</p>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleCreateReferral}>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Nome da Família ou Pessoa</label>
                <input required type="text" value={newRef.name} onChange={e => setNewRef({...newRef, name: e.target.value})} placeholder="Ex: João e Maria" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3.5 focus:outline-none focus:border-[#11caa0] transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Telefone de Contato</label>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden focus-within:border-[#11caa0] transition-colors">
                  <span className="pl-3.5 pr-1 text-slate-400 font-bold text-sm shrink-0">+1</span>
                  <input
                    type="tel"
                    value={newRef.phone}
                    onChange={e => setNewRef({...newRef, phone: e.target.value.replace(/\D/g,'').slice(0,10)})}
                    placeholder="215-000-0000"
                    className="flex-1 bg-transparent pr-3.5 py-3.5 text-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">E-mail (Opcional)</label>
                <input type="email" value={newRef.email} onChange={e => setNewRef({...newRef, email: e.target.value})} placeholder="email@exemplo.com" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3.5 focus:outline-none focus:border-[#11caa0] transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Endereço Residencial (Opcional)</label>
                <textarea value={newRef.address} onChange={e => setNewRef({...newRef, address: e.target.value})} placeholder="Se souber o endereço completo, coloque aqui..." className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3.5 focus:outline-none focus:border-[#11caa0] h-24 resize-none transition-colors"></textarea>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full bg-[#11caa0] text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:bg-[#0fa986] transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmitting ? 'Enviando...' : 'Cadastrar Indicação (+300 Pts)'}
              </button>
            </form>
          </div>
        )}

        {/* ARVORE TAB */}
        {activeTab === 'arvore' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 p-8 rounded-2xl overflow-hidden">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold">Minha Rede de Recomendações</h3>
                <p className="text-slate-400 mt-2">Acompanhe o status de quem você indicou para a Aquafeel</p>
              </div>
              
              <div className="py-8 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                <ReferralTree clientName={client.name} referrals={referrals} />
              </div>
            </div>
            
            {referrals.length > 0 && (
              <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <h4 className="text-lg font-bold mb-4">Lista Detalhada</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {referrals.map((r: any) => (
                    <div key={r.id} className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{r.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        r.status === 'CONVERTED' ? 'bg-[#11caa0]/20 text-[#11caa0]' :
                        r.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                        r.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {r.status === 'CONVERTED' ? 'Cliente' :
                         r.status === 'LOST' ? 'Perdido' :
                         r.status === 'SCHEDULED' ? 'Agendado' :
                         r.status === 'HOLD' ? 'Espera' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PREMIOS TAB */}
        {activeTab === 'premios' && (
          <div className="animate-in fade-in duration-500">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Catálogo de Prêmios</h3>
              <p className="text-slate-400">Troque seus pontos por experiências e produtos incríveis. Seu saldo: <span className="font-bold text-[#11caa0]">{points.points.toLocaleString()}</span> pts</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Premio 1 */}
              <div className="bg-slate-800/70 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden group hover:border-[#11caa0] transition-colors flex flex-col">
                <div className="h-56 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1544117519-31a4b719223d?auto=format&fit=crop&q=80&w=600" alt="Apple Watch SE" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-xl font-bold">Apple Watch SE</h4>
                  <p className="text-sm text-slate-400 mt-2 mb-4 flex-1">Fique conectado e monitore sua saúde com estilo.</p>
                  <p className="text-[#11caa0] font-black text-xl mb-4">3.500 <span className="text-sm font-normal text-slate-400 uppercase tracking-widest">pts</span></p>
                  <button onClick={() => solicitarResgate('Apple Watch SE', 3500)} disabled={points.points < 3500} className="w-full border border-slate-600 py-3 rounded-xl hover:bg-white hover:text-slate-900 transition font-bold disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-white disabled:cursor-not-allowed">
                    {points.points >= 3500 ? 'Resgatar Agora' : `Faltam ${3500 - points.points} pts`}
                  </button>
                </div>
              </div>

              {/* Premio 2 */}
              <div className="bg-slate-800/70 backdrop-blur-md rounded-3xl overflow-hidden group hover:border-yellow-500 transition-colors border-2 border-yellow-500/20 flex flex-col relative">
                <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-yellow-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Elite VIP</div>
                <div className="h-56 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600" alt="Spa Day" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-xl font-bold">Spa Day Premium</h4>
                  <p className="text-sm text-slate-400 mt-2 mb-4 flex-1">Um dia completo de relaxamento e tratamentos para casal.</p>
                  <p className="text-yellow-500 font-black text-xl mb-4">5.000 <span className="text-sm font-normal text-slate-400 uppercase tracking-widest">pts</span></p>
                  <button onClick={() => solicitarResgate('Spa Day Premium', 5000)} disabled={points.points < 5000 || !isElite} className="w-full bg-yellow-500 text-yellow-950 py-3 rounded-xl hover:bg-yellow-400 transition font-bold shadow-lg disabled:opacity-50 disabled:hover:bg-yellow-500 disabled:cursor-not-allowed">
                    {!isElite ? 'Apenas Nível Elite' : points.points >= 5000 ? 'Resgatar VIP' : `Faltam ${5000 - points.points} pts`}
                  </button>
                </div>
              </div>

              {/* Premio 3 */}
              <div className="bg-slate-800/70 backdrop-blur-md rounded-3xl overflow-hidden group hover:border-yellow-500 transition-colors border-2 border-yellow-500/20 flex flex-col relative">
                <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-yellow-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Elite VIP</div>
                <div className="h-56 bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600" alt="iPad Pro" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h4 className="text-xl font-bold">iPad Pro</h4>
                  <p className="text-sm text-slate-400 mt-2 mb-4 flex-1">O iPad definitivo com chip M2 e tela Liquid Retina.</p>
                  <p className="text-yellow-500 font-black text-xl mb-4">7.500 <span className="text-sm font-normal text-slate-400 uppercase tracking-widest">pts</span></p>
                  <button onClick={() => solicitarResgate('iPad Pro', 7500)} disabled={points.points < 7500 || !isElite} className="w-full bg-yellow-500 text-yellow-950 py-3 rounded-xl hover:bg-yellow-400 transition font-bold shadow-lg disabled:opacity-50 disabled:hover:bg-yellow-500 disabled:cursor-not-allowed">
                    {!isElite ? 'Apenas Nível Elite' : points.points >= 7500 ? 'Resgatar VIP' : `Faltam ${7500 - points.points} pts`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
