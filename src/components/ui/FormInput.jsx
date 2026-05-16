export default function FormInput({
  label,
  id,
  error,
  hint,
  type = 'text',
  className = '',
  required = false,
  children,
  ...props
}) {
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';

  const baseClasses = `
    form-control font-body
    ${error ? 'border-danger/70 bg-danger-light/10' : ''}
  `;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {isSelect ? (
        <select id={id} className={baseClasses} {...props}>
          {children}
        </select>
      ) : isTextarea ? (
        <textarea id={id} className={`${baseClasses} resize-none`} rows={3} {...props} />
      ) : (
        <input id={id} type={type} className={baseClasses} {...props} />
      )}
      {!error && hint && <p className="text-xs text-[color:var(--color-text-soft)]">{hint}</p>}
      {error && <p className="text-xs text-danger font-body">{error}</p>}
    </div>
  );
}
