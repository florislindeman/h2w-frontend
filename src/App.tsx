import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Admin from './pages/Admin';

// Route Guard Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Not authenticated
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
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
  
  // Authenticated - everyone goes to admin
  return <Navigate to="/admin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Admin Panel - For all authenticated users */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard redirect to Admin (for legacy links) */}
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        
        {/* Root - Smart redirect based on auth status */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* 404 - Redirect to root (which will handle auth) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
