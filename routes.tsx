import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';

// Eager loaded
import { AuthLanding } from './components/Auth/AuthLanding';
import { Signup } from './components/Auth/Signup';
import { RecruitingPage } from './components/RecruitingPage';

/** Wraps a lazy import with automatic reload on chunk-hash miss after Vercel redeploy. */
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(() =>
    factory().catch(() => {
      // Chunk 404 = stale HTML referencing old hash → force full reload once
      const reloaded = sessionStorage.getItem('chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
      // Return empty component if already retried (avoid infinite reload)
      return { default: (() => null) as unknown as T };
    })
  );
}

// Lazy loaded (code splitting) — wrapped in retry for post-deploy resilience
const UpdatePassword = lazyWithRetry(() => import('./components/Auth/UpdatePassword').then(m => ({ default: m.UpdatePassword })));
const ManagerDashboard = lazyWithRetry(() => import('./components/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const AnalystDashboard = lazyWithRetry(() => import('./components/AnalystDashboard').then(m => ({ default: m.AnalystDashboard })));
const WelcomeScreen = lazyWithRetry(() => import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const ProposalView = lazyWithRetry(() => import('./components/ProposalView').then(m => ({ default: m.ProposalView })));
const ReferralDashboard = lazyWithRetry(() => import('./components/ReferralDashboard').then(m => ({ default: m.ReferralDashboard })));
// ReferralDashboard now served at /vip?token=... (old /referral?token=... links redirect here)
const InviteLandingPage = lazyWithRetry(() => import('./components/InviteLandingPage').then(m => ({ default: m.InviteLandingPage })));
const ClientPortalLayout = lazyWithRetry(() => import('./components/ClientPortal/ClientPortalLayout').then(m => ({ default: m.ClientPortalLayout })));

/** Resolve where a logged-in user should land. */
function AuthRedirect({ isManager, isClient }: { isManager: boolean; isClient: boolean }) {
  if (isClient) return <Navigate to="/portal/client" replace />;
  if (isManager) return <Navigate to="/dashboard/manager" replace />;
  return <Navigate to="/dashboard/analyst" replace />;
}

export function AppRoutes() {
  const { user, profile, loading, isManager } = useAuth();
  const navigate = useNavigate();

  const isClient = !!user && user.user_metadata?.user_type === 'client';

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── Root ── public landing page ($5/day lead capture) */}
        <Route
          path="/"
          element={
            user
              ? <AuthRedirect isManager={isManager} isClient={isClient} />
              : <InviteLandingPage />
          }
        />
        <Route path="/intro" element={<Navigate to="/" replace />} />

        {/* ── Auth entry (unified) ── */}
        <Route
          path="/login"
          element={
            user
              ? <AuthRedirect isManager={isManager} isClient={isClient} />
              : <AuthLanding />
          }
        />

        {/* Backward compat: /client-login → /login?tab=client */}
        <Route path="/client-login" element={<Navigate to="/login?tab=client" replace />} />
        <Route path="/client-signup" element={<Navigate to="/login?tab=client" replace />} />

        {/* Analyst signup — separate full-page form */}
        <Route
          path="/signup"
          element={
            user
              ? <AuthRedirect isManager={isManager} isClient={isClient} />
              : <Signup onBack={(msg) => {
                if (msg) {
                  // Toast shown by AuthLanding; navigate there
                }
                navigate('/login');
              }} />
          }
        />

        {/* ── Password recovery ── */}
        <Route path="/recovery" element={<UpdatePassword />} />

        {/* ── Public routes ── */}
        {/* /referral = job recruitment landing page */}
        <Route path="/referral" element={<RecruitingPage />} />
        {/* /vip = client VIP portal (token-gated, no auth required) */}
        <Route path="/vip" element={<ReferralDashboard />} />
        <Route path="/invite" element={<InviteLandingPage />} />
        <Route path="/i/:slug" element={<InviteLandingPage />} />
        <Route path="/t/:slug" element={<InviteLandingPage />} />
        <Route path="/trabalho" element={<InviteLandingPage />} />
        <Route path="/proposal" element={<ProposalView />} />

        {/* ── Client Portal ── */}
        <Route
          path="/portal/client"
          element={
            !user
              ? <Navigate to="/login?tab=client" replace />
              : <ClientPortalLayout />
          }
        />

        {/* ── Manager Dashboard ── full access (manager_jr and above) */}
        <Route
          path="/dashboard/manager"
          element={
            !user
              ? <Navigate to="/login" replace />
              : isManager
                ? <ManagerDashboard onExit={() => navigate('/dashboard/analyst')} />
                : <Navigate to="/dashboard/analyst" replace />
          }
        />

        {/* ── Analyst Dashboard ── analysts, mentors, students, AND managers (managers can sell too) */}
        <Route
          path="/dashboard/analyst"
          element={
            !user
              ? <Navigate to="/login" replace />
              : isClient
                ? <Navigate to="/portal/client" replace />
                : <AnalystDashboard onNewProposal={() => navigate('/lead/new')} />
          }
        />

        {/* ── New Lead ── */}
        <Route
          path="/lead/new"
          element={
            !user || isClient
              ? <Navigate to="/login" replace />
              : (
                <WelcomeScreen
                  onBack={() => navigate('/dashboard/analyst')}
                  onComplete={async (name, spouse, lang, email, zip, phone, clientId, proposalToken) => {
                    if (proposalToken || clientId) {
                      navigate(`/proposal?id=${proposalToken || clientId}`);
                    } else {
                      const data = {
                        id: crypto.randomUUID(),
                        name, spouseName: spouse, lang, email, phone,
                        zipCode: zip, status: 'LEAD',
                        observations: [], referrals: [],
                        analyst: user?.email || 'System',
                        createdAt: new Date().toISOString(),
                      };
                      localStorage.setItem('proposalClientData', JSON.stringify(data));
                      navigate('/proposal');
                    }
                  }}
                />
              )
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
