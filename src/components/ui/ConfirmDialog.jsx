import { useEffect, useRef, useId } from 'react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya', cancelText = 'Batal', variant = 'danger' }) {
  const overlayRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const modalElement = overlayRef.current;
    if (!modalElement) return;

    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (firstElement) {
      setTimeout(() => firstElement.focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const btnColor = variant === 'danger' ? 'border-danger bg-danger hover:bg-red-600' : 'border-success bg-success hover:bg-emerald-600';

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border p-6 shadow-[var(--shadow-card-hover)] animate-scale-in"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <h3 id={titleId} className="mb-2 text-lg font-heading font-bold text-[color:var(--color-heading)]">{title}</h3>
        <p className="mb-6 text-sm leading-6 text-[color:var(--color-text-muted)]">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90"
            style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-full border px-4 py-2 text-sm font-semibold text-white transition-colors ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
