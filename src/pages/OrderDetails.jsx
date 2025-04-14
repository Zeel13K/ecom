import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderById } from '../services/api';
import Header from '../components/Header';
import '../styles/OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setRefreshing(true);
      console.log(`Fetching details for order ${id}...`);
      const response = await getOrderById(id);
      console.log('Order details fetched:', response.data);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again later.');
      
      // Fallback to localStorage for development/testing
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Falling back to localStorage for order details');
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          const userOrders = userData.orders || [];
          const foundOrder = userOrders.find(o => (o.id === id || o._id === id));
          
          if (foundOrder) {
            setOrder(foundOrder);
            setError(null);
          } else {
            setError('Order not found');
          }
        }
      } catch (localError) {
        console.error('Error loading order from localStorage:', localError);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load order details on component mount
  useEffect(() => {
    fetchOrderDetails();
    
    // Set up auto-refresh every 30 seconds to catch status updates
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Auto-refreshing order details...');
        fetchOrderDetails();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Format order ID
  const formatOrderId = (orderId) => {
    if (orderId?.startsWith('ORD-')) return orderId;
    return orderId?.length > 8 ? `ORD-${orderId.slice(-6).toUpperCase()}` : (orderId ? `ORD-${orderId.toUpperCase()}` : 'ORD-UNKNOWN');
  };

  // Get product image with proper URL handling
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

  // Calculate items total in case it's not provided
  const calculateItemsTotal = () => {
    try {
      const items = order.items || order.orderItems || [];
      return items.reduce((total, item) => {
        const price = (item.price || (item.product?.price) || 0);
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating items total:', error);
      return 0;
    }
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

  // Formats the status for display (capitalizes first letter)
  const formatStatus = (status) => {
    if (!status) return 'Processing';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Handle back button click
  const handleGoBack = () => {
    navigate('/orders');
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchOrderDetails();
  };

  return (
    <div className="order-details-container">
      <h1>Order Details</h1>
      
      {loading ? (
        <div className="loading-spinner">
          <p>Loading order details...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
      ) : !order ? (
        <div className="error-message">
          <p>Order not found. The order may have been deleted or you may not have permission to view it.</p>
          <button onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
      ) : (
        <>
          <Header />
          <main className="order-details-container">
            <div className="order-details-content">
              <div className="order-details-header">
                <button className="back-button" onClick={handleGoBack}>
                  <i className="fas fa-arrow-left"></i> Back to Orders
                </button>
                <h1>Order Details</h1>
                <button 
                  className="refresh-details-btn" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i> Refresh
                </button>
              </div>
            
              <div className="order-status">
                <span className={`status-badge ${getStatusClass(order.status)}`}>
                  {formatStatus(order.status || (order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'))}
                </span>
                {order.statusUpdatedAt && (
                  <span className="status-updated">
                    Last updated: {formatDate(order.statusUpdatedAt)}
                  </span>
                )}
              </div>
              
              <div className="order-details-card">
                <div className="order-summary">
                  <div className="order-id-section">
                    <h2>Order #{order.orderNumber || formatOrderId(order.id || order._id)}</h2>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {formatStatus(order.status || (order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending'))}
                    </span>
                  </div>
                  <div className="order-date-section">
                    <p>Placed on {formatDate(order.date || order.createdAt)}</p>
                  </div>
                </div>

                {/* Status history timeline */}
                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div className="status-history-section">
                    <h3>Order Status Updates</h3>
                    <div className="status-timeline">
                      {order.statusHistory.map((history, index) => (
                        <div key={index} className="status-timeline-item">
                          <div className={`status-dot ${history.status}`}></div>
                          <div className="status-info">
                            <span className={`status-badge ${history.status}`}>
                              {formatStatus(history.status)}
                            </span>
                            <span className="status-time">
                              {formatDate(history.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="order-details-section">
                  <div className="shipping-info">
                    <h3>Shipping Information</h3>
                    <div className="info-card">
                      <p><strong>{order.shippingAddress?.name || order.user?.name || 'Customer'}</strong></p>
                      <p>{order.shippingAddress?.address}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                      <p>{order.shippingAddress?.country}</p>
                      <p>Email: {order.user?.email || order.email || 'Not provided'}</p>
                      <p>Phone: {order.shippingAddress?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="payment-info">
                    <h3>Payment Information</h3>
                    <div className="info-card">
                      <p><strong>Payment Method:</strong> {order.paymentMethod || 'Not specified'}</p>
                      {order.isPaid ? (
                        <p><strong>Paid on:</strong> {formatDate(order.paidAt)}</p>
                      ) : (
                        <p><strong>Payment Status:</strong> Not paid</p>
                      )}
                      {order.paymentResult && (
                        <>
                          <p><strong>Transaction ID:</strong> {order.paymentResult.id}</p>
                          <p><strong>Status:</strong> {order.paymentResult.status}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="order-details-items">
                  <h3>Order Items</h3>
                  <div className="items-container">
                    {(order.items || order.orderItems)?.length > 0 ? (
                      (order.items || order.orderItems).map((item, index) => (
                        <div className="order-detail-item" key={index}>
                          <div className="item-image">
                            <img 
                              src={getProductImage(item)}
                              alt={item.name || item.title || (item.product?.name) || 'Product'}
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
                            <h4>{item.name || item.title || (item.product?.name) || 'Product'}</h4>
                            <div className="item-specs">
                              <p>Quantity: {item.quantity}</p>
                              <p>Price: ${((item.price || item.product?.price || 0) * 1).toFixed(2)}</p>
                              <p>Subtotal: ${((item.price || item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                            </div>
                            {/* Only show View Product link if it's a real product with an ID */}
                            {item.product && item.product._id && !item.product._id?.startsWith('mock') && (
                              <Link to={`/product/${item.product._id}`} className="view-product-btn">
                                View Product
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-items-message">
                        <p>No item details available for this order.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-price-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Items Total:</span>
                    <span>${order.itemsTotal?.toFixed(2) || calculateItemsTotal().toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span>${order.shippingPrice?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax:</span>
                    <span>${order.taxPrice?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total:</span>
                    <span>${order.totalPrice?.toFixed(2) || (calculateItemsTotal() + (order.shippingPrice || 0) + (order.taxPrice || 0)).toFixed(2)}</span>
                  </div>
                </div>

                <div className="order-actions-footer">
                  {(order.status === 'shipped' || order.isDelivered) && (
                    <button className="track-order-btn">
                      <i className="fas fa-truck"></i> Track Shipment
                    </button>
                  )}
                  {!order.isPaid && (
                    <button className="pay-now-btn">
                      <i className="fas fa-credit-card"></i> Pay Now
                    </button>
                  )}
                  <button className="contact-support-btn">
                    <i className="fas fa-headset"></i> Contact Support
                  </button>
                  <button className="print-order-btn" onClick={() => window.print()}>
                    <i className="fas fa-print"></i> Print
                  </button>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default OrderDetails; 