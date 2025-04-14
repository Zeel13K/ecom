import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext"; // Import Cart Context
import { getProductById } from "../services/api"; // Import our API service
import "../styles/ProductDetail.css";
import Header from "../components/Header";

const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart, incrementQuantity } = useCart(); // Access Cart Functions
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use our API service instead of direct fetch
        const response = await getProductById(id);
        
        if (response && response.data) {
          console.log('Product fetched successfully:', response.data);
          setProduct(response.data);
        } else {
          console.error('Invalid response format:', response);
          setError('Failed to load product data');
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        setError('Error loading product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="product-details-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading product details...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="product-details-page">
          <div className="error-message">
            <h2>{error || 'Product Not Found'}</h2>
            <p>Sorry, we couldn't find the product you're looking for.</p>
            <a href="/shop" className="continue-shopping">← Continue Shopping</a>
          </div>
        </main>
      </>
    );
  }

  // ✅ Function to Update Cart
  const handleUpdateCart = () => {
    const inCart = cart.find((item) => item.id === product._id || item.id === product.id);

    if (inCart) {
      // If the product is already in the cart, increment its quantity
      for (let i = 0; i < quantity; i++) {
        incrementQuantity(product._id || product.id);
      }
    } else {
      // If the product is not in the cart, add it with the selected quantity
      addToCart({ 
        ...product, 
        id: product._id || product.id,
        quantity
      });
    }
  };

  return (
    <>
      <Header />
      <main className="product-details-page">
        <a href="/shop" className="continue-shopping">← Continue Shopping</a>
        <div className="product-details-container">
          <div className="product-image-section">
            <img 
              src={product.image} 
              alt={product.title || product.name} 
              className="product-detail-image"
              onError={(e) => {
                if (!e.target.dataset.tried) {
                  e.target.dataset.tried = '1';
                  // Add API URL prefix if it's a relative path
                  if (product.image && !product.image.startsWith('http') && !product.image.startsWith('/')) {
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    e.target.src = `${apiUrl}/${product.image}`;
                  } else {
                    e.target.src = '/placeholder.png';
                  }
                } else {
                  // Final fallback
                  e.target.src = '/placeholder.png';
                }
              }}
            />
          </div>
          <div className="product-info-section">
            <div className="product-category">{product.category?.toUpperCase() || 'PRODUCT'}</div>
            <h1 className="product-title">{product.title || product.name}</h1>
            <p className="product-description">{product.description}</p>
            <div className="product-price">${(product.price || 0).toFixed(2)}</div>
            <div className="quantity-selector">
              <button className="quantity-btn" onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>-</button>
              <input type="number" value={quantity} min={1} readOnly />
              <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="add-to-cart-large" onClick={handleUpdateCart}>
              {cart.find((item) => item.id === product._id || item.id === product.id) ? 'Update Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetail;
