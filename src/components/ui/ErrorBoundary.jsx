import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[color:var(--color-bg-main)]">
          <div className="text-center max-w-md w-full bg-[color:var(--color-surface-elevated)] p-8 rounded-3xl border border-[color:var(--color-border)] shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger-light/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <h1 className="text-xl font-heading font-bold mb-2 text-[color:var(--color-heading)]">Terjadi Kesalahan</h1>
            <p className="text-sm text-[color:var(--color-text-soft)] mb-6">
              Maaf, terjadi kesalahan yang tidak terduga pada sistem. Silakan refresh halaman ini atau hubungi administrator jika masalah berlanjut.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-djp-blue text-white font-bold rounded-full hover:bg-[#182553] transition-colors shadow-md"
            >
              Refresh Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
