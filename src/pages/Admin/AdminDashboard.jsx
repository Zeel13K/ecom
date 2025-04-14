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
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const hasAdminToken = !!localStorage.getItem('adminToken');
    
    console.log('Admin Dashboard - Auth check:', { isAdminLoggedIn, hasAdminToken });
    
    if (!isAdminLoggedIn || !hasAdminToken) {
      console.log('Admin Dashboard - Not authenticated as admin, redirecting to login');
      navigate('/admin/login');
      return;
    }
    
    // For development mode, create test data if needed
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Setting up test data for admin dashboard');
      
      // Create test orders if none exist
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user) {
          throw new Error('No user found in localStorage');
        }
        
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // If no orders, create some test orders
        if (orders.length === 0) {
          console.log('Creating test orders for admin dashboard');
          
          const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
          
          // Create 10 test orders with different statuses
          const testOrders = Array(10).fill().map((_, i) => ({
            _id: `test-order-${Date.now()}-${i}`,
            orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
            user: user._id,
            orderItems: [
              {
                name: 'Wireless Headphones',
                quantity: 1,
                image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
                price: 99.99,
                product: 'mock-1'
              },
              {
                name: 'Smart Watch',
                quantity: 2,
                image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg',
                price: 199.99,
                product: 'mock-2'
              }
            ],
            shippingAddress: {
              address: '123 Main St',
              city: 'Anytown',
              postalCode: '12345',
              country: 'USA'
            },
            paymentMethod: 'Credit Card',
            paymentResult: {
              id: `pay-${Date.now()}-${i}`,
              status: 'completed',
              update_time: new Date().toISOString(),
              email_address: user.email
            },
            taxPrice: 30.00,
            shippingPrice: 10.00,
            totalPrice: 509.98,
            isPaid: true,
            paidAt: new Date().toISOString(),
            status: orderStatuses[i % orderStatuses.length],
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          orders = [...testOrders];
          localStorage.setItem('orders', JSON.stringify(orders));
        }
        
        // Calculate stats
        const pendingOrders = orders.filter(order => 
          order.status === 'processing' || order.status === 'pending'
        ).length;
        
        const revenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        
        // Create some test messages if none exist
        let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        
        if (messages.length === 0) {
          console.log('Creating test messages for admin dashboard');
          
          const testMessages = Array(5).fill().map((_, i) => ({
            id: `msg-${Date.now()}-${i}`,
            name: `Test User ${i+1}`,
            email: `test${i+1}@example.com`,
            subject: `Test Message ${i+1}`,
            message: `This is a test message ${i+1} for the admin dashboard.`,
            status: i < 3 ? 'unread' : 'read',
            createdAt: new Date(Date.now() - i * 86400000).toISOString()
          }));
          
          messages = [...testMessages];
          localStorage.setItem('contactMessages', JSON.stringify(messages));
        }
        
        const unreadMessages = messages.filter(msg => msg.status === 'unread').length;
        
        // Update stats
        setStats({
          pendingOrders: pendingOrders,
          totalOrders: orders.length,
          totalProducts: 12, // Mock data
          revenue: revenue,
          totalMessages: messages.length,
          unreadMessages: unreadMessages
        });
      } catch (error) {
        console.error('Error creating test data:', error);
      }
    } else {
      // Load dashboard stats from localStorage for production
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