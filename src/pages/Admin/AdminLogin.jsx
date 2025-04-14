import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Admin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.isAdmin === true;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('adminLoggedIn') === 'true';
    
    if (isLoggedIn && isAdmin) {
      const returnUrl = localStorage.getItem('adminReturnUrl') || '/admin/dashboard';
      localStorage.removeItem('adminReturnUrl');
      navigate(returnUrl);
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple admin authentication - in a real app this would be server-side
    if (email === 'admin@example.com' && password === 'admin123') {
      // Create admin token
      const adminToken = 'admin-' + btoa(JSON.stringify({
        id: 'admin-user-id',
        email: email,
        isAdmin: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      }));

      // Set admin authentication
      localStorage.setItem('adminToken', adminToken);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminEmail', email);

      // Set user data
      const userData = {
        _id: 'admin-user-id',
        name: 'Admin User',
        email: email,
        isAdmin: true,
        token: adminToken
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      
      console.log('Admin logged in successfully:', {
        adminToken: adminToken.substring(0, 20) + '...',
        userData
      });
      
      // Get the return URL if it exists
      const returnUrl = localStorage.getItem('adminReturnUrl') || '/admin/dashboard';
      localStorage.removeItem('adminReturnUrl');
      navigate(returnUrl);
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-header">
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the admin panel</p>
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
            />
          </div>
          
          <button type="submit" className="admin-button">Login</button>
          
          <div className="admin-info">
            <p>Demo credentials: admin@example.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 