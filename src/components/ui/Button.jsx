import { forwardRef } from 'react';

const variants = {
  primary: 'border border-djp-blue bg-djp-blue text-white shadow-lg shadow-djp-blue/20 hover:-translate-y-0.5 hover:bg-djp-blue-light',
  secondary: 'border bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-muted)] shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-djp-blue/25 hover:text-[color:var(--color-brand)]',
  danger: 'border border-danger bg-danger text-white shadow-lg shadow-danger/15 hover:-translate-y-0.5 hover:bg-red-600',
  success: 'border border-success bg-success text-white shadow-lg shadow-success/15 hover:-translate-y-0.5 hover:bg-emerald-600',
  warning: 'border border-djp-yellow-dark/20 bg-djp-yellow text-djp-blue-dark shadow-lg shadow-djp-yellow/20 hover:-translate-y-0.5 hover:bg-djp-yellow-dark',
  ghost: 'border border-transparent bg-transparent text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-heading)]',
};

const sizes = {
  sm: 'h-8 px-4 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-11 px-6 text-sm',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', children, className = '', disabled, loading, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 whitespace-nowrap font-heading font-semibold
          rounded-full transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-[color:var(--color-focus)] focus:ring-offset-2 focus:ring-offset-[color:var(--color-surface-elevated)]
          disabled:opacity-50 disabled:cursor-not-allowed
          active:translate-y-px
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
