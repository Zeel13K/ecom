import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Shop.css';
import Header from '../components/Header';

const Shop = () => {
  const { cart, addToCart, incrementQuantity, decrementQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products from the API
  const getAllProducts = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Return data with original image URLs - we'll handle proxying at the component level
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
      return [];
    }
  };

  // Fetch products by category
  const getProductsByCategory = async (category) => {
    try {
      const response = await fetch(`https://fakestoreapi.com/products/category/${category}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Return data with original image URLs - we'll handle proxying at the component level
      return data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      setError('Failed to load category products. Please try again later.');
      return [];
    }
  };

  // Fetch categories from the API
  const getCategories = async () => {
    try {
      const response = await fetch('https://fakestoreapi.com/products/categories');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // Initialize the page data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Get all products first
        const productsData = await getAllProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Get categories
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Handle category change
  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      let filteredData;
      if (category === 'all') {
        filteredData = await getAllProducts();
      } else {
        filteredData = await getProductsByCategory(category);
      }
      setFilteredProducts(filteredData);
    } catch (error) {
      console.error('Error changing category:', error);
      setError('Failed to load category. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Check if a product is in the cart
  const isProductInCart = (productId) => {
    return Array.isArray(cart) && cart.some(item => item.id === productId);
  };

  // Get product quantity from cart
  const getProductQuantity = (productId) => {
    if (!Array.isArray(cart)) return 0;
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  // Handle adding product to cart
  const handleAddToCart = (product) => {
    addToCart(product);
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
          <h1>Our Products</h1>
          <div className="products-header">
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
                const shortDescription = product.description.slice(0, 60) + '...';
                const inCart = isProductInCart(product.id);
                const quantity = getProductQuantity(product.id);
                
                return (
                  <div 
                    key={product.id} 
                    className={`product-card ${inCart ? 'in-cart' : ''}`}
                    data-id={product.id}
                  >
                    <div className="image-container">
                      {/* Direct image without height constraints */}
                      <img 
                        src={product.image}
                        alt={product.title} 
                        className="product-image"
                        style={{ width: '300px', height: '300px' }}
                        onError={(e) => {
                          // If direct image fails, try using proxy
                          if (!e.target.dataset.tried) {
                            e.target.dataset.tried = '1';
                            e.target.src = `https://wsrv.nl/?url=${encodeURIComponent(product.image)}&default=placeholder`;
                          } 
                          // If proxy fails, try another one
                          else if (e.target.dataset.tried === '1') {
                            e.target.dataset.tried = '2';
                            e.target.src = `https://images.weserv.nl/?url=${encodeURIComponent(product.image)}`;
                          }
                          // Final fallback to placeholder
                          else {
                            // Use category placeholder
                            if (product.category.includes('clothing')) {
                              e.target.src = 'https://via.placeholder.com/600x800?text=Clothing';
                            } else if (product.category.includes('jewelery') || product.category.includes('jewelry')) {
                              e.target.src = 'https://via.placeholder.com/600x800?text=Jewelry';
                            } else if (product.category.includes('electronics')) {
                              e.target.src = 'https://via.placeholder.com/600x800?text=Electronics';
                            } else {
                              e.target.src = 'https://via.placeholder.com/600x800?text=Product';
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="product-details">
                      <div className="product-category">{product.category}</div>
                      <h3 className="product-title">{product.title}</h3>
                      <p className="product-description">
                        {shortDescription}
                        <Link to={`/product/${product.id}`} className="read-more">read more</Link>
                      </p>
                      <div className="product-price">${product.price.toFixed(2)}</div>
                      
                      {inCart ? (
                        <div className="quantity-controls" style={{ display: 'flex' }}>
                          <button 
                            className="decrease-quantity"
                            onClick={() => decrementQuantity(product.id)}
                          >−</button>
                          <input 
                            type="number" 
                            className="quantity-input" 
                            value={quantity}
                            readOnly
                          />
                          <button 
                            className="increase-quantity"
                            onClick={() => incrementQuantity(product.id)}
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