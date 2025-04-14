import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/Admin/AdminLayout';
import { getProducts, deleteProduct, updateProduct } from '../../services/api';
import '../../styles/Admin.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();

  // Fetch products from the API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products from API...');
      const response = await getProducts();
      console.log('Products data received:', response.data);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      
      // Show detailed error for debugging
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        console.error('Error request:', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/admin/login');
      return;
    }
    
    // Load products from API
    fetchProducts();
  }, [navigate]);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredProducts = filter === 'all' 
    ? products 
    : filter === 'featured' 
      ? products.filter(p => p.featured) 
      : products.filter(p => p.category === filter);

  const handleToggleFeatured = async (productId) => {
    try {
      // Find the product
      const product = products.find(p => p._id === productId);
      if (!product) return;

      // Toggle featured status
      const updatedProduct = { ...product, featured: !product.featured };
      
      // Update in the backend
      await updateProduct(productId, updatedProduct);
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p._id === productId ? { ...p, featured: !p.featured } : p
        )
      );
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product');
    }
  };

  // Open delete confirmation modal
  const confirmDelete = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      // Delete from backend
      await deleteProduct(productToDelete._id);
      
      // Remove from state
      setProducts(products.filter(p => p._id !== productToDelete._id));
      
      // Close modal
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product. Please try again.');
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  return (
    <AdminLayout activeTab="products">
      <div className="admin-header">
        <h1>Manage Products</h1>
        <div className="admin-actions">
          <div className="product-filter">
            <select value={filter} onChange={handleFilterChange}>
              <option value="all">All Products</option>
              <option value="featured">Featured Products</option>
              {/* Generate options from unique categories */}
              {[...new Set(products.map(p => p.category))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <button 
            className="create-product-btn"
            onClick={() => navigate('/admin/products/create')}
          >
            <i className="fas fa-plus"></i> Add Product
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="admin-loading">Loading products...</div>
      ) : error ? (
        <div className="admin-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchProducts}>Try Again</button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="admin-empty">
          <i className="fas fa-box-open"></i>
          <p>No products found</p>
        </div>
      ) : (
        <div className="admin-products">
          <div className="admin-products-header">
            <div className="product-thumb">Image</div>
            <div className="product-name">Product Name</div>
            <div className="product-category">Category</div>
            <div className="product-price">Price</div>
            <div className="product-stock">Stock</div>
            <div className="product-actions">Actions</div>
          </div>
          
          {filteredProducts.map(product => (
            <div className="admin-product-row" key={product._id}>
              <div className="product-thumb">
                <img 
                  src={product.image || 'https://via.placeholder.com/150'} 
                  alt={product.name} 
                />
              </div>
              <div className="product-name">
                {product.name}
                {product.featured && (
                  <span className="featured-badge">Featured</span>
                )}
              </div>
              <div className="product-category">{product.category}</div>
              <div className="product-price">${Number(product.price).toFixed(2)}</div>
              <div className="product-stock">
                <span className={product.countInStock > 10 ? 'in-stock' : 'low-stock'}>
                  {product.countInStock} in stock
                </span>
              </div>
              <div className="product-actions">
                <button 
                  className={`feature-btn ${product.featured ? 'featured' : ''}`}
                  onClick={() => handleToggleFeatured(product._id)}
                >
                  <i className={`fas fa-${product.featured ? 'star' : 'star'}`}></i>
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => confirmDelete(product)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this product?</p>
            <p className="product-name-delete">
              "{productToDelete?.name}"
            </p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={handleDeleteProduct}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts; 