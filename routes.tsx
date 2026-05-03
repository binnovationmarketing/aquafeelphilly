import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';

// Eager loaded
import { IntroPage } from './components/IntroPage';
import { Login } from './components/Auth/Login';

// Lazy loaded (code splitting)
const UpdatePassword  = React.lazy(() => import('./components/Auth/UpdatePassword').then(m => ({ default: m.UpdatePassword })));
const ManagerDashboard = React.lazy(() => import('./components/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const AnalystDashboard = React.lazy(() => import('./components/AnalystDashboard').then(m => ({ default: m.AnalystDashboard })));
const WelcomeScreen    = React.lazy(() => import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const ProposalView     = React.lazy(() => import('./components/ProposalView').then(m => ({ default: m.ProposalView })));
const ReferralDashboard = React.lazy(() => import('./components/ReferralDashboard').then(m => ({ default: m.ReferralDashboard })));
const InviteLandingPage = React.lazy(() => import('./components/InviteLandingPage').then(m => ({ default: m.InviteLandingPage })));
const ClientLogin      = React.lazy(() => import('./components/Auth/ClientLogin').then(m => ({ default: m.ClientLogin })));
const ClientSignup     = React.lazy(() => import('./components/Auth/ClientSignup').then(m => ({ default: m.ClientSignup })));
const ClientPortalLayout = React.lazy(() => import('./components/ClientPortal/ClientPortalLayout').then(m => ({ default: m.ClientPortalLayout })));

export function AppRoutes() {
  const { user, profile, loading, isManager } = useAuth();
  const navigate = useNavigate();

  // Never block render longer than 6s (matches AuthContext safety timeout)
  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<IntroPage onEnter={() => navigate('/login')} />} />
        <Route path="/intro"   element={<Navigate to="/" />} />
        <Route path="/recovery" element={<UpdatePassword />} />
        <Route path="/referral" element={<ReferralDashboard />} />
        <Route path="/invite"   element={<InviteLandingPage />} />
        {/* Short invite link: /i/:slug — e.g. /i/rick or /i/ana-2 */}
        <Route path="/i/:slug"  element={<InviteLandingPage />} />

        {/* Client Auth */}
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client-signup" element={<ClientSignup />} />

        {/* Client Portal — accessible only with authenticated session */}
        <Route
          path="/portal/client"
          element={
            !user
              ? <Navigate to="/client-login" />
              : <ClientPortalLayout />
          }
        />

        {/* Auth — analyst/manager login */}
        <Route
          path="/login"
          element={
            !user
              ? <Login />
              : isManager
                ? <Navigate to="/dashboard/manager" />
                : profile
                  ? <Navigate to="/dashboard/analyst" />
                  : <Navigate to="/portal/client" />
          }
        />

        {/* Manager Dashboard — role-based (any manager or above) */}
        <Route
          path="/dashboard/manager"
          element={
            !user
              ? <Navigate to="/login" />
              : isManager
                ? <ManagerDashboard onExit={() => navigate('/dashboard/analyst')} />
                : <Navigate to="/dashboard/analyst" />
          }
        />

        {/* Analyst Dashboard */}
        <Route
          path="/dashboard/analyst"
          element={
            !user
              ? <Navigate to="/login" />
              : isManager
                ? <Navigate to="/dashboard/manager" />
                : <AnalystDashboard onNewProposal={() => navigate('/lead/new')} />
          }
        />

        {/* New Lead — creates client in Supabase, navigates to /proposal?id=UUID */}
        <Route
          path="/lead/new"
          element={
            user
              ? (
                <WelcomeScreen
                  onBack={() => navigate('/dashboard/analyst')}
                  onComplete={async (name, spouse, lang, email, zip, phone, clientId) => {
                    // clientId is the UUID returned from Supabase after saving the client.
                    // Navigate to the secure proposal URL — no PII in the URL.
                    if (clientId) {
                      navigate(`/proposal?id=${clientId}`);
                    } else {
                      // Fallback: store minimal data locally and navigate
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
              : <Navigate to="/login" />
          }
        />

        {/* Proposal — public route, loads by ?id=UUID or legacy params */}
        <Route path="/proposal" element={<ProposalView />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
