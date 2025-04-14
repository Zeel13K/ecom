import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Admin.css';

const AdminLayout = ({ children, activeTab }) => {
  const navigate = useNavigate();
  const { currentUser, isAdminLoggedIn, logoutUser } = useAuth();
  const [adminName, setAdminName] = useState('Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Check if user is authenticated as admin using our new helper
    if (!isAdminLoggedIn()) {
      console.log('Not authenticated as admin, redirecting to admin login');
      localStorage.setItem('adminReturnUrl', window.location.pathname);
      navigate('/admin/login');
      return;
    }

    // Set admin information
    if (currentUser.name) {
      setAdminName(currentUser.name);
    } else if (currentUser.firstName && currentUser.lastName) {
      setAdminName(`${currentUser.firstName} ${currentUser.lastName}`);
    }
    
    setAdminEmail(currentUser.email || 'admin@example.com');
    
    // Check for unread messages
    try {
      const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      const unread = messages.filter(msg => msg.status === 'unread').length;
      setUnreadMessages(unread);
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  }, [navigate, currentUser, isAdminLoggedIn]);

  const handleLogout = () => {
    // Use the main logout function to ensure consistent logout behavior
    logoutUser();
    
    // Navigate to admin login
    navigate('/admin/login');
  };

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <div className="admin-profile">
          <div className="admin-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="admin-info">
            <p className="admin-name">{adminName}</p>
            <p className="admin-email">{adminEmail}</p>
          </div>
        </div>
        
        <nav className="admin-nav">
          <Link 
            to="/admin/dashboard" 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </Link>
          <Link 
            to="/admin/orders" 
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <i className="fas fa-shopping-bag"></i> Orders
          </Link>
          <Link 
            to="/admin/products" 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          >
            <i className="fas fa-box"></i> Products
          </Link>
          <Link 
            to="/admin/users" 
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <i className="fas fa-users"></i> Users
          </Link>
          <Link 
            to="/admin/messages" 
            className={`admin-nav-item ${activeTab === 'messages' ? 'active' : ''}`}
          >
            <i className="fas fa-envelope"></i> Messages
            {unreadMessages > 0 && (
              <span className="notification-badge">{unreadMessages}</span>
            )}
          </Link>
          
          <Link to="/" className="admin-nav-item store-link">
            <i className="fas fa-store"></i> View Store
          </Link>
          
          <button onClick={handleLogout} className="admin-nav-item logout">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </nav>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 