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

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!token || !isLoggedIn) {
      console.log('User not authenticated, redirecting to login');
      
      // For development mode, automatically create a test user and orders
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Creating test user and orders');
        
        // Create test user
        const testUser = {
          _id: 'test-user-1',
          email: 'user@example.com',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          isAdmin: false
        };
        
        // Create test token and set login status
        const testToken = 'dev-token-' + Date.now();
        localStorage.setItem('user', JSON.stringify(testUser));
        localStorage.setItem('token', testToken);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Create test orders if none exist
        const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        if (existingOrders.length === 0) {
          const newOrders = Array(3).fill().map((_, i) => ({
            _id: `mock-order-${Date.now()}-${i}`,
            user: testUser._id,
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
              email_address: testUser.email
            },
            taxPrice: 30.00,
            shippingPrice: 10.00,
            totalPrice: 509.98,
            isPaid: true,
            paidAt: new Date().toISOString(),
            status: ['processing', 'shipped', 'delivered'][i % 3],
            createdAt: new Date(Date.now() - i * 86400000).toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          localStorage.setItem('orders', JSON.stringify(newOrders));
        }
        
        // Now fetch orders
        fetchOrders();
        return;
      }
      
      // Store the current path to redirect back after login
      localStorage.setItem('returnUrl', '/orders');
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Fetch orders from API and update state
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token available for orders');
        setError('Please log in to view your orders');
        setLoading(false);
        return;
      }
      
      console.log('Fetching latest orders with token:', token.substring(0, 10) + '...');
      const response = await getMyOrders();
      
      console.log('Orders API response:', response);
      
      if (response && response.data) {
        // Handle different response formats
        const ordersData = Array.isArray(response.data) 
          ? response.data 
          : response.data.orders || [];
          
        console.log('Orders fetched successfully:', ordersData);
        
        if (ordersData.length === 0) {
          console.log('No orders found for this user');
        }
        
        setOrders(ordersData);
        setError(null);
      } else {
        console.error('Invalid response format:', response);
        setError('Unable to load orders. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.setItem('returnUrl', '/orders');
        navigate('/login');
      } else {
        // Display a more detailed error message for debugging
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load your orders. Please try again later.';
        console.error(`Order fetch error details: ${errorMessage}`);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchOrders();
      
      // Set up a periodic refresh (every 30 seconds)
      const refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
          console.log('Auto-refreshing orders...');
          fetchOrders();
        }
      }, 30000);
      
      // Clean up interval on unmount
      return () => clearInterval(refreshInterval);
    }
  }, []); // Remove currentUser dependency

  // Format date
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Format order ID to show only last 8 chars
  const formatOrderId = (id) => {
    // If it's already formatted with ORD- prefix, return as is
    if (id?.startsWith('ORD-')) return id;
    // Otherwise, show last 8 chars
    return id?.length > 8 ? `ORD-${id.slice(-6).toUpperCase()}` : (id ? `ORD-${id.toUpperCase()}` : 'ORD-UNKNOWN');
  };

  // Get product image with API URL handling
  const getProductImage = (item) => {
    // Use the direct image URL if available
    if (item.image) {
      // If image is a relative path, add API URL prefix
      if (!item.image.startsWith('http') && !item.image.startsWith('/')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${apiUrl}/${item.image}`;
      }
      return item.image;
    }
    
    // Try to get image from product reference if available
    if (item.product && typeof item.product === 'object' && item.product.image) {
      if (!item.product.image.startsWith('http') && !item.product.image.startsWith('/')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${apiUrl}/${item.product.image}`;
      }
      return item.product.image;
    }
    
    // Last resort fallback
    return '/placeholder.png';
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
              {process.env.NODE_ENV === 'development' && (
                <div className="dev-debug-info">
                  <p>Debug Info (Development Only):</p>
                  <ul>
                    <li>User: {JSON.stringify(currentUser?._id || 'Not logged in')}</li>
                    <li>Auth: {localStorage.getItem('token') ? 'Has token' : 'No token'}</li>
                    <li>Last refresh: {new Date(lastRefresh).toLocaleTimeString()}</li>
                  </ul>
                  <button 
                    onClick={handleRefresh} 
                    className="retry-button"
                  >
                    Retry Load
                  </button>
                </div>
              )}
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
                    <div className="status-and-actions">
                      <div className="order-status-badge">
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {order.status ? (
                            <>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              {order.statusUpdatedAt && (
                                <span className="status-update-time" title={formatDate(order.statusUpdatedAt)}>
                                  <i className="fas fa-clock"></i>
                                </span>
                              )}
                            </>
                          ) : (
                            order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'
                          )}
                        </span>
                      </div>
                      <button 
                        onClick={() => navigateToOrderDetails(order.id || order._id)} 
                        className="view-order-btn"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="order-items">
                    {(order.items || order.orderItems)?.length > 0 ? (
                      (order.items || order.orderItems).slice(0, 3).map((item, index) => (
                        <div className="order-item" key={index}>
                          <div className="item-image">
                            <img 
                              src={getProductImage(item)}
                              alt={item.name || item.title || 'Product'} 
                              onError={(e) => {
                                if (!e.target.dataset.fallback) {
                                  e.target.dataset.fallback = 'used';
                                  // Final fallback
                                  e.target.src = '/placeholder.png';
                                }
                              }}
                            />
                          </div>
                          <div className="item-details">
                            <h3>{item.name || item.title || (item.product?.name) || 'Product'}</h3>
                            <div className="item-info">
                              <span className="item-quantity">Qty: {item.quantity}</span>
                              <span className="item-price">${((item.price || item.product?.price || 0) * 1).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-items-message">
                        <p>No item details available for this order.</p>
                      </div>
                    )}
                    
                    {/* Show indication if there are more items */}
                    {(order.items || order.orderItems)?.length > 3 && (
                      <div className="more-items-indicator">
                        <span>+{(order.items || order.orderItems).length - 3} more items</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-footer">
                    <div className="order-total">
                      <span>Total</span>
                      <strong>${(order.total || order.totalPrice || 0).toFixed(2)}</strong>
                    </div>
                    <div className="order-actions">
                      {(order.status === 'shipped' || order.isDelivered) && (
                        <button className="track-order-btn">
                          <i className="fas fa-truck"></i> Track
                        </button>
                      )}
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