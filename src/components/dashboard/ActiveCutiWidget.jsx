import { motion, AnimatePresence } from 'framer-motion';
import { useTrackingDashboard } from '../../hooks/useSheetData';
import { UserCheck, CalendarOff, Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import './ActiveCutiWidget.css';

/**
 * Calculate progress percentage of the leave.
 */
function calcLeaveProgress(tanggalMulai, tanggalSelesai) {
  function parseDate(str) {
    if (!str) return null;
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const start = parseDate(tanggalMulai);
  const end = parseDate(tanggalSelesai);
  if (!start || !end) return { pct: 50, daysLeft: '—', totalDays: '—', daysElapsed: '—' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const totalMs = end - start;
  const elapsedMs = today - start;
  const totalDays = Math.max(1, Math.round(totalMs / 86400000) + 1);
  const daysElapsed = Math.max(1, Math.round(elapsedMs / 86400000) + 1);
  const daysLeft = Math.max(0, totalDays - daysElapsed);
  const pct = Math.min(100, Math.max(5, Math.round((daysElapsed / totalDays) * 100)));

  return { pct, daysLeft, totalDays, daysElapsed };
}

/**
 * Format date to shorter display: "24 Agu"
 */
function shortDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function SkeletonCard() {
  return (
    <div className="acw-skeleton-card animate-pulse">
      <div className="acw-skeleton-avatar" />
      <div className="acw-skeleton-lines">
        <div className="acw-skeleton-line acw-skeleton-line--medium" />
        <div className="acw-skeleton-line acw-skeleton-line--short" />
      </div>
    </div>
  );
}

export default function ActiveCutiWidget() {
  const { data: dashboard, isLoading, error } = useTrackingDashboard();
  const activeCutiToday = dashboard?.activeCutiToday || [];
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="acw-root">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="acw-container"
      >
        {/* Header */}
        <div
          className="acw-header cursor-pointer hover:bg-amber-500/5 transition-colors duration-200"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="acw-header-left">
            <div className="acw-beacon-wrap">
              <div className="acw-beacon-icon">
                <CalendarOff size={18} strokeWidth={2.5} />
              </div>
              {!isLoading && !error && activeCutiToday.length > 0 && (
                <div className="acw-beacon-ring" />
              )}
            </div>
            <div className="acw-title-group">
              <h2 className="acw-title flex items-center gap-2">
                Sedang Cuti Hari Ini
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </h2>
              <div className="acw-subtitle">
                {!isLoading && !error && activeCutiToday.length > 0 && (
                  <span className="acw-live-dot" />
                )}
                <span>
                  {isLoading
                    ? 'Memuat data...'
                    : activeCutiToday.length > 0
                    ? 'Pegawai berhalangan hadir'
                    : 'Tidak ada pegawai cuti'}
                </span>
              </div>
            </div>
          </div>

          {!isLoading && !error && activeCutiToday.length > 0 && (
            <div className="acw-counter-badge">
              <span className="acw-counter-number">{activeCutiToday.length}</span>
              <span className="acw-counter-label">
                orang<br />cuti
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {isLoading ? (
                <div className="acw-cards">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : error ? (
                <div className="acw-error">
                  <div className="acw-error-icon">
                    <AlertCircle size={22} />
                  </div>
                  <p className="acw-error-text">Gagal memuat data cuti</p>
                </div>
              ) : activeCutiToday.length === 0 ? (
                <div className="acw-empty">
                  <div className="acw-empty-icon">
                    <UserCheck size={24} />
                  </div>
                  <p className="acw-empty-title">Semua Pegawai Bertugas</p>
                  <p className="acw-empty-desc">
                    Tidak ada pegawai yang sedang cuti kerja hari ini.
                  </p>
                </div>
              ) : (
                <div className="acw-cards">
                  {activeCutiToday.map((cuti, i) => {
                    const { pct, daysLeft, totalDays, daysElapsed } = calcLeaveProgress(
                      cuti.tanggalMulai,
                      cuti.tanggalSelesai
                    );
                    const colorIdx = i % 6;

                    return (
                      <motion.div
                        key={`${cuti.namaPegawai}-${i}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.08 * i,
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="acw-card"
                      >
                        <div className="acw-card-accent" />

                        <div className="acw-card-body">
                          {/* Avatar */}
                          <div className="acw-avatar">
                            <div
                              className={`acw-avatar-circle acw-avatar-circle--${colorIdx}`}
                            >
                              {cuti.namaPegawai.charAt(0)}
                            </div>
                            <div className="acw-avatar-status" />
                          </div>

                          {/* Info */}
                          <div className="acw-info">
                            <p className="acw-name">{cuti.namaPegawai}</p>
                            <div className="acw-meta">
                              <span className="acw-meta-chip acw-meta-chip--status">
                                <CalendarOff size={11} strokeWidth={2.5} />
                                {cuti.lamaCuti || totalDays} Hari Cuti
                              </span>
                              <span className="acw-meta-chip acw-meta-chip--date">
                                <Calendar size={10} strokeWidth={2} />
                                {shortDate(cuti.tanggalMulai)} – {shortDate(cuti.tanggalSelesai)}
                              </span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="acw-progress-wrap">
                            <div className="acw-progress-bar">
                              <div
                                className="acw-progress-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="acw-progress-label">
                              {daysLeft === 0
                                ? 'Hari terakhir'
                                : `Hari ${daysElapsed}/${totalDays}`}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
