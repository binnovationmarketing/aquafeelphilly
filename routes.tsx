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

        {/* Auth */}
        <Route
          path="/login"
          element={
            !user
              ? <Login />
              : <Navigate to={isManager ? '/dashboard/manager' : '/dashboard/analyst'} />
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
