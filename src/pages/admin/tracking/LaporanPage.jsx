import { useSPDSummary } from '../../../hooks/useSheetData';
import { FileText, Calendar, MapPin, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const STAT_CONFIG = [
  { key: 'totalSpd', label: 'Total SPD', icon: FileText, gradient: 'from-blue-500 to-blue-600', bgIcon: 'bg-blue-500/10 text-blue-500' },
  { key: 'totalHariPerjalanan', label: 'Total Hari Perjalanan', icon: Calendar, gradient: 'from-purple-500 to-purple-600', bgIcon: 'bg-purple-500/10 text-purple-500' },
  { key: 'jumlahWilayah', label: 'Wilayah Tujuan', icon: MapPin, gradient: 'from-emerald-500 to-emerald-600', bgIcon: 'bg-emerald-500/10 text-emerald-500' },
  { key: 'inputSikkaSelesai', label: 'Input SIKKA Selesai', icon: CheckCircle, gradient: 'from-green-500 to-green-600', bgIcon: 'bg-green-500/10 text-green-500' },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border p-6 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-[color:var(--color-surface-muted)]" />
        <div className="h-10 w-10 rounded-xl bg-[color:var(--color-surface-muted)]" />
      </div>
      <div className="h-8 w-16 rounded bg-[color:var(--color-surface-muted)]" />
    </div>
  );
}

export default function LaporanPage() {
  const { data, isLoading } = useSPDSummary();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Laporan SPD</h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">Ringkasan statistik perjalanan dinas</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          STAT_CONFIG.map((stat, i) => {
            const Icon = stat.icon;
            const value = data?.[stat.key] ?? 0;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="relative overflow-hidden rounded-2xl border p-5"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
              >
                {/* Gradient overlay */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.04] rounded-bl-[4rem]`} />
                
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-heading font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider">{stat.label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgIcon}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <motion.p
                  className="text-3xl font-heading font-bold text-[color:var(--color-heading)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                >
                  {value.toLocaleString('id-ID')}
                </motion.p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* SPD Bulan Ini Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-2xl border p-6 relative overflow-hidden"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-[0.04] rounded-bl-[6rem]" />
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-[color:var(--color-text-soft)]">SPD Bulan Ini</p>
            {isLoading ? (
              <div className="h-8 w-12 rounded bg-[color:var(--color-surface-muted)] animate-pulse mt-1" />
            ) : (
              <p className="text-3xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {data?.totalSpdBulanIni?.toLocaleString('id-ID') || '0'}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
