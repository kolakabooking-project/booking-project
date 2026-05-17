/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true); // true until session check completes
  const [splashFading, setSplashFading] = useState(false); // controls fade-out transition
  const [splashDone, setSplashDone] = useState(false); // hides splash from DOM entirely
  const minSplashElapsed = useRef(false);

  // Check existing session on mount
  useEffect(() => {
    let cancelled = false;

    // Ensure splash shows for at least 1.5s for a polished feel
    const minTimer = setTimeout(() => {
      minSplashElapsed.current = true;
    }, 1500);

    async function checkSession() {
      try {
        const session = await authApi.getSession();
        if (!cancelled && session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.name,
            nip: session.user.nip,
            role: session.user.role,
            jabatan: session.user.jabatan,
            email: session.user.email,
            image: session.user.image,
          };
          setUser(userData);
          
          const savedRole = localStorage.getItem('booking_active_role');
          if (savedRole && (savedRole === 'admin' || savedRole === 'user')) {
            setActiveRole(savedRole);
          } else {
            setActiveRole(userData.role);
            localStorage.setItem('booking_active_role', userData.role);
          }
        }
      } catch {
        // No valid session — user stays null
      } finally {
        if (!cancelled) {
          // Wait for minimum splash duration, then hold 1s after session resolves
          const proceed = () => {
            // Hold for 1 extra second so user sees the branded splash
            setTimeout(() => {
              setLoading(false);
              setSplashFading(true);
              // After fade-out animation completes, remove splash from DOM
              setTimeout(() => setSplashDone(true), 600);
            }, 1000);
          };

          if (minSplashElapsed.current) {
            proceed();
          } else {
            // Wait until minimum splash time has passed
            const elapsed = performance.now();
            const remaining = 1500 - elapsed;
            setTimeout(proceed, Math.max(0, remaining));
          }
        }
      }
    }
    checkSession();
    return () => { cancelled = true; clearTimeout(minTimer); };
  }, []);

  // Remove native HTML splash once React splash takes over
  useEffect(() => {
    const nativeSplash = document.getElementById('native-splash');
    if (nativeSplash) {
      // Fade out native splash immediately since React splash is now rendering
      nativeSplash.style.opacity = '0';
      nativeSplash.style.visibility = 'hidden';
      setTimeout(() => nativeSplash.remove(), 500);
    }
  }, []);

  const login = useCallback(async (nip, password) => {
    try {
      const result = await authApi.signIn(nip, password);
      if (result?.user) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          nip: result.user.nip,
          role: result.user.role,
          jabatan: result.user.jabatan,
          email: result.user.email,
          image: result.user.image,
        };
        setUser(userData);
        setActiveRole(userData.role);
        localStorage.setItem('booking_active_role', userData.role);
        
        return { success: true, role: userData.role };
      }
      return { success: false, message: 'Login gagal. Periksa NIP dan password.' };
    } catch (err) {
      return { success: false, message: err.message || 'NIP atau password salah.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // Ignore sign-out errors
    }
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem('booking_active_role');
  }, []);

  const switchRole = useCallback((newRole) => {
    if (user && user.role === 'admin' && (newRole === 'admin' || newRole === 'user')) {
      setActiveRole(newRole);
      localStorage.setItem('booking_active_role', newRole);
    }
  }, [user]);

  // Branded splash screen while checking session
  if (!splashDone && (loading || splashFading)) {
    return (
      <div
        className="splash-screen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #152047 0%, #1a2a5e 40%, #1e3472 100%)',
          opacity: splashFading ? 0 : 1,
          transition: 'opacity 0.5s ease',
        }}
      >
        <img
          src="/iconweb.png"
          alt="BOOKOLAKA"
          width={120}
          height={120}
          style={{
            animation: 'splash-pulse 2s ease-in-out infinite',
            filter: 'drop-shadow(0 8px 32px rgba(255, 201, 27, 0.25))',
          }}
        />
        <div
          style={{
            marginTop: 28,
            width: 36,
            height: 36,
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: '#FFC91B',
            borderRadius: '50%',
            animation: 'splash-spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, activeRole, switchRole, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
