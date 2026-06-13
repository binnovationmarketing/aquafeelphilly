import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Gift, Network, LogOut, Menu, X, Droplets, Star, RefreshCw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AquaFeelLogo from '../AquaFeelLogo';
import { ClientDashboardTab } from './ClientDashboardTab';
import { ClientReferralTab } from './ClientReferralTab';
import { ClientNetworkTab } from './ClientNetworkTab';
import { ClientRewardsTab } from './ClientRewardsTab';
import { toast } from 'sonner';

/** Read session directly from sessionStorage (no Web Lock, cleared on tab close). */
function getStoredSession(): { access_token: string; user: any } | null {
  try {
    // After supabase.ts change, sessions live in sessionStorage
    const raw = sessionStorage.getItem('aq_session') ?? localStorage.getItem('aq_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session = parsed?.currentSession ?? parsed;
    if (session?.access_token) return session;
  } catch (_) {}
  return null;
}

/** Create a lock-free Supabase client authenticated with a Bearer token. */
function createPortalClient(accessToken: string) {
  return createClient(
    supabaseUrl ?? 'https://placeholder.supabase.co',
    supabaseAnonKey ?? 'placeholder-key',
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    }
  );
}

/** Remove all Supabase/session storage so a stuck lock can't block reload. */
function clearSupabaseCache() {
  try {
    // Clear sessionStorage (new default after supabase.ts change)
    sessionStorage.clear();
    // Also clear legacy localStorage entries
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k === 'aq_session' || k.startsWith('aq_session') || k.includes('supabase'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (_) {}
}

// Workaround for framer-motion type mismatch
const MotionDiv = motion.div as any;

type Tab = 'dashboard' | 'referral' | 'network' | 'rewards';

export function ClientPortalLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [portalData, setPortalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [claimAttempted, setClaimAttempted] = useState(false);
  const loadingRef = useRef(false); // guard: no concurrent calls

  useEffect(() => {
    initializePortal();
  }, []);

  // After 8 s still loading → show "clear cache" option
  useEffect(() => {
    if (!loading) { setLoadingTooLong(false); return; }
    const t = setTimeout(() => setLoadingTooLong(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  // Real-time-like sync: poll every 30s + refresh when tab regains focus
  useEffect(() => {
    const poll = setInterval(() => {
      if (!loadingRef.current) {
        loadingRef.current = false; // allow re-fetch without showing full spinner
        initializePortal();
      }
    }, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !loadingRef.current) {
        initializePortal();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializePortal = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadingTooLong(false);
    try {
      // ── Read session from sessionStorage — NO Web Lock acquired ──
      const session = getStoredSession();
      if (!session?.access_token) {
        // No session — sign out cleanly and go to login
        supabase.auth.signOut().catch(() => {});
        clearSupabaseCache();
        navigate('/login?tab=client', { replace: true });
        return;
      }

      // ── Lock-free client authenticated via Bearer header ──
      const client = createPortalClient(session.access_token);

      // Try to claim the account (links auth.uid → clients table)
      if (!claimAttempted && session.user?.email) {
        setClaimAttempted(true);
        await client.rpc('claim_client_account', { p_email: session.user.email });
      }

      // Load portal data
      const { data, error } = await client.rpc('get_client_portal_data');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        // Sign out first to break any redirect loop, then go to login
        supabase.auth.signOut().catch(() => {});
        clearSupabaseCache();
        navigate('/login?tab=client', { replace: true });
        return;
      }
      setPortalData(data);
    } catch (err: any) {
      toast.error('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleClearCacheAndReload = () => {
    clearSupabaseCache();
    window.location.reload();
  };

  const handleSignOut = () => {
    // Don't await signOut — it acquires Web Lock and can hang.
    // Clear session from sessionStorage directly, then navigate.
    clearSupabaseCache();
    supabase.auth.signOut().catch(() => {});
    navigate('/login?tab=client', { replace: true });
  };

  const TABS = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: Home },
    { id: 'referral' as Tab, label: 'Indicar', icon: Users },
    { id: 'network' as Tab, label: 'Minha Rede', icon: Network },
    { id: 'rewards' as Tab, label: 'Prêmios', icon: Gift },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6">
            Carregando seu Portal VIP...
          </p>

          <AnimatePresence>
            {loadingTooLong && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-slate-500 text-xs">Está demorando demais? Tente limpar o cache.</p>
                <button
                  onClick={handleClearCacheAndReload}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-xl font-black text-sm transition-colors"
                >
                  <Trash2 size={15} /> Limpar Cache e Recarregar
                </button>
                <button
                  onClick={() => { loadingRef.current = false; initializePortal(); }}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-5 py-3 rounded-xl font-black text-sm transition-colors"
                >
                  <RefreshCw size={15} /> Tentar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (!portalData) return null;

  const { client, points } = portalData;
  const levelLabel = points.level >= 2 ? 'Elite' : 'Embaixador';
  const levelColor = points.level >= 2 ? 'text-yellow-400' : 'text-cyan-400';
  const nextLevelReferrals = points.level >= 2 ? null : Math.max(0, 6 - points.total_referrals);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-700/15 rounded-full blur-[120px]" />
      </div>

      {/* === TOP NAV === */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <AquaFeelLogo width="130px" variant="white" />

          {/* Points + Level badge — desktop */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5">
              <Droplets size={16} className="text-cyan-400" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pontos</p>
                <p className="text-xl font-black text-cyan-400">{points.points.toLocaleString()}</p>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest ${
              points.level >= 2
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <Star size={12} />
              Nível {points.level} · {levelLabel}
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">
                {client.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Olá,</p>
                <p className="text-sm font-bold text-white">{client.name?.split(' ')[0]}</p>
              </div>
            </div>

            <button onClick={handleSignOut} className="p-2 text-slate-600 hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile: points + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1.5">
              <Droplets size={13} className="text-cyan-400" />
              <span className="text-xs font-black text-cyan-400">{points.points.toLocaleString()}</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 mt-4 pt-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                  {client.name?.[0] || 'C'}
                </div>
                <div>
                  <p className="font-bold text-sm">{client.name}</p>
                  <p className={`text-xs font-black uppercase tracking-wider ${levelColor}`}>Nível {points.level} · {levelLabel}</p>
                </div>
              </div>
              <button onClick={handleSignOut} className="w-full flex items-center gap-2 text-sm text-red-400 font-bold py-2">
                <LogOut size={15} /> Sair
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </nav>

      {/* === HERO BANNER === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-8 md:p-10"
          style={{ background: 'linear-gradient(135deg, #005088 0%, #11caa0 100%)' }}
        >
          {/* Decorative drops */}
          <div className="absolute -top-8 -right-8 text-[10rem] opacity-10 rotate-12 pointer-events-none select-none">💧</div>
          <div className="absolute -bottom-8 right-32 text-[6rem] opacity-10 -rotate-12 pointer-events-none select-none">💧</div>

          <div className="relative z-10">
            <p className="text-white/70 text-xs font-black uppercase tracking-widest mb-1">Portal VIP Aquafeel Philly</p>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              Olá, {client.name?.split(' ')[0]}! 👋
            </h1>
            {nextLevelReferrals !== null && nextLevelReferrals > 0 ? (
              <p className="text-white/85 text-sm md:text-base max-w-lg leading-relaxed">
                Você está no <strong>Nível Embaixador</strong>. Indique mais{' '}
                <strong className="text-white underline decoration-2 underline-offset-2">
                  {nextLevelReferrals} {nextLevelReferrals === 1 ? 'família' : 'famílias'}
                </strong>{' '}
                para desbloquear o <strong>Nível Elite</strong> e prêmios exclusivos!
              </p>
            ) : (
              <p className="text-white/85 text-sm md:text-base">
                🏆 Você atingiu o <strong>Nível Elite</strong>! Continue indicando para acumular mais pontos e prêmios exclusivos!
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('referral')}
                className="bg-white text-blue-900 px-6 py-3 rounded-full font-black text-sm shadow-lg hover:bg-slate-100 transition active:scale-95"
              >
                + Nova Indicação
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className="bg-blue-900/60 backdrop-blur-sm text-white px-6 py-3 rounded-full font-black text-sm border border-white/20 hover:bg-blue-900/80 transition active:scale-95"
              >
                Ver Catálogo de Prêmios
              </button>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* === TABS === */}
      <div className="sticky top-[69px] z-40 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-black uppercase tracking-wide whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === TAB CONTENT === */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <MotionDiv key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ClientDashboardTab portalData={portalData} onNavigate={setActiveTab} />
            </MotionDiv>
          )}
          {activeTab === 'referral' && (
            <MotionDiv key="referral" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ClientReferralTab portalData={portalData} onSuccess={initializePortal} />
            </MotionDiv>
          )}
          {activeTab === 'network' && (
            <MotionDiv key="network" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ClientNetworkTab portalData={portalData} />
            </MotionDiv>
          )}
          {activeTab === 'rewards' && (
            <MotionDiv key="rewards" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <ClientRewardsTab portalData={portalData} onSuccess={initializePortal} />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5 py-6 text-center mt-4">
        <p className="text-xs text-slate-700 font-bold uppercase tracking-widest">
          Aquos Tech © {new Date().getFullYear()} · Portal VIP do Cliente
        </p>
      </div>
    </div>
  );
}
