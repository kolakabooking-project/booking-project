import { useId } from 'react';

export default function FormInput({
  label,
  id: providedId,
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
  const generatedId = useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const baseClasses = `
    form-control font-body
    ${error ? 'border-danger/70 bg-danger-light/10' : ''}
  `;

  const ariaProps = {
    'aria-invalid': !!error,
    'aria-required': required,
    'aria-describedby': error ? errorId : (hint ? hintId : undefined),
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
          {label}
          {required && <span aria-hidden="true" className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {isSelect ? (
        <select id={id} className={baseClasses} {...ariaProps} {...props}>
          {children}
        </select>
      ) : isTextarea ? (
        <textarea id={id} className={`${baseClasses} resize-none`} rows={3} {...ariaProps} {...props} />
      ) : (
        <input id={id} type={type} className={baseClasses} {...ariaProps} {...props} />
      )}
      {!error && hint && <p id={hintId} className="text-xs text-[color:var(--color-text-soft)]">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-danger font-body">{error}</p>}
    </div>
  );
}
