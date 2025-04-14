import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import '../styles/Login.css';
import '../styles/Header.css';

const Login = () => {
  const { loginUser, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get return URL from location state or localStorage
  const returnUrl = location.state?.from || localStorage.getItem('returnUrl') || '/';

  useEffect(() => {
    // If already authenticated, redirect to return URL
    if (isAuthenticated) {
      navigate(returnUrl);
    }
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
      
      console.log('Attempting login with:', { email });
      const result = await loginUser(email, password);
      
      console.log('Login successful:', result);
      
      // Clear any stored return URLs
      localStorage.removeItem('returnUrl');
      
      // Redirect to the return URL
      navigate(returnUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
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
      <Header />
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Login to Your Account</h1>
            <p>Welcome back! Enter your credentials to access your account.</p>
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
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <Link to="/signup">Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Login;
