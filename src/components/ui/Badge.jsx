import { STATUS_COLORS } from '../../utils/constants';

export default function Badge({ status, className = '' }) {
  const colors = STATUS_COLORS[status] || { bg: 'bg-slate-500/10', text: 'text-slate-500 dark:text-slate-300', dot: 'bg-slate-400' };
  const isPending = status === 'Pending';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-heading
        ${colors.bg} ${colors.text} ${className}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${isPending ? 'animate-pulse-slow' : ''}`}
      />
      {status}
    </span>
  );
}
