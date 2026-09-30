/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi, serviceApi } from '../lib/api';
import SplashScreen from '../components/shared/SplashScreen';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [serviceStatuses, setServiceStatuses] = useState({ kdoActive: true, roomActive: true, spdActive: true });
  const [sessionChecked, setSessionChecked] = useState(false); // true once API call resolves
  const [splashDone, setSplashDone] = useState(false); // true once splash animation is fully finished
  const sessionCheckedRef = useRef(false); // ref mirror for use inside SplashScreen callbacks

  // Check existing session on mount (runs in parallel with video)
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        // Check service status in parallel with session
        const [session, statusRes] = await Promise.all([
          authApi.getSession(),
          serviceApi.getStatus().catch(() => ({ data: { kdoActive: true, roomActive: true, spdActive: true } })),
        ]);

        if (!cancelled) {
          setServiceStatuses(statusRes?.data || { kdoActive: true, roomActive: true, spdActive: true });
        }

        if (!cancelled && session?.user) {
          const userData = {
            id: session.user.id,
            name: session.user.name,
            nip: session.user.nip,
            nipPanjang: session.user.nipPanjang,
            role: session.user.role,
            jabatan: session.user.jabatan,
            email: session.user.email,
            image: session.user.image,
          };
          setUser(userData);

          const savedRole = localStorage.getItem('booking_active_role');
          if (userData.role === 'superadmin') {
            const validRoles = ['superadmin', 'admin', 'user', 'kepala_kantor', 'sekretaris'];
            const initialRole = savedRole && validRoles.includes(savedRole) ? savedRole : 'superadmin';
            setActiveRole(initialRole);
            localStorage.setItem('booking_active_role', initialRole);
          } else if (userData.role === 'sekretaris') {
            const validRoles = ['sekretaris', 'admin', 'user'];
            const initialRole = savedRole && validRoles.includes(savedRole) ? savedRole : 'sekretaris';
            setActiveRole(initialRole);
            localStorage.setItem('booking_active_role', initialRole);
          } else if (userData.role === 'kepala_kantor') {
            setActiveRole('kepala_kantor');
            localStorage.setItem('booking_active_role', 'kepala_kantor');
          } else if (userData.role === 'admin') {
            const validRoles = ['admin', 'user'];
            const initialRole = savedRole && validRoles.includes(savedRole) ? savedRole : 'admin';
            setActiveRole(initialRole);
            localStorage.setItem('booking_active_role', initialRole);
          } else {
            // Regular user can only have 'user' activeRole
            setActiveRole('user');
            localStorage.setItem('booking_active_role', 'user');
          }
        }
      } catch {
        // No valid session — user stays null
      } finally {
        if (!cancelled) {
          sessionCheckedRef.current = true;
          setSessionChecked(true);
        }
      }
    }
    checkSession();
    return () => { cancelled = true; };
  }, []);

  // Remove native HTML splash once React takes over
  useEffect(() => {
    const nativeSplash = document.getElementById('native-splash');
    if (nativeSplash) {
      nativeSplash.style.opacity = '0';
      nativeSplash.style.visibility = 'hidden';
      setTimeout(() => nativeSplash.remove(), 500);
    }
  }, []);

  // Removed interval polling here. 
  // We now rely on Ably Realtime for service status updates.

  const updateServiceStatuses = useCallback((newStatuses) => {
    setServiceStatuses(prev => ({ ...prev, ...newStatuses }));
  }, []);

  const login = useCallback(async (nip, password) => {
    try {
      const result = await authApi.signIn(nip, password);
      if (result?.user) {
        const userData = {
          id: result.user.id,
          name: result.user.name,
          nip: result.user.nip,
          nipPanjang: result.user.nipPanjang,
          role: result.user.role,
          jabatan: result.user.jabatan,
          email: result.user.email,
          image: result.user.image,
        };
        // Clear any previous query cache to prevent cross-account data leaks
        queryClient.clear();
        setUser(userData);

        // Determine active role
        let role = userData.role;
        if (role === 'superadmin') {
          setActiveRole('superadmin');
          localStorage.setItem('booking_active_role', 'superadmin');
        } else {
          setActiveRole(role);
          localStorage.setItem('booking_active_role', role);
        }

        // Re-check service status after login
        try {
          const statusRes = await serviceApi.getStatus();
          if (statusRes?.data) setServiceStatuses(statusRes.data);
        } catch {}

        return { success: true, role };
      }
      return { success: false, message: 'Login gagal. Periksa NIP dan password.' };
    } catch (err) {
      return { success: false, message: err.message || 'NIP atau password salah.' };
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // Ignore sign-out errors
    }
    // Purge all cached queries (notifications, bookings, etc.)
    queryClient.clear();
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem('booking_active_role');
  }, [queryClient]);

  const switchRole = useCallback((newRole) => {
    if (!user) return;
    
    const validRoles = user.role === 'superadmin'
      ? ['superadmin', 'admin', 'user', 'kepala_kantor', 'sekretaris']
      : user.role === 'sekretaris'
      ? ['sekretaris', 'admin', 'user']
      : user.role === 'admin'
      ? ['admin', 'user']
      : [];

    if (validRoles.includes(newRole)) {
      setActiveRole(newRole);
      localStorage.setItem('booking_active_role', newRole);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['pegawai-cuti'] });
      queryClient.invalidateQueries({ queryKey: ['rekap-spd'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-st'] });
      queryClient.invalidateQueries({ queryKey: ['tracking-dashboard'] });
    }
  }, [user, queryClient]);

  // Show splash screen until the entire sequence (video → spinner → fadeout) completes
  if (!splashDone) {
    return (
      <SplashScreen
        sessionReady={sessionChecked}
        onComplete={() => setSplashDone(true)}
      />
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      activeRole,
      serviceStatuses,
      updateServiceStatuses,
      switchRole,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
