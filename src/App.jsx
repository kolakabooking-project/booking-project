import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Toaster } from 'sonner';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
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

function ProtectedRoute({ children, role }) {
  const { activeRole, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && activeRole !== role) {
    return <Navigate to={activeRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { activeRole, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={activeRole === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
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
        position="top-right"
        theme={theme}
        toastOptions={{
          style: { fontFamily: "'Montserrat', sans-serif", fontSize: '14px' },
        }}
        richColors
        closeButton
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <BookingProvider>
            <AppShell />
          </BookingProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
