import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Gift,
  Network,
  LogOut,
  Menu,
  X,
  Droplets,
  Star,
  RefreshCw,
  Trash2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AquaFeelLogo from '../AquaFeelLogo';
import { ClientDashboardTab } from './ClientDashboardTab';
import { ClientReferralTab } from './ClientReferralTab';
import { ClientNetworkTab } from './ClientNetworkTab';
import { ClientRewardsTab } from './ClientRewardsTab';
import { PortalBackground, PortalKicker, CountUp, MagneticButton } from './portalKit';
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
      if (
        k &&
        (k.startsWith('sb-') ||
          k === 'aq_session' ||
          k.startsWith('aq_session') ||
          k.includes('supabase'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
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
    if (!loading) {
      setLoadingTooLong(false);
      return;
    }
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
      <div className="relative min-h-screen bg-[#020617] flex items-center justify-center p-6 overflow-hidden">
        <PortalBackground />
        <div className="relative z-10 text-center max-w-sm w-full">
          {/* Liquid-fill drop loader */}
          <div className="relative mx-auto mb-6 h-20 w-14 overflow-hidden rounded-b-full rounded-t-lg border-2 border-cyan-300/40">
            <motion.div
              className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-300"
              initial={{ height: '10%' }}
              animate={{ height: ['20%', '90%', '20%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-cyan-200/70 text-xs font-bold uppercase tracking-[0.3em] mb-6">
            Carregando seu Portal VIP
          </p>

          <AnimatePresence>
            {loadingTooLong && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-slate-500 text-xs">
                  Está demorando demais? Tente limpar o cache.
                </p>
                <button
                  onClick={handleClearCacheAndReload}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-3 rounded-xl font-black text-sm transition-colors"
                >
                  <Trash2 size={15} /> Limpar Cache e Recarregar
                </button>
                <button
                  onClick={() => {
                    loadingRef.current = false;
                    initializePortal();
                  }}
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

  const isElite = points.level >= 2;

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 font-sans lg:cursor-none">
      <PortalBackground />

      {/* === TOP NAV === */}
      <nav className="sticky top-0 z-50 bg-[#020617]/70 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <AquaFeelLogo width="120px" variant="white" />

          {/* Points + Level badge — desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2 backdrop-blur">
              <Droplets size={16} className="text-cyan-300" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Pontos
                </p>
                <p className="font-serif text-xl font-black text-cyan-200">
                  <CountUp value={points.points} />
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.15em] ${
                isElite
                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                  : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200'
              }`}
            >
              <Star size={12} />
              Nível {points.level} · {levelLabel}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                {client.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Olá,</p>
                <p className="text-sm font-bold text-white">{client.name?.split(' ')[0]}</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              aria-label="Sair"
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile: points + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5">
              <Droplets size={13} className="text-cyan-300" />
              <span className="text-xs font-black text-cyan-200">
                <CountUp value={points.points} />
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              className="p-2 text-slate-300 hover:text-white"
            >
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
              className="md:hidden border-t border-white/10 mt-3 pt-4 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-white">
                  {client.name?.[0] || 'C'}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{client.name}</p>
                  <p className={`text-xs font-black uppercase tracking-wider ${levelColor}`}>
                    Nível {points.level} · {levelLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 py-2 text-sm font-bold text-red-400"
              >
                <LogOut size={15} /> Sair
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </nav>

      {/* === HERO BANNER === */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 pt-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/10 p-8 md:p-11 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(10,30,63,0.85) 0%, rgba(2,6,23,0.6) 100%)',
            boxShadow: '0 40px 80px -30px rgba(2,6,23,0.9)',
          }}
        >
          {/* caustic glow */}
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(34,211,238,0.28), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <PortalKicker>Portal VIP · Aquafeel Philly</PortalKicker>
            <h1 className="mt-4 font-serif text-3xl md:text-5xl font-black text-white leading-[1.05]">
              Olá, <span className="text-cyan-200">{client.name?.split(' ')[0]}</span>.
            </h1>
            {nextLevelReferrals !== null && nextLevelReferrals > 0 ? (
              <p className="mt-3 max-w-lg text-sm md:text-base leading-relaxed text-slate-300/90">
                Você está no <strong className="text-white">Nível Embaixador</strong>. Indique mais{' '}
                <strong className="text-cyan-300">
                  {nextLevelReferrals} {nextLevelReferrals === 1 ? 'família' : 'famílias'}
                </strong>{' '}
                para desbloquear o <strong className="text-white">Nível Elite</strong> e prêmios
                exclusivos.
              </p>
            ) : (
              <p className="mt-3 max-w-lg text-sm md:text-base text-slate-300/90">
                🏆 Você atingiu o <strong className="text-amber-300">Nível Elite</strong>. Continue
                indicando para acumular mais pontos e prêmios exclusivos.
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <MagneticButton onClick={() => setActiveTab('referral')}>
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-3.5 text-sm font-black text-slate-900 shadow-[0_10px_40px_-8px_rgba(34,211,238,0.7)]">
                  <Plus size={16} /> Nova Indicação
                </span>
              </MagneticButton>
              <MagneticButton onClick={() => setActiveTab('rewards')}>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-cyan-100 backdrop-blur transition-colors hover:bg-white/10">
                  <Gift size={16} /> Catálogo de Prêmios
                </span>
              </MagneticButton>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* === TABS === */}
      <div className="sticky top-[63px] z-40 mt-6 border-b border-white/10 bg-[#020617]/80 px-4 md:px-8 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl">
          <div className="scrollbar-none flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="portalTabPill"
                      className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-cyan-300 to-cyan-200"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      style={{ boxShadow: '0 6px 24px -6px rgba(34,211,238,0.7)' }}
                    />
                  )}
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === TAB CONTENT === */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <MotionDiv
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClientDashboardTab portalData={portalData} onNavigate={setActiveTab} />
            </MotionDiv>
          )}
          {activeTab === 'referral' && (
            <MotionDiv
              key="referral"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClientReferralTab portalData={portalData} onSuccess={initializePortal} />
            </MotionDiv>
          )}
          {activeTab === 'network' && (
            <MotionDiv
              key="network"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClientNetworkTab portalData={portalData} />
            </MotionDiv>
          )}
          {activeTab === 'rewards' && (
            <MotionDiv
              key="rewards"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClientRewardsTab portalData={portalData} onSuccess={initializePortal} />
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-4 border-t border-white/10 py-6 text-center">
        <Sparkles size={12} className="mx-auto mb-2 text-cyan-300/50" />
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-slate-600">
          Aquos Tech © {new Date().getFullYear()} · Portal VIP do Cliente
        </p>
      </div>
    </div>
  );
}
