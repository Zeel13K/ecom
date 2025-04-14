import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProducts } from '../services/api'; // Import our API service
import '../styles/Shop.css';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const { cart, addToCart, incrementQuantity, decrementQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0); // Add refresh state to trigger refetching

  // Fetch products using our API service
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products...');
      const response = await getProducts();
      
      console.log('API Response:', response);
      
      if (response && response.data) {
        console.log('Products fetched successfully:', response.data);
        
        // Handle both array and object responses
        const productsArray = Array.isArray(response.data) 
          ? response.data 
          : response.data.products || [];
          
        // Make sure we have valid products with required fields
        const validProducts = productsArray.filter(p => p && (p.name || p.title));
        
        if (validProducts.length === 0) {
          console.warn('No valid products found in response');
          setError('No products available at this time.');
        } else {
          // Extract unique categories from products
          const uniqueCategories = [...new Set(validProducts.map(product => 
            product.category || 'uncategorized'
          ))];
          
          setProducts(validProducts);
          setFilteredProducts(validProducts);
          setCategories(uniqueCategories);
          setError(null);
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to load products. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize the page data
  useEffect(() => {
    fetchProducts();
  }, [refresh]); // Add refresh dependency to trigger refetching when needed

  // Handle category change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
      setFilteredProducts(filtered);
    }
  };

  // Check if a product is in the cart
  const isProductInCart = (productId) => {
    return Array.isArray(cart) && cart.some(item => 
      item.id === productId || item._id === productId
    );
  };

  // Get product quantity from cart
  const getProductQuantity = (productId) => {
    if (!Array.isArray(cart)) return 0;
    const item = cart.find(item => 
      item.id === productId || item._id === productId
    );
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart
  const handleAddToCart = (product) => {
    // Ensure product has an id property (use _id if available)
    const productToAdd = {
      ...product,
      id: product._id || product.id
    };
    
    console.log('Adding product to cart:', productToAdd);
    addToCart(productToAdd);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };

  return (
    <>
      <Header />
      <main className="shop-container">
        {/* Left Side - Category Selection */}
        <aside className="category-sidebar">
          <div className="category-box">
            <h2>Filter by Category</h2>
            <div className="category-list">
              <div 
                className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('all')}
              >
                All Products
              </div>
              {categories.map(category => (
                <div 
                  key={category}
                  className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </div>
              ))}
            </div>
          </div>
        </aside>
        
        {/* Right Side - Products Display */}
        <section className="products-section">
          <div className="products-header">
            <h1>Our Products</h1>
            <button className="refresh-button" onClick={handleRefresh} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Products'}
            </button>
          </div>
          <div className="products-status">
            <span className="products-count">
              Showing <span id="product-count">{filteredProducts.length}</span> products
            </span>
          </div>
          
          <div className="products-grid">
            {loading ? (
              <div id="loading-message">Loading products...</div>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p>No products found in this category.</p>
            ) : (
              filteredProducts.map(product => {
                const shortDescription = product.description 
                  ? (product.description.slice(0, 60) + '...') 
                  : 'No description available';
                const productId = product._id || product.id;
                const inCart = isProductInCart(productId);
                const quantity = getProductQuantity(productId);
                
                return (
                  <div 
                    key={productId} 
                    className={`product-card ${inCart ? 'in-cart' : ''}`}
                    data-id={productId}
                  >
                    <div className="image-container">
                      <img 
                        src={product.image || '/placeholder.png'}
                        alt={product.title || product.name} 
                        className="product-image"
                        onError={(e) => {
                          if (!e.target.dataset.tried) {
                            e.target.dataset.tried = '1';
                            e.target.src = '/placeholder.png';
                          }
                        }}
                      />
                    </div>

                    <div className="product-details">
                      <div className="product-category">{product.category || 'Product'}</div>
                      <h3 className="product-title">{product.title || product.name}</h3>
                      <p className="product-description">
                        {shortDescription}
                        <Link to={`/product/${productId}`} className="read-more">read more</Link>
                      </p>
                      <div className="product-price">${(product.price || 0).toFixed(2)}</div>
                      
                      {inCart ? (
                        <div className="quantity-controls">
                          <button 
                            className="decrease-quantity"
                            onClick={() => decrementQuantity(productId)}
                          >−</button>
                          <input 
                            type="number" 
                            className="quantity-input" 
                            value={quantity}
                            readOnly
                          />
                          <button 
                            className="increase-quantity"
                            onClick={() => incrementQuantity(productId)}
                          >+</button>
                        </div>
                      ) : (
                        <button 
                          className="add-to-cart" 
                          onClick={() => handleAddToCart(product)}
                        >Add to Cart</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Shop;