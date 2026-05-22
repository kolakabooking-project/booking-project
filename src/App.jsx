import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PWAInstallPrompt from './components/shared/PWAInstallPrompt';
import PageLoader from './components/ui/PageLoader';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
    },
  },
});

// Layouts (kept static — they wrap every page in their role group)
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import SuperadminLayout from './components/layout/SuperadminLayout';

// ─── Lazy-loaded Pages ───
// Auth (entry point)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));

// User pages
const UserDashboard = lazy(() => import('./pages/user/DashboardPage'));
const MyBookingsPage = lazy(() => import('./pages/user/MyBookingsPage'));
const UserChatPage = lazy(() => import('./pages/user/ChatPage'));
const AccountPage = lazy(() => import('./pages/user/AccountPage'));

// Admin pages (separate chunk group)
const AdminDashboard = lazy(() => import('./pages/admin/DashboardPage'));
const RequestBoardPage = lazy(() => import('./pages/admin/RequestBoardPage'));
const FleetPage = lazy(() => import('./pages/admin/FleetPage'));
const DriversPage = lazy(() => import('./pages/admin/DriversPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const AdminChatPage = lazy(() => import('./pages/admin/AdminChatPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

// Superadmin pages (separate chunk group)
const SuperadminDashboard = lazy(() => import('./pages/superadmin/DashboardPage'));
const AccountManagementPage = lazy(() => import('./pages/superadmin/AccountManagementPage'));
const ServiceControlPage = lazy(() => import('./pages/superadmin/ServiceControlPage'));
const ActivityLogPage = lazy(() => import('./pages/superadmin/ActivityLogPage'));
const SuperadminSettingsPage = lazy(() => import('./pages/superadmin/SettingsPage'));

function ProtectedRoute({ children, role }) {
  const { activeRole, isAuthenticated, serviceActive, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Show maintenance page for non-superadmin users when service is off
  if (!serviceActive && user?.role !== 'superadmin') {
    return <MaintenancePage />;
  }

  if (role && activeRole !== role) {
    // Redirect to appropriate dashboard based on active role
    if (activeRole === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    if (activeRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { activeRole, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    if (activeRole === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    if (activeRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      {/* User Routes */}
      <Route path="/user/dashboard" element={<ProtectedRoute role="user"><UserLayout><UserDashboard /></UserLayout></ProtectedRoute>} />
      <Route path="/user/my-bookings" element={<ProtectedRoute role="user"><UserLayout><MyBookingsPage /></UserLayout></ProtectedRoute>} />
      <Route path="/user/chat" element={<ProtectedRoute role="user"><UserLayout><UserChatPage /></UserLayout></ProtectedRoute>} />
      <Route path="/user/account" element={<ProtectedRoute role="user"><UserLayout><AccountPage /></UserLayout></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/requests" element={<ProtectedRoute role="admin"><AdminLayout><RequestBoardPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/fleet" element={<ProtectedRoute role="admin"><AdminLayout><FleetPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/drivers" element={<ProtectedRoute role="admin"><AdminLayout><DriversPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminLayout><ReportsPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute role="admin"><AdminLayout><AdminChatPage /></AdminLayout></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminLayout><AdminSettingsPage /></AdminLayout></ProtectedRoute>} />

      {/* Superadmin Routes */}
      <Route path="/superadmin/dashboard" element={<ProtectedRoute role="superadmin"><SuperadminLayout><SuperadminDashboard /></SuperadminLayout></ProtectedRoute>} />
      <Route path="/superadmin/accounts" element={<ProtectedRoute role="superadmin"><SuperadminLayout><AccountManagementPage /></SuperadminLayout></ProtectedRoute>} />
      <Route path="/superadmin/service" element={<ProtectedRoute role="superadmin"><SuperadminLayout><ServiceControlPage /></SuperadminLayout></ProtectedRoute>} />
      <Route path="/superadmin/logs" element={<ProtectedRoute role="superadmin"><SuperadminLayout><ActivityLogPage /></SuperadminLayout></ProtectedRoute>} />
      <Route path="/superadmin/settings" element={<ProtectedRoute role="superadmin"><SuperadminLayout><SuperadminSettingsPage /></SuperadminLayout></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <AppRoutes />
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        theme={theme}
        className="toaster-center"
        visibleToasts={1}
        toastOptions={{
          style: { fontFamily: "'Montserrat', sans-serif" },
          duration: 1000,
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <BookingProvider>
              <LoadingProvider>
                <AppShell />
              </LoadingProvider>
            </BookingProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
