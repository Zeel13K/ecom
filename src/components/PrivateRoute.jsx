import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const token = localStorage.getItem('token');

  if (!isLoggedIn || !token) {
    // Store the current location for redirect after login
    localStorage.setItem('returnUrl', location.pathname);
    
    // Redirect to login with the return location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default PrivateRoute; 