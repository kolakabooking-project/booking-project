/**
 * PageLoader — Lightweight fallback spinner for React.lazy() Suspense boundaries.
 * Displayed while a lazy-loaded page chunk is being fetched over the network.
 */
export default function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: '3px solid var(--color-border, #e5e7eb)',
          borderTopColor: 'var(--color-brand, #1a3a8f)',
          borderRadius: '50%',
          animation: 'page-loader-spin 0.7s linear infinite',
        }}
      />
      <style>{`
        @keyframes page-loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
