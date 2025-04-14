import React, { useState } from "react";
import { useCart } from "../context/CartContext"; 
import { useAuth } from "../context/AuthContext";
import "../styles/Cart.css"; 
import Header from "./Header";
import { useNavigate } from "react-router-dom";

// Local product images for fallback
const productImages = {
  electronics: "/images/electronics.svg",
  jewelry: "/images/jewelry.svg",
  "men's clothing": "/images/mens-clothing.svg",
  "women's clothing": "/images/womens-clothing.svg",
  default: "/images/product-placeholder.svg"
};

const Cart = () => {
  const { cart, incrementQuantity, decrementQuantity, removeFromCart } = useCart(); 
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [animateSummary, setAnimateSummary] = useState(false);

  // Calculate total price and items
  const totalPrice = cart.reduce((total, product) => total + product.price * product.quantity, 0);
  const totalItems = cart.reduce((total, product) => total + product.quantity, 0);
  
  // Estimated tax (8%)
  const tax = totalPrice * 0.08;
  
  // Shipping (free over $50, otherwise $5)
  const shipping = totalPrice > 50 ? 0 : 5;
  
  // Grand total
  const grandTotal = totalPrice + tax + shipping;
  
  // Function to trigger animation
  const triggerAnimation = () => {
    setAnimateSummary(true);
    setTimeout(() => setAnimateSummary(false), 700);
  };

  // Get product image source
  const getProductImage = (product) => {
    // Use the direct API image URL if available
    if (product.image) {
      return product.image;
    }
    // Fallback to local images if available
    if (product.localImage) {
      return product.localImage;
    }
    // Last resort fallback
    return productImages[product.category] || productImages.default;
  };

  return (
    <>
      <Header />
      <main className="cart-container">
        <div className="cart-header">
          <h1>Your Shopping Cart</h1>
          <a href="/shop" className="continue-shopping-btn">← Continue Shopping</a>
        </div>

        {!currentUser && (
          <div className="login-notification">
            <i className="fas fa-user-lock"></i>
            <div className="notification-content">
              <h3>Login Required</h3>
              <p>Please login or create an account to add items to your cart and proceed with checkout.</p>
              <div className="login-buttons">
                <button 
                  className="login-btn primary" 
                  onClick={() => navigate("/login?redirect=cart")}
                >
                  Login
                </button>
                <button 
                  className="signup-btn" 
                  onClick={() => navigate("/signup?redirect=cart")}
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="cart-content">
          <div className="cart-items-container">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your cart is empty.</p>
                <a href="/shop" className="continue-shopping">Continue Shopping</a>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map((product) => (
                  <div key={product.id} className="cart-item">
                    <div className="cart-item-image">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.title}
                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
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
                          // Last resort - category-based placeholder
                          else {
                            if (product.category?.includes('clothing')) {
                              e.target.src = 'https://via.placeholder.com/100x100?text=Clothing';
                            } else if (product.category?.includes('jewelery') || product.category?.includes('jewelry')) {
                              e.target.src = 'https://via.placeholder.com/100x100?text=Jewelry';
                            } else if (product.category?.includes('electronics')) {
                              e.target.src = 'https://via.placeholder.com/100x100?text=Electronics';
                            } else {
                              e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                            }
                          }
                        }} 
                      />
                    </div>
                    <div className="cart-item-details">
                      <h3>{product.title}</h3>
                      <p className="cart-item-price">${product.price.toFixed(2)}</p>
                      <div className="cart-item-controls">
                        {currentUser ? (
                          <>
                            <div className="quantity-controls">
                              <button onClick={() => {
                                decrementQuantity(product.id);
                                triggerAnimation();
                              }}>-</button>
                              <span>{product.quantity}</span>
                              <button onClick={() => {
                                incrementQuantity(product.id);
                                triggerAnimation();
                              }}>+</button>
                            </div>
                            <button className="remove-item" onClick={() => {
                              removeFromCart(product.id);
                              triggerAnimation();
                            }}>Remove</button>
                          </>
                        ) : (
                          <div className="login-required-message">
                            <i className="fas fa-lock"></i> Login to modify
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="cart-item-total">
                      <p>${(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className={`cart-summary ${animateSummary ? 'summary-animate' : ''}`}>
              <div className="summary-header">
                <h2>Order Summary</h2>
                <span className="summary-items">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="summary-content">
                <div className="summary-section">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="free-shipping-alert">
                      <p>Add ${(50 - totalPrice).toFixed(2)} more for free shipping</p>
                      <div className="shipping-progress">
                        <div className="shipping-bar" style={{ width: `${Math.min(totalPrice / 50 * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="summary-total">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                
                {currentUser ? (
                  <button className="checkout-btn" onClick={() => navigate("/checkout")}>
                    Checkout
                  </button>
                ) : (
                  <button className="login-checkout-btn" onClick={() => navigate("/login?redirect=checkout")}>
                    Login to Checkout
                  </button>
                )}
                
                <div className="secure-checkout">
                  <span><i className="fas fa-lock"></i> Secure Checkout</span>
                  <div className="payment-icons">
                    <span>Visa</span>
                    <span>Mastercard</span>
                    <span>PayPal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Cart;
