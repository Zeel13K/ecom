import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Login.css';
import '../styles/Header.css';
import { useAuth } from '../context/AuthContext';

// Simple header that doesn't rely on contexts
const SimpleHeader = () => {
  return (
    <header className="main-container">
      <nav>
        <div className="logo">
          <Link to="/">
            <img src="/logo.png" alt="E-Store Logo" />
          </Link>
        </div>
        <div className="nav-links">
          <Link className="navlinkss" to="/">Home</Link>
          <Link className="navlinkss" to="/shop">Shop</Link>
          <Link className="navlinkss" to="/about">About</Link>
          <Link className="navlinkss" to="/contact">Contact</Link>
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">Login</Link>
            <Link to="/signup" className="signup-btn">Sign Up</Link>
          </div>
          <Link to="/cart" className="cart-button">
            🛒 Cart (0)
          </Link>
        </div>
      </nav>
    </header>
  );
};

const SimpleLogin = () => {
  const { loginUser, authError, isAuthenticated, clearAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get return URL from location state or localStorage
  const returnUrl = location.state?.from || localStorage.getItem('returnUrl') || '/';

  // Debug helper function
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('Current auth status:', { 
      hasToken: !!token, 
      isLoggedInFlag, 
      hasUserData: !!userData,
      userData: userData ? {
        id: userData._id,
        email: userData.email,
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      } : null,
      isAuthenticated
    });
    
    return { token, isLoggedInFlag, userData };
  };

  // Check auth status on component mount
  useEffect(() => {
    console.log('Login page mounted, checking auth status');
    checkAuthStatus();
  }, []);

  // Clear auth errors when component mounts
  useEffect(() => {
    if (clearAuthError) clearAuthError();
  }, [clearAuthError]);

  // Update local error state when authError changes
  useEffect(() => {
    if (authError) {
      setError(authError);
      setLoading(false);
    }
  }, [authError]);

  // Redirect if already authenticated
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const { token, isLoggedInFlag, userData } = checkAuthStatus();
      
      // If authenticated in any way, redirect
      if (isAuthenticated || (token && isLoggedInFlag && userData)) {
        console.log('User is authenticated, redirecting to:', returnUrl);
        
        // Direct login in development mode without context if needed
        if (!isAuthenticated && token && isLoggedInFlag && userData && process.env.NODE_ENV === 'development') {
          console.log('Authentication state doesn\'t match localStorage, forcing login');
          // This is handled elsewhere
        }
        
        // Clear any stored return URLs
        localStorage.removeItem('returnUrl');
        navigate(returnUrl);
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate, returnUrl]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // For development mode, first try direct login from localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Attempting direct login');
        try {
          // Try direct login from localStorage
          const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const matchingUser = registeredUsers.find(u => 
            u.email === email && 
            u.password === password
          );
          
          if (matchingUser) {
            console.log('Found matching user in localStorage:', email);
            
            // Create safe user object without password
            const safeUser = { ...matchingUser };
            delete safeUser.password;
            
            // Set up localStorage directly
            const token = 'dev-direct-token-' + Date.now();
            localStorage.setItem('token', token);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(safeUser));
            
            console.log('Direct login successful');
            
            // Redirect user without waiting for context update
            setLoading(false);
            navigate(returnUrl);
            return;
          }
        } catch (error) {
          console.error('Error attempting direct login:', error);
        }
      }
      
      // If direct login didn't work, try normal login
      console.log('Attempting login with API:', { email });
      const result = await loginUser(email, password);
      
      console.log('Login result:', { success: result?.success, userId: result?.user?._id });
      
      if (result?.success) {
        // Since loginUser updates localStorage, just check auth status
        checkAuthStatus();
        
        // Redirect will be handled by the useEffect, but we can do it directly too
        navigate(returnUrl);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
    }
  };

  return (
    <>
      <SimpleHeader />
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Enter your credentials to access your account</p>
          </div>
          
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  disabled={loading}
                  className="input-padded"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  disabled={loading}
                  className="input-padded"
                />
                <i
                  className="fas fa-eye toggle-password"
                  onClick={togglePasswordVisibility}
                  role="button"
                  tabIndex={0}
                />
              </div>
            </div>
            
            <div className="form-options">
              <Link to="/forgot-password" className="forgot-password">
                Forgot your password?
              </Link>
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <Link to="/signup">Create Account</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default SimpleLogin; 