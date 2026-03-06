import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/LoadingScreen';

// Eager loaded components (fastest possible First Contentful Paint)
import { IntroPage } from './components/IntroPage';
import { Login } from './components/Auth/Login';

// Lazy loaded components (Code Splitting)
const UpdatePassword = React.lazy(() => import('./components/Auth/UpdatePassword').then(m => ({ default: m.UpdatePassword })));
const ManagerDashboard = React.lazy(() => import('./components/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const AnalystDashboard = React.lazy(() => import('./components/AnalystDashboard').then(m => ({ default: m.AnalystDashboard })));
const WelcomeScreen = React.lazy(() => import('./components/WelcomeScreen').then(m => ({ default: m.WelcomeScreen })));
const ProposalView = React.lazy(() => import('./components/ProposalView').then(m => ({ default: m.ProposalView })));

export function AppRoutes() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
    }

    // Auto-detect manager role based on the hardcoded logic previously in App.tsx
    const isManagerMode = user?.email === 'binnovationmarketing@gmail.com';

    return (
        <Suspense fallback={<LoadingScreen />}>
            <Routes>
                <Route path="/" element={<IntroPage onEnter={() => navigate('/login')} />} />
                <Route path="/intro" element={<Navigate to="/" />} />
                <Route
                    path="/login"
                    element={!user ? <Login /> : <Navigate to={isManagerMode ? "/dashboard/manager" : "/dashboard/analyst"} />}
                />
                <Route path="/recovery" element={<UpdatePassword />} />

                {/* Protected Routes */}
                <Route
                    path="/dashboard/manager"
                    element={isManagerMode ? <ManagerDashboard onExit={() => navigate('/dashboard/analyst')} /> : <Navigate to="/dashboard/analyst" />}
                />

                <Route
                    path="/dashboard/analyst"
                    element={user && !isManagerMode ? <AnalystDashboard onNewProposal={() => navigate('/lead/new')} /> : (!user ? <Navigate to="/login" /> : <Navigate to="/dashboard/manager" />)}
                />

                <Route
                    path="/lead/new"
                    element={user ? <WelcomeScreen onBack={() => navigate('/dashboard/analyst')} onComplete={(n, s, l, e, z, p) => {
                        const data = {
                            id: crypto.randomUUID(),
                            name: n,
                            spouseName: s,
                            lang: l,
                            email: e,
                            phone: p,
                            zipCode: z,
                            status: 'LEAD',
                            observations: [],
                            referrals: [],
                            analyst: user?.email || 'System',
                            createdAt: new Date().toISOString()
                        };
                        localStorage.setItem('proposalClientData', JSON.stringify(data));
                        navigate('/proposal');
                    }} /> : <Navigate to="/login" />}
                />

                {/* The Proposal view depends on URL params - should be accessible without strict auth if we share links */}
                <Route path="/proposal" element={<ProposalView />} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
    );
}
