import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useNotifications from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.url) {
      navigate(notification.url);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 rounded-full border text-[color:var(--color-text-muted)] hover:border-emerald-500/20 hover:text-emerald-500 transition-colors"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-[color:var(--color-bg-shell)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[3rem] sm:top-[3.75rem] z-50 w-[320px] sm:w-[380px] rounded-3xl border shadow-2xl overflow-hidden"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-elevated)' }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <h3 className="font-heading font-bold text-[color:var(--color-heading)] text-sm">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Check size={14} /> Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-[350px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[color:var(--color-surface-muted)] flex items-center justify-center mb-3">
                    <Bell size={20} className="text-[color:var(--color-text-soft)]" />
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--color-text-muted)]">Belum ada notifikasi</p>
                  <p className="text-xs text-[color:var(--color-text-soft)] mt-1">Anda akan menerima notifikasi di sini.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left p-4 hover:bg-[color:var(--color-surface)] transition-colors flex items-start gap-3 ${!notif.isRead ? 'bg-emerald-500/5' : ''}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notif.isRead ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-soft)]'}`}>
                        <Info size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!notif.isRead ? 'font-bold text-[color:var(--color-heading)]' : 'font-semibold text-[color:var(--color-text-muted)]'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-[color:var(--color-text-soft)] mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-[color:var(--color-text-soft)] mt-2 font-medium">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: idLocale })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-2 border-t text-center" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)' }}>
              <span className="text-[10px] font-bold text-[color:var(--color-text-soft)] uppercase tracking-wider">BOOKOLAKA SYSTEM</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
