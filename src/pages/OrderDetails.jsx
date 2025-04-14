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
  }, [id]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format order ID
  const formatOrderId = (orderId) => {
    if (orderId?.startsWith('ORD-')) return orderId;
    return orderId?.length > 8 ? orderId.slice(-8).toUpperCase() : (orderId || '').toUpperCase();
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

  // Handle back button click
  const handleGoBack = () => {
    navigate('/orders');
  };

  // Handle refresh button click
  const handleRefresh = () => {
    fetchOrderDetails();
  };

  return (
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
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-order-details">
              <div className="loading-spinner"></div>
              <p>Loading order details...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button onClick={handleGoBack} className="go-back-btn">Go Back to Orders</button>
            </div>
          ) : order ? (
            <div className="order-details-card">
              <div className="order-summary">
                <div className="order-id-section">
                  <h2>Order #{order.orderNumber || formatOrderId(order.id || order._id)}</h2>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status || (order.isDelivered ? 'Delivered' : order.isPaid ? 'Processing' : 'Pending')}
                  </span>
                </div>
                <div className="order-date-section">
                  <p>Placed on {formatDate(order.date || order.createdAt)}</p>
                </div>
              </div>

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
                  {(order.items || order.orderItems)?.map((item, index) => (
                    <div className="order-detail-item" key={index}>
                      <div className="item-image">
                        <img 
                          src={item.image || '/placeholder.png'} 
                          alt={item.name || item.title}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="item-details">
                        <h4>{item.name || item.title}</h4>
                        <div className="item-specs">
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: ${(item.price || 0).toFixed(2)}</p>
                          <p>Subtotal: ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-price-summary">
                <h3>Order Summary</h3>
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Items:</span>
                    <span>${(order.itemsPrice || order.totalItems || 0).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Shipping:</span>
                    <span>${(order.shippingPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Tax:</span>
                    <span>${(order.taxPrice || 0).toFixed(2)}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total:</span>
                    <span>${(order.total || order.totalPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions-footer">
                {order.status === 'shipped' && (
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
              </div>
            </div>
          ) : (
            <div className="not-found-message">
              <i className="fas fa-search"></i>
              <h2>Order Not Found</h2>
              <p>We couldn't find the order you're looking for.</p>
              <button onClick={handleGoBack} className="go-back-btn">Go Back to Orders</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default OrderDetails; 