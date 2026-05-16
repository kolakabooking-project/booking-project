import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div className={`flex flex-col w-full max-h-[92vh] sm:max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border shadow-[var(--shadow-card-hover)] ${sizeClasses[size]} sm:m-4 animate-scale-in`} style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex-shrink-0 flex items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-base sm:text-lg font-heading font-bold text-[color:var(--color-heading)] pr-2 line-clamp-1">{title}</h3>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-xl p-2 text-[color:var(--color-text-soft)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
