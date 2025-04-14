import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../services/api';
import Header from '../components/Header';
import '../styles/Orders.css';

const Orders = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch orders from API and update state
  const fetchOrders = async () => {
    try {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      console.log('Fetching latest orders...');
      const response = await getMyOrders();
      console.log('Orders fetched from API:', response.data);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again later.');
      // Fallback to localStorage orders if API fails
      const localOrders = currentUser?.orders || [];
      setOrders(localOrders);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchOrders();
    
    // Set up a periodic refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing orders...');
        fetchOrders();
      }
    }, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(refreshInterval);
  }, [currentUser]); // Only depend on currentUser, not lastRefresh

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format order ID to show only last 8 chars
  const formatOrderId = (id) => {
    // If it's already formatted with ORD- prefix, return as is
    if (id?.startsWith('ORD-')) return id;
    // Otherwise, show last 8 chars
    return id?.length > 8 ? id.slice(-8).toUpperCase() : (id || '').toUpperCase();
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'processing': return 'processing';
      case 'shipped': return 'shipped';
      case 'delivered': return 'delivered';
      case 'cancelled': return 'cancelled';
      default: return 'processing';
    }
  };

  // Manually refresh orders
  const handleRefresh = () => {
    fetchOrders();
  };

  // Navigate to the order details page
  const navigateToOrderDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  if (!currentUser) {
    return null; // Handle loading state
  }

  return (
    <>
      <Header />
      <main className="orders-page-container">
        <div className="orders-container">
          <div className="orders-header">
            <h1>My Orders</h1>
            <div className="orders-actions">
              <p>View your order history and track your purchases</p>
              <button onClick={handleRefresh} className="refresh-orders-btn" disabled={loading}>
                <i className="fas fa-sync-alt"></i> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-orders">
              <div className="loading-spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="no-orders">
              <i className="fas fa-shopping-bag"></i>
              <h2>No Orders Yet</h2>
              <p>Looks like you haven't placed any orders yet.</p>
              <Link to="/shop" className="shop-now-btn">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div className="order-card" key={order.id || order._id}>
                  <div className="order-header">
                    <div className="order-info">
                      <div className="order-number">
                        <span>Order #</span>
                        <strong>{order.orderNumber || formatOrderId(order.id || order._id)}</strong>
                      </div>
                      <div className="order-date">
                        <span>Placed on</span>
                        <strong>{formatDate(order.date || order.createdAt)}</strong>
                      </div>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                        {order.status || (order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {(order.items || order.orderItems)?.length > 0 ? (
                      (order.items || order.orderItems).map((item, index) => (
                        <div className="order-item" key={index}>
                          <div className="item-image">
                            <img src={item.image || '/placeholder.png'} alt={item.name || item.title} />
                          </div>
                          <div className="item-details">
                            <h3>{item.name || item.title}</h3>
                            <div className="item-info">
                              <span className="item-quantity">Qty: {item.quantity}</span>
                              <span className="item-price">${(item.price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-items-message">
                        <p>No item details available for this order.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total</span>
                      <strong>${(order.total || order.totalPrice || 0).toFixed(2)}</strong>
                    </div>
                    <div className="order-actions">
                      {order.status === 'shipped' && (
                        <button className="track-order-btn">
                          <i className="fas fa-truck"></i> Track Order
                        </button>
                      )}
                      <button 
                        className="view-details-btn"
                        onClick={() => navigateToOrderDetails(order.id || order._id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Orders; 