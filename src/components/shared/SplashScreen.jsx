import { useState, useRef, useEffect } from 'react';

/**
 * SplashScreen — Video-based splash (mobile/PWA only).
 *
 * Flow:
 *   Phase 1 (video)   → Video plays centered on white bg (mobile only)
 *   Phase 2 (spinner) → Spinner only (no logo), white bg, seamless
 *   Phase 3 (fadeout) → Smooth fade to app
 *
 * On desktop/web: skips video entirely, shows only spinner briefly.
 */
export default function SplashScreen({ sessionReady, onComplete }) {
  const videoRef = useRef(null);
  const isMobile = useRef(window.innerWidth < 768);
  const [phase, setPhase] = useState(isMobile.current ? 'video' : 'spinner');
  const [videoFailed, setVideoFailed] = useState(false);
  const spinnerStartTime = useRef(null);

  // --- Phase 1: Video (mobile only) ---
  useEffect(() => {
    if (!isMobile.current) return; // skip on desktop
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = 2.0; // Speed up video 2x
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setVideoFailed(true);
        setPhase('spinner');
      });
    }
  }, []);

  const handleVideoEnded = () => setPhase('spinner');
  const handleVideoError = () => { setVideoFailed(true); setPhase('spinner'); };

  // --- Phase 2: Spinner ---
  useEffect(() => {
    if (phase === 'spinner' && !spinnerStartTime.current) {
      spinnerStartTime.current = Date.now();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'spinner' || !sessionReady) return;

    const elapsed = Date.now() - (spinnerStartTime.current || Date.now());
    const minTime = isMobile.current ? 1500 : 800; // shorter on desktop
    const remaining = Math.max(0, minTime - elapsed);

    const timer = setTimeout(() => setPhase('fadeout'), remaining);
    return () => clearTimeout(timer);
  }, [phase, sessionReady]);

  // --- Phase 3: Fadeout ---
  useEffect(() => {
    if (phase !== 'fadeout') return;
    const timer = setTimeout(() => onComplete(), 600);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  const showVideo = phase === 'video' && !videoFailed && isMobile.current;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F0F0F0',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      {/* Phase 1: Video — centered, responsive, white bg (mobile only) */}
      {showVideo && (
        <video
          ref={videoRef}
          src="/videologo.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#F0F0F0',
          }}
        />
      )}

      {/* Phase 2: Spinner only (no logo) — seamless white bg */}
      {(phase === 'spinner' || phase === 'fadeout') && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'splash-fade-in 0.4s ease forwards',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '4px solid rgba(21, 32, 71, 0.12)',
              borderTopColor: '#1a2a5e',
              borderRadius: '50%',
              animation: 'splash-spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
