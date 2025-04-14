import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminLogin } from '../../services/api';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is already logged in and is an admin
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const adminToken = localStorage.getItem('adminToken');
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    const isAdminUser = userData?.isAdmin;
    
    console.log('AdminLogin - Auth check:', { 
      adminLoggedIn, 
      hasAdminToken: !!adminToken, 
      isAdminUser 
    });
    
    if (adminLoggedIn && adminToken && isAdminUser) {
      console.log('Admin already logged in, redirecting to dashboard');
      const returnUrl = localStorage.getItem('adminReturnUrl') || '/admin/dashboard';
      localStorage.removeItem('adminReturnUrl');
      navigate(returnUrl);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Attempting admin login with:', email);

      // In development mode, check for test admin directly
      if (process.env.NODE_ENV === 'development' && 
          email === 'admin@example.com' && 
          password === 'admin123') {
        
        console.log('Development mode: Using test admin account');
        
        // Create test admin user
        const testAdmin = {
          _id: 'test-admin-1',
          email: 'admin@example.com',
          name: 'Test Admin',
          firstName: 'Test',
          lastName: 'Admin',
          isAdmin: true
        };
        
        // Generate admin token
        const adminToken = 'dev-admin-token-' + Date.now();
        
        // Set up admin session
        localStorage.setItem('user', JSON.stringify(testAdmin));
        localStorage.setItem('adminToken', adminToken);
        localStorage.setItem('token', adminToken); // Also set as regular token
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('adminLoggedIn', 'true');
        
        console.log('Test admin session created, redirecting to dashboard');
        
        // Go to dashboard
        window.location.href = '/admin/dashboard';
        return;
      }
      
      // Use dedicated adminLogin function
      const response = await adminLogin({ email, password });
      
      if (response?.data?.success && response.data.user.isAdmin) {
        console.log('Admin logged in successfully:', response.data);
        
        // Store user data and token in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('adminToken', response.data.token); // Store the admin token
        localStorage.setItem('token', response.data.token); // Also store in regular token for compatibility
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('adminLoggedIn', 'true');
        
        // Manually reload the page to force auth context to update
        window.location.href = localStorage.getItem('adminReturnUrl') || '/admin/dashboard';
      } else {
        // User is not an admin
        setError('You do not have admin privileges');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-badge">Admin Access Only</div>
        
        <div className="admin-header">
          <h1>Admin Login</h1>
          <p>This login page is restricted to administrators only.</p>
        </div>
        
        {error && <div className="admin-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">Admin Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="Enter admin email"
              disabled={loading}
            />
          </div>
          
          <div className="admin-form-group">
            <label htmlFor="password">Admin Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="Enter password"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="admin-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </button>
          
          <div className="admin-info">
            <p>Demo credentials: admin@example.com / admin123</p>
          </div>
        </form>
        
        <div className="admin-login-footer">
          <p>Regular customer? <Link to="/login">Go to customer login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 