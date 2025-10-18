import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import FullScreenLoader from './FullScreenLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminRequired?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminRequired = false }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenLoader text="Verifying Access..." />;
  }

  if (!user) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to.
    const redirectTo = adminRequired ? '/admin-login' : '/team-login';
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  if (adminRequired && !isAdmin) {
      // If user is logged in but not an admin, trying to access admin page
      return <Navigate to="/team-dashboard" replace />;
  }
  
  if (!adminRequired && isAdmin) {
      // If user is an admin trying to access team page
      return <Navigate to="/admin-dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;