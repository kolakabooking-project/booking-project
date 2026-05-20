import { useState, useEffect } from 'react';
import { Share, PlusSquare, X, ArrowUpFromLine, Download } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if running standalone (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // 2. Detect mobile agent
    const ua = navigator.userAgent;
    const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(isIOSDevice);

    if (!isMobileDevice) return;

    // 3. Check dismiss cooldown from localStorage (7 days)
    const dismissedTime = localStorage.getItem('booking_pwa_dismissed');
    if (dismissedTime) {
      const diff = Date.now() - parseInt(dismissedTime, 10);
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        return; // Don't show if dismissed within 7 days
      }
    }

    // 4. Capture browser prompt for Android/Chrome/Edge
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. iOS Safari doesn't support beforeinstallprompt. Show iOS guide after 3 seconds.
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('booking_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[999] p-4 sm:hidden animate-slide-up">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10"
        onClick={() => setShowPrompt(false)}
      />

      {/* Main Bottom Sheet */}
      <div
        className="mx-auto max-w-md rounded-3xl border p-5 shadow-2xl relative"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-elevated)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[color:var(--color-text-soft)] transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4">
          {/* Logo with pulse glow */}
          <div className="relative h-14 w-14 rounded-2xl flex-shrink-0 bg-white shadow-md border border-slate-100 flex items-center justify-center p-1 overflow-hidden">
            <img src="/logoweb.png" alt="BOOKOLAKA Logo" className="w-full h-full object-contain rounded-xl" />
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse -z-10" />
          </div>

          <div className="flex-1">
            <h3 className="font-heading font-extrabold text-sm text-[color:var(--color-heading)] leading-none">
              Instal Aplikasi BOOKOLAKA
            </h3>
            <p className="text-[11px] font-semibold text-djp-blue mt-1">
              Tambahkan PWA ke Layar Utama
            </p>
            <p className="text-[11px] text-[color:var(--color-text-soft)] mt-1.5 leading-relaxed">
              Dapatkan akses instan, lebih ringan, hemat kuota data, dan bekerja layaknya aplikasi native.
            </p>
          </div>
        </div>

        {/* Dynamic Content: Android vs iOS */}
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          {isIOS ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-[color:var(--color-heading)] leading-relaxed">
                Silakan ikuti langkah-langkah di bawah ini pada browser Safari:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-djp-blue flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <p className="text-[11px] text-[color:var(--color-text-muted)] flex items-center gap-1.5">
                    Ketuk tombol <strong className="text-[color:var(--color-heading)] font-bold inline-flex items-center gap-1 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">Bagikan / Share <ArrowUpFromLine size={12} className="text-djp-blue" /></strong> pada bar bawah Safari.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-djp-blue flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <p className="text-[11px] text-[color:var(--color-text-muted)] flex items-center gap-1.5">
                    Gulir ke bawah lalu ketuk <strong className="text-[color:var(--color-heading)] font-bold inline-flex items-center gap-1 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">Tambahkan ke Layar Utama <PlusSquare size={12} className="text-djp-blue" /></strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-djp-blue flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <p className="text-[11px] text-[color:var(--color-text-muted)]">
                    Ketuk <strong className="text-[color:var(--color-heading)] font-bold bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">Tambah / Add</strong> di sudut kanan atas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Chrome Native Prompt Button */
            <div className="space-y-3">
              <p className="text-[11px] text-[color:var(--color-text-muted)] leading-relaxed">
                Ketuk tombol di bawah untuk langsung memasang aplikasi di perangkat Android Anda.
              </p>

              <button
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-djp-blue to-indigo-600 hover:from-djp-blue-dark hover:to-indigo-700 text-white font-heading font-bold text-xs shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
              >
                <Download size={14} />
                Pasang Sekarang
              </button>
            </div>
          )}

          {/* Dismiss option */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleDismiss}
              className="text-[11px] font-semibold text-[color:var(--color-text-soft)] hover:underline"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
