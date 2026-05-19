import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { superadminApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { getActionMeta } from '../../utils/actionConfig';
import {
  ArrowRight, Search, Power, LayoutDashboard, Shield,
  Users, UserCog, ChevronRight, Zap, Circle,
  ServerCog, Activity, Clock, ExternalLink,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ═══════════════════════════════════════════════════════════════
   SVG Donut Chart — pure CSS + SVG, no dependencies
   ═══════════════════════════════════════════════════════════════ */
function DonutChart({ segments, size = 160, strokeWidth = 18 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let accumulated = 0;

  const arcs = segments.map((seg, i) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dashLen = pct * circumference;
    const dashGap = circumference - dashLen;
    const offset = -accumulated * circumference + circumference * 0.25; // start from top
    accumulated += pct;
    return { ...seg, pct, dashLen, dashGap, offset, index: i };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background track */}
        <circle cx={center} cy={center} r={radius} fill="none"
          stroke="var(--color-border)" strokeWidth={strokeWidth - 6} opacity={0.5} />
        {/* Segments */}
        {arcs.map((arc) => (
          <circle key={arc.label} cx={center} cy={center} r={radius} fill="none"
            stroke={arc.color}
            strokeWidth={hoveredIdx === arc.index ? strokeWidth + 4 : strokeWidth}
            strokeDasharray={`${arc.dashLen} ${arc.dashGap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="round"
            className="transition-all duration-300 cursor-pointer"
            style={{
              filter: hoveredIdx === arc.index ? `drop-shadow(0 0 8px ${arc.color}80)` : 'none',
              opacity: hoveredIdx !== null && hoveredIdx !== arc.index ? 0.35 : 1,
            }}
            onMouseEnter={() => setHoveredIdx(arc.index)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {hoveredIdx !== null ? (
          <>
            <span className="text-2xl font-heading font-extrabold text-[color:var(--color-heading)] tabular-nums">
              {arcs[hoveredIdx].value}
            </span>
            <span className="text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider">
              {arcs[hoveredIdx].label}
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl font-heading font-extrabold text-[color:var(--color-heading)] tabular-nums">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-[color:var(--color-text-soft)] uppercase tracking-wider">
              Total Akun
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Dashboard
   ═══════════════════════════════════════════════════════════════ */
export default function SuperadminDashboard() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Account search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, logsRes, statusRes, usersRes] = await Promise.all([
        superadminApi.getStats(),
        superadminApi.getLogs({ limit: 6 }),
        superadminApi.getServiceStatus(),
        superadminApi.getUsers(),
      ]);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data?.logs || []);
      setServiceStatus(statusRes.data);
      setAllUsers(usersRes.data || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close search on click outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtered users for search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return allUsers.slice(0, 5);
    const q = searchQuery.toLowerCase();
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.nip.toLowerCase().includes(q) ||
      (u.jabatan || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, allUsers]);

  // Donut chart segments
  const donutSegments = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'User', value: stats.totalRegularUsers, color: '#3b82f6' },
      { label: 'Admin', value: stats.totalAdmins, color: '#f59e0b' },
      { label: 'Superadmin', value: stats.totalUsers - stats.totalRegularUsers - stats.totalAdmins, color: '#ef4444' },
    ].filter(s => s.value > 0);
  }, [stats]);

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  const handleSwitchToAdmin = () => {
    switchRole('admin');
    navigate('/admin/dashboard');
  };

  const ROLE_BADGE = {
    user: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    admin: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    superadmin: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* ─── Hero Section ─── */}
      <div className="rounded-3xl border p-6 sm:p-8"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          {/* Left: Greeting + Status */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <p className="text-sm font-semibold text-[color:var(--color-text-soft)]">{greeting},</p>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[color:var(--color-heading)] mt-1">
              {user?.name || 'Super Admin'}
            </h1>
            <p className="mt-3 text-sm text-[color:var(--color-text-muted)] leading-relaxed max-w-md mx-auto lg:mx-0">
              Sistem {serviceStatus?.active ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">berjalan optimal</span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-semibold">dalam maintenance</span>
              )}. Terdapat <span className="font-bold text-[color:var(--color-heading)]">{stats?.totalUsers || 0}</span> entitas aktif dalam jaringan.
            </p>

            {/* Service status pill */}
            <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-full border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <div className={`w-2.5 h-2.5 rounded-full ${serviceStatus?.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-bold ${serviceStatus?.active
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {serviceStatus?.active ? 'All Systems Operational' : 'Maintenance Mode'}
              </span>
            </div>


          </div>

          {/* Right: Donut Chart */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <DonutChart segments={donutSegments} size={160} strokeWidth={20} />
            {/* Legend */}
            <div className="flex items-center gap-4">
              {donutSegments.map(seg => (
                <div key={seg.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
                  <span className="text-[11px] font-semibold text-[color:var(--color-text-soft)]">
                    {seg.label} <span className="font-bold text-[color:var(--color-heading)]">{seg.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bento Grid ─── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Quick Actions (3 cols) ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Account Omnibox */}
          <div className="rounded-3xl border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <h3 className="font-heading font-bold text-sm text-[color:var(--color-heading)]">Kelola Akun</h3>
              </div>
              <Link to="/superadmin/accounts"
                className="text-[11px] font-semibold text-djp-blue hover:underline flex items-center gap-1">
                Lihat Semua <ArrowRight size={11} />
              </Link>
            </div>

            {/* Search bar */}
            <div ref={searchRef} className="relative">
              <div className={`relative rounded-2xl border transition-all duration-200 ${searchFocused
                ? 'border-blue-500/50 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                : ''
                }`} style={!searchFocused ? { borderColor: 'var(--color-border)' } : undefined}>
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-soft)]" />
                <input
                  type="text"
                  placeholder="Cari akun berdasarkan nama, NIP, atau jabatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-[color:var(--color-heading)]
                    placeholder:text-[color:var(--color-text-soft)] outline-none rounded-2xl"
                  style={{ background: 'var(--color-surface-muted)' }}
                />
              </div>

              {/* Dropdown results */}
              {searchFocused && (
                <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border shadow-xl z-30 overflow-hidden"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-[color:var(--color-text-soft)]">
                      Tidak ditemukan akun yang cocok
                    </div>
                  ) : (
                    <>
                      {filteredUsers.map((u) => (
                        <Link
                          key={u.id}
                          to="/superadmin/accounts"
                          state={{ searchQuery: u.nip }}
                          onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-4 py-3 transition-colors
                            hover:bg-black/[0.03] dark:hover:bg-white/[0.03] border-b last:border-0"
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300
                            dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {u.name?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[color:var(--color-heading)] truncate">{u.name}</p>
                            <p className="text-[11px] text-[color:var(--color-text-soft)] truncate">
                              NIP: {u.nip} {u.jabatan ? `· ${u.jabatan}` : ''}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-500'}`}>
                            {u.role}
                          </span>
                        </Link>
                      ))}
                      {allUsers.length > filteredUsers.length && (
                        <Link
                          to="/superadmin/accounts"
                          onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                          className="block px-4 py-3 text-center text-xs font-semibold text-djp-blue hover:underline"
                          style={{ background: 'var(--color-surface-muted)' }}
                        >
                          Lihat semua {allUsers.length} akun →
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Recent accounts mini-grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allUsers.slice(0, 6).map((u) => (
                <div key={u.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors
                    hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300
                    dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      {u.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[color:var(--color-heading)] truncate">{u.name}</p>
                    <p className="text-[9px] text-[color:var(--color-text-soft)] truncate">{u.nip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Control Widget */}
          <div className="rounded-3xl border p-5 sm:p-6"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ServerCog size={16} className="text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-[color:var(--color-heading)]">Status Layanan</h3>
              </div>
              <Link to="/superadmin/service"
                className="text-[11px] font-semibold text-djp-blue hover:underline flex items-center gap-1">
                Kelola <ArrowRight size={11} />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Power indicator */}
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${serviceStatus?.active
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-red-500/10 border border-red-500/20'
                }`}>
                <Power size={28} className={serviceStatus?.active ? 'text-emerald-500' : 'text-red-500'} />
                {serviceStatus?.active && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--color-surface-elevated)] animate-pulse" />
                )}
              </div>

              <div className="flex-1">
                <p className={`text-lg font-heading font-extrabold ${serviceStatus?.active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}>
                  {serviceStatus?.active ? 'Layanan Aktif' : 'Maintenance Mode'}
                </p>
                <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5">
                  {serviceStatus?.active
                    ? 'Semua pengguna dapat mengakses sistem dengan normal.'
                    : 'Akses ditangguhkan untuk semua user non-superadmin.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: PulseStream (2 cols) ── */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border h-full flex flex-col"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Activity size={16} className="text-purple-500" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                </div>
                <h3 className="font-heading font-bold text-sm text-[color:var(--color-heading)]">Log Aktivitas</h3>
              </div>
              <Link to="/superadmin/logs"
                className="text-[11px] font-semibold text-djp-blue hover:underline flex items-center gap-1">
                Semua Log <ArrowRight size={11} />
              </Link>
            </div>

            {/* Feed */}
            <div className="flex-1 relative overflow-hidden">
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {recentLogs.length === 0 ? (
                  <div className="px-5 py-10 text-center text-xs text-[color:var(--color-text-soft)]">
                    Belum ada aktivitas tercatat
                  </div>
                ) : (
                  recentLogs.slice(0, 6).map((log) => {
                    const meta = getActionMeta(log.action);
                    const IconComponent = meta.icon;
                    const timeAgo = getTimeAgo(log.createdAt);
                    return (
                      <div key={log.id}
                        className="flex items-start gap-3 px-5 sm:px-6 py-3.5
                          transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bgClass}`}>
                          <IconComponent size={13} strokeWidth={2.2} className={meta.iconClass} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[color:var(--color-heading)] leading-snug">
                            <span className="font-semibold">{log.userName}</span>
                            <span className="text-[color:var(--color-text-muted)]"> · {meta.label}</span>
                          </p>
                          {log.detail && (
                            <p className="text-[11px] text-[color:var(--color-text-soft)] mt-0.5 line-clamp-1">
                              {log.detail}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-[color:var(--color-text-soft)] flex-shrink-0 tabular-nums mt-0.5">
                          {timeAgo}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Fade-out overlay at bottom */}
              {recentLogs.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{
                    background: `linear-gradient(to top, var(--color-surface-elevated) 0%, transparent 100%)`,
                  }}
                />
              )}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Utility: Time ago helper
   ═══════════════════════════════════════════════════════════════ */
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHour < 24) return `${diffHour}j lalu`;
  if (diffDay < 7) return `${diffDay}h lalu`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}
