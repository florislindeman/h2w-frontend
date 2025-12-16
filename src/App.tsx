import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';

// Route Guards
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    try {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        // If admin tries to access user dashboard, redirect to admin
        if (user.role === 'admin' && allowedRoles.includes('medewerker')) {
          return <Navigate to="/admin" replace />;
        }
        // If user tries to access admin, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
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

        {/* Root redirect based on authentication */}
        <Route
          path="/"
          element={
            (() => {
              const token = localStorage.getItem('token');
              const userStr = localStorage.getItem('user');
              
              if (!token || !userStr) {
                return <Navigate to="/login" replace />;
              }
              
              try {
                const user = JSON.parse(userStr);
                if (user.role === 'admin') {
                  return <Navigate to="/admin" replace />;
                }
                return <Navigate to="/dashboard" replace />;
              } catch (e) {
                return <Navigate to="/login" replace />;
              }
            })()
          }
        />

        {/* 404 - Redirect to appropriate dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
