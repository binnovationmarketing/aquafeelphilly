import { BrowserRouter, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

// Wrapper to handle global auth routing logic before AppRoutes handles display
function AuthListenerHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Only listen for password-recovery deep-link events.
    // Session restoration is handled by AuthContext via onAuthStateChange(INITIAL_SESSION).
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/recovery');
    });
    return () => { authListener.subscription.unsubscribe(); };
  }, [navigate]);

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AuthListenerHandler>
            <AppRoutes />
          </AuthListenerHandler>
        </BrowserRouter>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontFamily: 'inherit' },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
