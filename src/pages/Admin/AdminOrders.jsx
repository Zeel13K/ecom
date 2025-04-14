import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getOrders, updateOrderStatus } from '../../services/api';
import '../../styles/Admin.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const adminToken = localStorage.getItem('adminToken');
      const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
      const isAdmin = user.isAdmin === true;

      console.log('Checking admin authentication:', {
        hasAdminToken: !!adminToken,
        isAdminLoggedIn,
        isAdmin,
        user
      });

      if (!isAdminLoggedIn || !isAdmin) {
        console.log('Not authenticated as admin, redirecting to login');
        localStorage.setItem('adminReturnUrl', window.location.pathname);
        navigate('/admin/login');
        return false;
      }
      return true;
    };

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching orders...', { page: currentPage, status: statusFilter });
        
        const response = await getOrders({ page: currentPage, status: statusFilter });
        
        if (response?.data?.orders) {
          setOrders(response.data.orders);
          setTotalPages(response.data.pages || 1);
          setCurrentPage(response.data.page || 1);
          setTotalOrders(response.data.total || response.data.orders.length);
          console.log('Orders loaded successfully:', response.data.orders.length);
        } else {
          console.warn('Invalid response format:', response);
          setError('Received invalid data format from server');
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load orders';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          console.log('Authentication failed, redirecting to login');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminLoggedIn');
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (checkAdminAuth()) {
      loadOrders();
    }
  }, [currentPage, statusFilter, navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      console.log(`Updating order ${orderId} status to ${newStatus}`);
      
      await updateOrderStatus(orderId, newStatus);
      
      // Refresh the current page
      await loadOrders();
      
      console.log(`Order ${orderId} status updated successfully`);
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update order status';
      alert(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/admin/login');
        return;
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const viewOrderDetails = (orderId) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const formatDate = (dateString) => {
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-processing';
    }
  };

  return (
    <AdminLayout activeTab="orders">
      <div className="admin-header">
        <div className="header-content">
          <h1>Manage Orders</h1>
          <p>Total Orders: {totalOrders}</p>
        </div>
        <div className="admin-actions">
          <select 
            value={statusFilter} 
            onChange={(e) => handleFilterChange(e.target.value)}
            className="status-filter"
          >
            <option value="">All Status</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            className="refresh-btn"
            onClick={() => loadOrders()}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> 
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="admin-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => loadOrders()}>Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-shopping-cart"></i>
          <p>No orders found</p>
          {statusFilter && (
            <button onClick={() => handleFilterChange('')}>Clear Filter</button>
          )}
        </div>
      ) : (
        <>
          <div className="admin-orders">
            <div className="admin-orders-header">
              <div className="order-id">Order ID</div>
              <div className="order-customer">Customer</div>
              <div className="order-date">Date</div>
              <div className="order-items">Items</div>
              <div className="order-total">Total</div>
              <div className="order-status">Status</div>
              <div className="order-actions">Actions</div>
            </div>
            
            {orders.map(order => (
              <div className="admin-order-row" key={order._id}>
                <div className="order-id">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</div>
                <div className="order-customer">
                  {order.user ? (
                    <div className="customer-info">
                      <span className="customer-name">{order.user.name}</span>
                      <span className="customer-email">{order.user.email}</span>
                    </div>
                  ) : 'N/A'}
                </div>
                <div className="order-date">{formatDate(order.createdAt)}</div>
                <div className="order-items">
                  <span className="item-count">{order.orderItems?.length || 0} items</span>
                  <span className="item-total">${order.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="order-total">
                  ${(order.totalPrice + (order.shippingPrice || 0)).toFixed(2)}
                </div>
                <div className="order-status">
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status || 'Processing'}
                  </span>
                  {order.isPaid && (
                    <span className="paid-badge">
                      <i className="fas fa-check"></i> Paid
                    </span>
                  )}
                </div>
                <div className="order-actions">
                  <select 
                    value={order.status || 'processing'} 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={`status-select ${getStatusClass(order.status)}`}
                    disabled={updatingOrder === order._id}
                  >
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button 
                    className="view-order-btn"
                    onClick={() => viewOrderDetails(order._id)}
                    title="View Order Details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button 
                className="page-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              <div className="page-info">
                Page {currentPage} of {totalPages}
              </div>
              <button 
                className="page-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminOrders; 