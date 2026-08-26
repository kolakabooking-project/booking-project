import { useTrackingDashboard } from '../../../hooks/useSheetData';
import { FileText, Calendar, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FridayWfoWidget from '../../../components/dashboard/FridayWfoWidget';
import MyTrackingJourneyTracker from '../../../components/dashboard/MyTrackingJourneyTracker';
import ActiveSTWidget from '../../../components/dashboard/ActiveSTWidget';
import ActiveCutiWidget from '../../../components/dashboard/ActiveCutiWidget';

function SkeletonItem() {
  return (
    <div className="animate-pulse flex items-center gap-3 py-3">
      <div className="h-10 w-10 rounded-xl bg-[color:var(--color-surface-muted)]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 rounded bg-[color:var(--color-surface-muted)]" />
        <div className="h-2 w-1/2 rounded bg-[color:var(--color-surface-muted)]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useTrackingDashboard();

  const recentSPD = dashboard?.recentSPD || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[color:var(--color-heading)]">Tracking SPD</h1>
        <p className="text-sm text-[color:var(--color-text-soft)] mt-1">Ringkasan perjalanan dinas Anda</p>
      </div>

      {/* Friday WFO Status Widget */}
      <FridayWfoWidget />

      {/* Summary Journey Flow */}
      <MyTrackingJourneyTracker />

      {/* Sedang Dinas Hari Ini */}
      <ActiveSTWidget />

      {/* Sedang Cuti Hari Ini */}
      <ActiveCutiWidget />

      {/* Recent SPD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border p-5"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-[color:var(--color-heading)]">SPD Terbaru</h2>
          <Link to="/user/tracking/spd-saya" className="text-xs font-heading font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:gap-2 transition-all">
            Lihat Semua <ChevronRight size={12} />
          </Link>
        </div>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonItem key={i} />)
        ) : recentSPD.length === 0 ? (
          <p className="text-sm text-[color:var(--color-text-soft)] py-4 text-center">Belum ada data SPD</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)' }}>
            {recentSPD.map((r, i) => (
              <div key={`${r.nomorSpd}-${i}`} className="flex items-start gap-3 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex-shrink-0 font-heading font-bold text-sm">
                  {r.nomorSpd}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-[color:var(--color-heading)] truncate">{r.perihalTugas}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[color:var(--color-text-soft)]">
                    <span className="flex items-center gap-0.5"><MapPin size={9} /> {r.wilayahTugas}</span>
                    <span>•</span>
                    <span>{r.jumlahHariSpdNumeric} hari</span>
                    <span>•</span>
                    <span>{r.tanggalMulai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
