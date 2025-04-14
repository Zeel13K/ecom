import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser, loading, isAdminLoggedIn } = useAuth();
  
  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // For admin routes, check admin authentication
  if (requireAdmin) {
    console.log('---Admin Authentication Check---');
    console.log('Current location:', location.pathname);
    console.log('User data:', currentUser);
    console.log('Authentication state:', {
      isAuthenticated,
      hasAdminToken: !!localStorage.getItem('adminToken'),
      adminLoggedIn: localStorage.getItem('adminLoggedIn') === 'true',
      isUserAdmin: currentUser?.isAdmin
    });
    
    // Use the isAdminLoggedIn function for admin check
    const adminCheckResult = isAdminLoggedIn();
    console.log('isAdminLoggedIn result:', adminCheckResult);
    
    if (!adminCheckResult) {
      console.log('Admin access required but admin is not logged in');
      
      // For development mode, help set up admin in localStorage if needed
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: checking test admin setup');
        
        // If we have a user with isAdmin but missing adminLoggedIn flag
        if (currentUser?.isAdmin && !localStorage.getItem('adminLoggedIn')) {
          console.log('Current user is admin but adminLoggedIn flag is missing');
          localStorage.setItem('adminLoggedIn', 'true');
          
          // Reload the page to apply the change
          window.location.reload();
          return <div>Setting up admin access...</div>;
        }
      }
      
      // Store the current location for redirect after admin login
      localStorage.setItem('adminReturnUrl', location.pathname);
      
      // Redirect to admin login
      return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
    }
    // Admin is properly authenticated, render the admin component
    return children;
  }
  
  // For regular user routes, check user authentication
  if (!isAuthenticated) {
    console.log('User authentication required but not authenticated');
    
    // Store the current location for redirect after login
    localStorage.setItem('returnUrl', location.pathname);
    
    // Redirect to login with the return location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If all checks pass, render the protected component
  return children;
};

export default PrivateRoute; 