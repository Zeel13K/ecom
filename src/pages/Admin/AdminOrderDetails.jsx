import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../../services/api';
import AdminLayout from '../../components/Admin/AdminLayout';
import '../../styles/Admin.css';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.isAdmin === true;
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn || !isAdmin) {
      console.log('Not authenticated as admin, redirecting to login');
      localStorage.setItem('adminReturnUrl', `/admin/orders/${id}`);
      navigate('/admin/login');
      return;
    }
    
    fetchOrderDetails();
  }, [id, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
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
      } catch (localError) {
        console.error('Error loading order from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(id, newStatus);
      
      // Update local state
      setOrder(prevOrder => ({
        ...prevOrder,
        status: newStatus
      }));
      
      console.log(`Order ${id} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGoBack = () => {
    navigate('/admin/orders');
  };

  // Format date
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format order ID
  const formatOrderId = (orderId) => {
    if (orderId?.startsWith('ORD-')) return orderId;
    return orderId?.length > 8 ? orderId.slice(-8).toUpperCase() : (orderId || '').toUpperCase();
  };

  return (
    <AdminLayout activeTab="orders">
      <div className="admin-header">
        <h1>Order Details</h1>
        <div className="admin-actions">
          <button className="back-btn" onClick={handleGoBack}>
            <i className="fas fa-arrow-left"></i> Back to Orders
          </button>
          <button className="refresh-btn" onClick={fetchOrderDetails} disabled={loading}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading order details...</div>
      ) : error ? (
        <div className="admin-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchOrderDetails}>Try Again</button>
        </div>
      ) : order ? (
        <div className="admin-order-details">
          <div className="order-meta-card">
            <div className="order-meta-header">
              <h2>Order #{order.orderNumber || formatOrderId(order.id || order._id)}</h2>
              <div className="order-meta-status">
                <span className="status-label">Current Status:</span>
                <select 
                  value={order.status || 'processing'} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`status-select admin-status-select ${order.status}`}
                  disabled={updatingStatus}
                >
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {updatingStatus && <span className="updating-status">Updating...</span>}
              </div>
            </div>

            {/* Add Status History Section */}
            <div className="status-history-section">
              <h3>Status History</h3>
              <div className="status-timeline">
                {(order.statusHistory || []).map((history, index) => (
                  <div key={index} className="status-timeline-item">
                    <div className={`status-dot ${history.status}`}></div>
                    <div className="status-info">
                      <span className={`status-badge ${history.status}`}>
                        {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                      </span>
                      <span className="status-time">
                        {formatDateTime(history.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-meta-info">
              <div className="meta-item">
                <span className="meta-label">Date Placed:</span>
                <span className="meta-value">{formatDateTime(order.date || order.createdAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Customer:</span>
                <span className="meta-value">{order.user?.name || order.shippingAddress?.name || 'Not available'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Email:</span>
                <span className="meta-value">{order.user?.email || order.email || 'Not available'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total:</span>
                <span className="meta-value price">${(order.total || order.totalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="admin-detail-sections">
            <div className="admin-detail-section">
              <h3 className="section-title">Customer Information</h3>
              <div className="admin-detail-content">
                <div className="detail-column">
                  <h4>Shipping Address</h4>
                  <div className="address-card">
                    <p><strong>{order.shippingAddress?.name || order.user?.name || 'Customer'}</strong></p>
                    <p>{order.shippingAddress?.address || 'No address provided'}</p>
                    <p>
                      {order.shippingAddress?.city}
                      {order.shippingAddress?.city && order.shippingAddress?.state && ', '}
                      {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                    </p>
                    <p>{order.shippingAddress?.country}</p>
                    <p>Phone: {order.shippingAddress?.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="detail-column">
                  <h4>Payment Information</h4>
                  <div className="payment-card">
                    <p><strong>Method:</strong> {order.paymentMethod || 'Not specified'}</p>
                    <p><strong>Status:</strong> {order.isPaid ? 'Paid' : 'Not Paid'}</p>
                    {order.isPaid && (
                      <p><strong>Paid on:</strong> {formatDateTime(order.paidAt)}</p>
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
            </div>

            <div className="admin-detail-section">
              <h3 className="section-title">Order Items</h3>
              <div className="admin-items-table">
                <div className="admin-items-header">
                  <div className="item-image">Image</div>
                  <div className="item-name">Product</div>
                  <div className="item-price">Price</div>
                  <div className="item-quantity">Quantity</div>
                  <div className="item-total">Total</div>
                </div>
                
                <div className="admin-items-body">
                  {(order.items || order.orderItems)?.map((item, index) => (
                    <div className="admin-item-row" key={index}>
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
                      <div className="item-name">{item.name || item.title}</div>
                      <div className="item-price">${(item.price || 0).toFixed(2)}</div>
                      <div className="item-quantity">{item.quantity}</div>
                      <div className="item-total">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-detail-section">
              <h3 className="section-title">Order Summary</h3>
              <div className="admin-order-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${(order.itemsPrice || order.totalItems || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span>${(order.shippingPrice || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax:</span>
                  <span>${(order.taxPrice || 0).toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${(order.total || order.totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="admin-actions-bar">
              <button 
                className="admin-button danger"
                onClick={() => handleStatusChange('cancelled')}
                disabled={order.status === 'cancelled' || updatingStatus}
              >
                Cancel Order
              </button>
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button 
                  className="admin-button success"
                  onClick={() => handleStatusChange(order.status === 'processing' ? 'shipped' : 'delivered')}
                  disabled={updatingStatus}
                >
                  {order.status === 'processing' ? 'Mark as Shipped' : 'Mark as Delivered'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-empty">
          <i className="fas fa-search"></i>
          <p>Order not found</p>
          <button onClick={handleGoBack} className="admin-button">Back to Orders</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOrderDetails; 