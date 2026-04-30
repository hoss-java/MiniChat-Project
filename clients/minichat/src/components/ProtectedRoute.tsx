import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute component
 * Guards access to authenticated pages
 * - Shows loading spinner while checking authentication
 * - Renders children if user is authenticated
 * - Redirects to login if user is not authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state } = useAuth();

  // Show loading spinner while checking auth
  if (state.isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If authenticated, render the protected page
  if (state.isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
};
