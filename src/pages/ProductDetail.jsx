import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext"; // Import Cart Context
import "../styles/ProductDetail.css";
import Header from "../components/Header";

const ProductDetail = () => {
  const { id } = useParams();
  const { cart, addToCart, incrementQuantity } = useCart(); // Access Cart Functions
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://fakestoreapi.com/products/${id}`);
        const data = await response.json();
        
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
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

  if (!product) {
    return (
      <>
        <Header />
        <main className="product-details-page">
          <div className="error-message">
            <h2>Product Not Found</h2>
            <p>Sorry, we couldn't find the product you're looking for.</p>
            <a href="/shop" className="continue-shopping">← Continue Shopping</a>
          </div>
        </main>
      </>
    );
  }

  // ✅ Function to Update Cart
  const handleUpdateCart = () => {
    const inCart = cart.find((item) => item.id === product.id);

    if (inCart) {
      // If the product is already in the cart, increment its quantity
      for (let i = 0; i < quantity; i++) {
        incrementQuantity(product.id);
      }
    } else {
      // If the product is not in the cart, add it with the selected quantity
      addToCart({ ...product, quantity });
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
              src={`https://cors-anywhere.herokuapp.com/${product.image}`} 
              alt={product.title} 
              className="product-detail-image"
              onError={(e) => {
                // If first attempt fails, try alternative proxies
                if (!e.target.dataset.tried) {
                  e.target.dataset.tried = '1';
                  e.target.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(product.image)}`;
                } 
                // If second attempt fails, use a placeholder
                else if (e.target.dataset.tried === '1') {
                  e.target.dataset.tried = '2';
                  e.target.src = `https://via.placeholder.com/500x500?text=${encodeURIComponent(product.title)}`;
                }
              }}
            />
          </div>
          <div className="product-info-section">
            <div className="product-category">{product.category.toUpperCase()}</div>
            <h1 className="product-title">{product.title}</h1>
            <p className="product-description">{product.description}</p>
            <div className="product-price">${product.price.toFixed(2)}</div>
            <div className="quantity-selector">
              <button className="quantity-btn" onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>-</button>
              <input type="number" value={quantity} min={1} readOnly />
              <button className="quantity-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="add-to-cart-large" onClick={handleUpdateCart}>Update Cart</button>
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetail;
