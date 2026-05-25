import { Minus, Plus, Users } from 'lucide-react';

export default function CounterInput({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  icon: Icon = Users,
}) {
  const handleDec = () => {
    if (value > min) onChange(value - 1);
  };
  
  const handleInc = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-heading font-semibold text-[color:var(--color-text-muted)]">
          {label}
        </label>
      )}
      <div className="flex items-center justify-between p-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] transition-all focus-within:border-djp-blue focus-within:ring-2 focus-within:ring-djp-blue/20">
        <button 
          type="button" 
          onClick={handleDec}
          disabled={value <= min}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm text-[color:var(--color-text-soft)] hover:text-djp-blue hover:shadow-md disabled:opacity-40 disabled:hover:text-[color:var(--color-text-soft)] disabled:hover:shadow-sm transition-all active:scale-95 border border-[color:var(--color-border)]"
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>
        
        <div className="flex flex-col items-center justify-center flex-1 px-4">
          <span className="text-3xl font-heading font-extrabold text-djp-blue">
            {value}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-text-soft)] font-bold flex items-center gap-1.5 mt-0.5">
            <Icon size={12} /> PAX
          </span>
        </div>

        <button 
          type="button" 
          onClick={handleInc}
          disabled={value >= max}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 shadow-sm text-[color:var(--color-text-soft)] hover:text-djp-blue hover:shadow-md disabled:opacity-40 disabled:hover:text-[color:var(--color-text-soft)] disabled:hover:shadow-sm transition-all active:scale-95 border border-[color:var(--color-border)]"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
