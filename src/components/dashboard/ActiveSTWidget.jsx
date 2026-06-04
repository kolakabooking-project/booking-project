import { motion } from 'framer-motion';
import { useTrackingDashboard } from '../../hooks/useSheetData';
import { UserCheck, MapPin, Calendar, Radar, AlertCircle } from 'lucide-react';
import './ActiveSTWidget.css';

/**
 * Calculate progress percentage: how far through the trip we are today.
 */
function calcProgress(tanggalBerangkat, tanggalKembali) {
  const MONTHS_ID = {
    januari: 0, februari: 1, maret: 2, april: 3,
    mei: 4, juni: 5, juli: 6, agustus: 7,
    september: 8, oktober: 9, november: 10, desember: 11,
  };

  function parseDate(str) {
    if (!str) return null;
    const parts = str.trim().toLowerCase().split(/\s+/);
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const m = MONTHS_ID[parts[1]];
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && m !== undefined && !isNaN(y)) return new Date(y, m, d);
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const start = parseDate(tanggalBerangkat);
  const end = parseDate(tanggalKembali);
  if (!start || !end) return { pct: 50, daysLeft: '—', totalDays: '—' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const totalMs = end - start;
  const elapsedMs = today - start;
  const totalDays = Math.max(1, Math.round(totalMs / 86400000) + 1);
  const daysElapsed = Math.round(elapsedMs / 86400000) + 1;
  const daysLeft = Math.max(0, totalDays - daysElapsed);
  const pct = Math.min(100, Math.max(5, Math.round((daysElapsed / totalDays) * 100)));

  return { pct, daysLeft, totalDays, daysElapsed };
}

/**
 * Format date to shorter display: "02 Jun" instead of "02 Juni 2026"
 */
function shortDate(dateStr) {
  if (!dateStr) return '—';
  const MONTHS_SHORT = {
    januari: 'Jan', februari: 'Feb', maret: 'Mar', april: 'Apr',
    mei: 'Mei', juni: 'Jun', juli: 'Jul', agustus: 'Agu',
    september: 'Sep', oktober: 'Okt', november: 'Nov', desember: 'Des',
  };
  const parts = dateStr.trim().toLowerCase().split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0];
    const month = MONTHS_SHORT[parts[1]] || parts[1];
    return `${day} ${month}`;
  }
  return dateStr;
}

function SkeletonCard() {
  return (
    <div className="ast-skeleton-card animate-pulse">
      <div className="ast-skeleton-avatar" />
      <div className="ast-skeleton-lines">
        <div className="ast-skeleton-line ast-skeleton-line--medium" />
        <div className="ast-skeleton-line ast-skeleton-line--short" />
      </div>
    </div>
  );
}

export default function ActiveSTWidget() {
  const { data: dashboard, isLoading, error } = useTrackingDashboard();
  const activeSTToday = dashboard?.activeSTToday || [];

  return (
    <div className="ast-root">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="ast-container"
      >
        {/* Header */}
        <div className="ast-header">
          <div className="ast-header-left">
            <div className="ast-beacon-wrap">
              <div className="ast-beacon-icon">
                <Radar size={18} strokeWidth={2.5} />
              </div>
              {!isLoading && !error && activeSTToday.length > 0 && (
                <div className="ast-beacon-ring" />
              )}
            </div>
            <div className="ast-title-group">
              <h2 className="ast-title">Sedang Dinas Hari Ini</h2>
              <div className="ast-subtitle">
                {!isLoading && !error && activeSTToday.length > 0 && (
                  <span className="ast-live-dot" />
                )}
                <span>
                  {isLoading
                    ? 'Memuat data...'
                    : activeSTToday.length > 0
                      ? 'Pemantauan aktif'
                      : 'Tidak ada penugasan'
                  }
                </span>
              </div>
            </div>
          </div>

          {!isLoading && !error && activeSTToday.length > 0 && (
            <div className="ast-counter-badge">
              <span className="ast-counter-number">{activeSTToday.length}</span>
              <span className="ast-counter-label">
                orang<br />dinas
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="ast-cards">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="ast-error">
            <div className="ast-error-icon">
              <AlertCircle size={22} />
            </div>
            <p className="ast-error-text">Gagal memuat data</p>
          </div>
        ) : activeSTToday.length === 0 ? (
          <div className="ast-empty">
            <div className="ast-empty-icon">
              <UserCheck size={24} />
            </div>
            <p className="ast-empty-title">Semua Pegawai di Kantor</p>
            <p className="ast-empty-desc">
              Tidak ada yang sedang perjalanan dinas luar hari ini.
            </p>
          </div>
        ) : (
          <div className="ast-cards">
            {activeSTToday.map((st, i) => {
              const { pct, daysLeft, totalDays, daysElapsed } = calcProgress(st.tanggalBerangkat, st.tanggalKembali);
              const colorIdx = i % 6;

              return (
                <motion.div
                  key={`${st.namaPegawai}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.08 * i,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="ast-card"
                  style={{ animationDelay: `${0.08 * i}s` }}
                >
                  {/* Left accent strip */}
                  <div className="ast-card-accent" />

                  <div className="ast-card-body">
                    {/* Avatar */}
                    <div className="ast-avatar">
                      <div className={`ast-avatar-circle ast-avatar-circle--${colorIdx}`}>
                        {st.namaPegawai.charAt(0)}
                      </div>
                      <div className="ast-avatar-status" />
                    </div>

                    {/* Info */}
                    <div className="ast-info">
                      <p className="ast-name">{st.namaPegawai}</p>
                      <div className="ast-meta">
                        <span className="ast-meta-chip ast-meta-chip--location">
                          <MapPin size={11} strokeWidth={2.5} />
                          {st.wilayahTugas}
                        </span>
                        <span className="ast-meta-chip ast-meta-chip--date">
                          <Calendar size={10} strokeWidth={2} />
                          {shortDate(st.tanggalBerangkat)} – {shortDate(st.tanggalKembali)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="ast-progress-wrap">
                      <div className="ast-progress-bar">
                        <div
                          className="ast-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="ast-progress-label">
                        {daysLeft === 0 ? 'Hari terakhir' : `Hari ${daysElapsed}/${totalDays}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
