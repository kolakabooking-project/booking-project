import { createContext, useContext, useState } from 'react';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Sedang memproses...');

  const showLoading = (msg) => {
    if (msg) setMessage(msg);
    else setMessage('Sedang memproses...');
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, loading }}>
      {children}
      {loading && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-md transition-all duration-300 pointer-events-auto select-none"
        >
          <div 
            className="w-full max-w-sm rounded-[2rem] border p-8 shadow-[var(--shadow-card-hover)] animate-scale-in text-center flex flex-col items-center gap-5"
            style={{ 
              borderColor: 'var(--color-border)', 
              background: 'var(--color-surface-elevated)',
              boxShadow: 'var(--shadow-card)' 
            }}
          >
            {/* Spinning Gradient Ring / Spinner */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              {/* Outer Ring */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-dashed"
                style={{ borderColor: 'rgba(33, 44, 95, 0.15)' }}
              ></div>
              {/* Spinning Segment */}
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-djp-blue animate-spin"
              ></div>
            </div>
            <div>
              <h3 className="text-lg font-heading font-extrabold text-[color:var(--color-heading)] mb-1">
                Memproses Permintaan
              </h3>
              <p className="text-sm text-[color:var(--color-text-soft)]">
                {message}
              </p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
