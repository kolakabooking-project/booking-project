export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`
        surface-card
        ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
