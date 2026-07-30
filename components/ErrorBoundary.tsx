import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans">
          <div className="bg-white/[0.04] backdrop-blur-xl p-8 rounded-3xl max-w-md w-full text-center border border-white/10" style={{ boxShadow: '0 40px 80px -30px rgba(2,6,23,0.9)' }}>
            <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-red-300 text-3xl font-bold">
              !
            </div>
            <h1 className="font-serif text-2xl font-black text-white mb-2">Algo deu errado</h1>
            <p className="text-slate-400 mb-6 text-sm">
              Encontramos um erro inesperado. Tente atualizar a página.
            </p>
            <div className="bg-black/30 border border-white/10 p-4 rounded-xl text-left mb-6 overflow-auto max-h-32">
              <code className="text-xs text-slate-400 font-mono">
                {this.state.error?.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-900 px-6 py-3 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_-8px_rgba(34,211,238,0.7)] transition-all active:scale-[0.98] w-full"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
