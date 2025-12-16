import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Not authenticated - redirect to login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Check if user is admin
    if (user.role !== 'admin') {
      // Non-admin users get redirected to user dashboard
      return <Navigate to="/dashboard" replace />;
    }

    // User is admin - allow access
    return <>{children}</>;
  } catch (e) {
    // Invalid user data - redirect to login
    return <Navigate to="/login" replace />;
  }
}

