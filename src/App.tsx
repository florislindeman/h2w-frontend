import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';

// Route Guard Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Not authenticated
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specific roles are required
  if (allowedRoles) {
    try {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        // Admin trying to access user dashboard
        if (user.role === 'admin' && allowedRoles.includes('medewerker')) {
          return <Navigate to="/admin" replace />;
        }
        // Non-admin trying to access admin panel
        return <Navigate to="/dashboard" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// Root Redirect Component
function RootRedirect() {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Not authenticated - go to login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  
  // Authenticated - redirect based on role
  try {
    const user = JSON.parse(userStr);
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  } catch (e) {
    // Invalid user data - go to login
    return <Navigate to="/login" replace />;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* User Dashboard - For medewerker and manager roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['medewerker', 'manager']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel - Only for admin role */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* Root - Smart redirect based on auth status and role */}
        <Route path="/" element={<RootRedirect />} />

        {/* 404 - Redirect to root (which will handle auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
