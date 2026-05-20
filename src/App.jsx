import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
    },
  },
});

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import SuperadminLayout from './components/layout/SuperadminLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import MaintenancePage from './pages/MaintenancePage';
import UserDashboard from './pages/user/DashboardPage';
import MyBookingsPage from './pages/user/MyBookingsPage';
import UserChatPage from './pages/user/ChatPage';
import AccountPage from './pages/user/AccountPage';
import AdminDashboard from './pages/admin/DashboardPage';
import RequestBoardPage from './pages/admin/RequestBoardPage';
import FleetPage from './pages/admin/FleetPage';
import DriversPage from './pages/admin/DriversPage';
import ReportsPage from './pages/admin/ReportsPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import SuperadminDashboard from './pages/superadmin/DashboardPage';
import AccountManagementPage from './pages/superadmin/AccountManagementPage';
import ServiceControlPage from './pages/superadmin/ServiceControlPage';
import ActivityLogPage from './pages/superadmin/ActivityLogPage';
import SuperadminSettingsPage from './pages/superadmin/SettingsPage';

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
  );
}

function AppShell() {
  const { theme } = useTheme();

  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-center"
        theme={theme}
        className="toaster-center"
        visibleToasts={1}
        toastOptions={{
          style: { fontFamily: "'Montserrat', sans-serif" },
          duration: 3500,
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
              <AppShell />
            </BookingProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
