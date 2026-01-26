import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';

import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import TwoFactorPage from './pages/auth/TwoFactorPage';

import Dashboard from './pages/Dashboard';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import MyAssetsPage from './pages/MyAssetsPage';
import MyRequestsPage from './pages/MyRequestsPage';
import AssetRequestPage from './pages/AssetRequestPage';
import SupportPage from './pages/SupportPage';
import TicketDetailPage from './pages/TicketDetailPage';
import LicensesPage from './pages/LicensesPage';
import ProfilePage from './pages/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageAssetsPage from './pages/admin/ManageAssetsPage';
import ManageRequestsPage from './pages/admin/ManageRequestsPage';
import ManageTicketsPage from './pages/admin/ManageTicketsPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageLicensesPage from './pages/admin/ManageLicensesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import ReportsPage from './pages/admin/ReportsPage';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="spinner mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isCheckingAuth, user } = useAuthStore();

  if (isCheckingAuth) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
};

const App = () => {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingScreen />;

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/2fa-verify" element={<TwoFactorPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/my-assets" element={<MyAssetsPage />} />
        <Route path="/requests" element={<MyRequestsPage />} />
        <Route path="/asset-request" element={<AssetRequestPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/support/:id" element={<TicketDetailPage />} />
        <Route path="/licenses" element={<LicensesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute adminOnly><MainLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/assets" element={<ManageAssetsPage />} />
        <Route path="/admin/requests" element={<ManageRequestsPage />} />
        <Route path="/admin/tickets" element={<ManageTicketsPage />} />
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/licenses" element={<ManageLicensesPage />} />
        <Route path="/admin/audit" element={<AuditLogsPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
