import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import { Login } from './pages/auth/Login';

// Super Admin Pages
import { SuperAdminDashboard } from './pages/superAdmin/Dashboard';
import { AdminManagement } from './pages/superAdmin/AdminManagement';
import { BranchManagement } from './pages/superAdmin/BranchManagement';
import { AuditLogs } from './pages/superAdmin/AuditLogs';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { ManagerManagement } from './pages/admin/ManagerManagement';

// Manager Pages
import { ManagerDashboard } from './pages/manager/Dashboard';
import { EmployeeManagement } from './pages/manager/EmployeeManagement';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/Dashboard';
import { CustomerRegistration } from './pages/employee/CustomerRegistration';
import { CustomerSearch } from './pages/employee/CustomerSearch';
import { Restrictions } from './pages/employee/Restrictions';
import { Reversals } from './pages/employee/Reversals';

// Customer Pages
import { CustomerDashboard } from './pages/customer/Dashboard';
import { SendMoney } from './pages/customer/SendMoney';
import { Transactions } from './pages/customer/Transactions';
import { StatementPage } from './pages/customer/StatementPage';

// Shared Pages
import { SupportPage } from './pages/shared/SupportPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-xs font-semibold">
        Verifying Barwaqo Bank Security Credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root index redirector
const RootRedirector = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-xs font-semibold">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/super-admin/dashboard" replace />;
    case 'ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'MANAGER':
      return <Navigate to="/manager/dashboard" replace />;
    case 'EMPLOYEE':
      return <Navigate to="/employee/dashboard" replace />;
    case 'CUSTOMER':
      return <Navigate to="/customer/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Root & Login */}
          <Route path="/" element={<RootRedirector />} />
          <Route path="/login" element={<Login />} />

          {/* SUPER ADMIN ROUTES */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/admins"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/branches"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <BranchManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/transactions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/restrictions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Restrictions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reversals"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <Reversals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AuditLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/support"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/managers"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <ManagerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <CustomerSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reversals"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <Reversals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <StatementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* MANAGER ROUTES */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employees"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/customers"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <CustomerSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reversals"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Reversals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/restrictions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <Restrictions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/support"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* EMPLOYEE ROUTES */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/register-customer"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <CustomerRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/customers"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <CustomerSearch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/restrictions"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <Restrictions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/reversals"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <Reversals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/support"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* CUSTOMER ROUTES */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/transfer"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <SendMoney />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/transactions"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/statement"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <StatementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/support"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <SupportPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

