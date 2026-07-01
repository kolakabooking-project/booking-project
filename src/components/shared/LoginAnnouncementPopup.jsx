import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { announcementApi } from '../../lib/api';
import {
  ChevronLeft, ChevronRight, ShieldAlert,
  AlertTriangle, Info, X
} from 'lucide-react';

export default function LoginAnnouncementPopup() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dontShowIds, setDontShowIds] = useState(new Set());
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const elapsedRef = useRef(0);
  const DURATION = 5000; // 5 seconds per slide

  // Fetch active announcements on mount
  useEffect(() => {
    let mounted = true;
    const fetchActive = async () => {
      try {
        const res = await announcementApi.getActive();
        if (mounted && res.data && res.data.length > 0) {
          setAnnouncements(res.data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to load login announcements:', err);
      }
    };
    fetchActive();
    return () => { mounted = false; };
  }, []);

  // Handle Carousel Timer and Progress Bar
  useEffect(() => {
    if (!isOpen || announcements.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Resume from where we left off
    startTimeRef.current = Date.now() - elapsedRef.current;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      elapsedRef.current = elapsed;

      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= DURATION) {
        // Move to next slide
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        elapsedRef.current = 0;
        startTimeRef.current = Date.now();
        setProgress(0);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, announcements.length, isHovered, currentIndex]);

  // Reset timer on manual navigation
  const goToSlide = useCallback((idx) => {
    setCurrentIndex(idx);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setProgress(0);
  }, []);

  const handlePrev = useCallback(() => {
    const nextIdx = (currentIndex - 1 + announcements.length) % announcements.length;
    goToSlide(nextIdx);
  }, [currentIndex, announcements.length, goToSlide]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % announcements.length;
    goToSlide(nextIdx);
  }, [currentIndex, announcements.length, goToSlide]);

  // Checkbox toggle handler
  const handleCheckboxChange = (id, checked) => {
    setDontShowIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Close and acknowledge checked items
  const handleClose = async () => {
    setIsOpen(false);
    if (dontShowIds.size > 0) {
      const promises = Array.from(dontShowIds).map((id) =>
        announcementApi.acknowledge(id).catch((err) => console.error('Acknowledge failed:', err))
      );
      await Promise.allSettled(promises);
    }
  };

  if (!isOpen || announcements.length === 0) return null;

  const currentAnn = announcements[currentIndex] || announcements[0];
  const isChecked = dontShowIds.has(currentAnn.id);

  // Priority Styling
  const getHeaderStyle = (priority) => {
    switch (priority) {
      case 'urgent':
        return { bg: 'bg-gradient-to-r from-red-600 to-rose-700', icon: ShieldAlert, badge: 'PENTING / URGENT', barBg: 'bg-red-300' };
      case 'warning':
        return { bg: 'bg-gradient-to-r from-amber-500 to-orange-600', icon: AlertTriangle, badge: 'PERHATIAN / WARNING', barBg: 'bg-amber-200' };
      default:
        return { bg: 'bg-gradient-to-r from-djp-blue to-djp-blue-dark', icon: Info, badge: 'INFO SISTEM', barBg: 'bg-blue-300' };
    }
  };

  const styleInfo = getHeaderStyle(currentAnn.priority);
  const HeaderIcon = styleInfo.icon;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-scale-in bg-[color:var(--color-surface)]"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Header with Priority Gradient */}
        <div className={`${styleInfo.bg} text-white p-5 relative overflow-hidden`}>
          {/* Progress Bar (if > 1 slide) */}
          {announcements.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
              <div
                className={`h-full bg-white transition-all duration-75 ease-linear`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white">
                <HeaderIcon size={22} className="animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white uppercase">
                  {styleInfo.badge}
                </span>
                <h3 className="text-lg font-heading font-extrabold text-white mt-1 line-clamp-1">
                  Pengumuman Sistem
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              aria-label="Tutup notifikasi"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-5 max-h-[60vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-xl font-heading font-extrabold text-[color:var(--color-heading)] leading-snug">
              {currentAnn.title}
            </h4>
            {announcements.length > 1 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-djp-blue/10 text-djp-blue flex-shrink-0">
                {currentIndex + 1} / {announcements.length}
              </span>
            )}
          </div>

          {/* Rich text container */}
          <div
            className="text-sm text-[color:var(--color-text)] leading-relaxed rich-text-content max-w-none"
            dangerouslySetInnerHTML={{ __html: currentAnn.content }}
          />

          {/* Carousel Manual Controls (if > 1 slide) */}
          {announcements.length > 1 && (
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5">
                {announcements.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex ? 'w-6 bg-djp-blue' : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 text-[color:var(--color-text-soft)] transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 text-[color:var(--color-text-soft)] transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Checkbox and OK button */}
        <div
          className="px-6 py-4 bg-[color:var(--color-surface-elevated)]/60 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <label className="flex items-center gap-2.5 text-xs text-[color:var(--color-text-soft)] cursor-pointer select-none hover:text-[color:var(--color-text)] transition-colors">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleCheckboxChange(currentAnn.id, e.target.checked)}
              className="w-4 h-4 rounded text-djp-blue focus:ring-djp-blue focus:ring-offset-0 border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <span className="font-medium">Jangan tampilkan lagi pesan ini</span>
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-8 py-2.5 rounded-2xl bg-djp-blue text-white font-heading font-extrabold text-sm shadow-lg shadow-djp-blue/30 hover:bg-djp-blue-dark hover:shadow-xl active:scale-[0.98] transition-all"
          >
            OK, Mengerti
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
