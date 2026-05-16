export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya', cancelText = 'Batal', variant = 'danger' }) {
  if (!isOpen) return null;

  const btnColor = variant === 'danger' ? 'border-danger bg-danger hover:bg-red-600' : 'border-success bg-success hover:bg-emerald-600';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl border p-6 shadow-[var(--shadow-card-hover)] animate-scale-in"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <h3 className="mb-2 text-lg font-heading font-bold text-[color:var(--color-heading)]">{title}</h3>
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
