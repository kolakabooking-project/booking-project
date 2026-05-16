/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true); // true until session check completes

  // Check existing session on mount
  useEffect(() => {
    let cancelled = false;
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
        if (!cancelled) setLoading(false);
      }
    }
    checkSession();
    return () => { cancelled = true; };
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

  // Show nothing while checking session to prevent flash
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg-main)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-djp-blue border-t-transparent" />
          <p className="text-sm font-heading text-[color:var(--color-text-soft)]">Memuat sesi...</p>
        </div>
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
