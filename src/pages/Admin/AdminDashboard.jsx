import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import '../../styles/Admin.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalOrders: 0,
    totalProducts: 0,
    revenue: 0,
    totalMessages: 0,
    unreadMessages: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/admin/login');
      return;
    }
    
    // Load dashboard stats - in a real app, this would be from API
    // For this demo, we'll get order count from localStorage
    try {
      const allUsers = JSON.parse(localStorage.getItem('user') || '{}');
      const orders = allUsers.orders || [];
      
      // Calculate stats
      const pendingOrders = orders.filter(order => 
        order.status === 'processing' || order.status === 'pending'
      ).length;
      
      const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      // Get messages stats
      const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      const unreadMessages = messages.filter(msg => msg.status === 'unread').length;
      
      setStats({
        pendingOrders: pendingOrders,
        totalOrders: orders.length,
        totalProducts: 12, // Mock data
        revenue: revenue,
        totalMessages: messages.length,
        unreadMessages: unreadMessages
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    navigate('/admin/login');
  };

  return (
    <AdminLayout activeTab="dashboard">
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${stats.revenue.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unreadMessages}</div>
          <div className="stat-label">Unread Messages</div>
        </div>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Quick Actions</h2>
        </div>
        <div className="admin-card-content">
          <div className="dashboard-actions">
            <Link to="/admin/orders" className="dashboard-action-btn">
              <i className="fas fa-eye"></i> View Orders
            </Link>
            <Link to="/admin/products" className="dashboard-action-btn">
              <i className="fas fa-eye"></i> View Products
            </Link>
            <Link to="/admin/messages" className="dashboard-action-btn">
              <i className="fas fa-envelope"></i> View Messages
              {stats.unreadMessages > 0 && (
                <span className="notification-badge">{stats.unreadMessages}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
      
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="admin-card-content">
          <p>No recent activity to display.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 