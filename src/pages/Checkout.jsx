import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Checkout.css";
import "../styles/Cart.css"; 
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const { cart, clearCart, createOrder } = useCart();
  const { addOrder, currentUser } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "IND",
  });
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [currentStep, setCurrentStep] = useState("information");
  const [orderDetails, setOrderDetails] = useState(null);
  const [promoApplied, setPromoApplied] = useState(false);
  const [orderProgress, setOrderProgress] = useState('placed');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });
  const [cardType, setCardType] = useState("");
  const [flippedCard, setFlippedCard] = useState(false);
  const [cardFocus, setCardFocus] = useState("");

  const subtotal = cart.reduce((total, product) => total + product.price * product.quantity, 0);
  const shippingCost = shippingMethod === "standard" ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const totalPrice = subtotal + shippingCost + tax - discount;
  const totalItems = cart.reduce((total, product) => total + product.quantity, 0);

  const handleInputChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handlePaymentInputChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handleShippingChange = (e) => {
    setShippingMethod(e.target.value);
  };

  const handlePromoCode = () => {
    if (promoCode.toUpperCase() === "WELCOME10") {
      setDiscount(subtotal * 0.1);
      setPromoApplied(true);
    } else {
      alert("Invalid promo code");
    }
  };

  const handleOrderSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validate form if on payment step
    if (currentStep === "payment" && paymentMethod === "credit-card") {
      if (!paymentDetails.cardNumber || !paymentDetails.cardName || !paymentDetails.expiry || !paymentDetails.cvv) {
        alert("Please fill in all payment details");
        return;
      }
    }
    
    const orderNumber = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    const deliveryEndDate = new Date();
    deliveryEndDate.setDate(deliveryEndDate.getDate() + 7);
    const deliveryDateFormatted = `${deliveryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${deliveryEndDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;

    // Check if the cart is empty
    if (cart.length === 0) {
      alert("Your cart is empty. Please add items before placing an order.");
      return;
    }

    // Check if user is authenticated
    if (!currentUser || !currentUser._id) {
      console.error("User not authenticated or missing _id");
      alert("You must be logged in to place an order. Please log in and try again.");
      navigate('/login?redirect=checkout');
      return;
    }

    // Format order data for API - ensure product IDs are valid MongoDB ObjectIds
    const orderData = {
      orderItems: cart.map(item => ({
        name: item.title || item.name,
        quantity: item.quantity,
        image: item.image || getProductImage(item),
        price: item.price,
        // Use _id if available, otherwise use id, and ensure it's a proper ObjectId
        product: item._id || item.id
      })),
      shippingAddress: {
        address: customer.address,
        city: customer.city,
        postalCode: customer.zip,
        country: customer.country
      },
      paymentMethod,
      itemsPrice: subtotal,
      taxPrice: tax,
      shippingPrice: shippingCost,
      totalPrice
    };

    try {
      // Send order to API
      console.log("Current user:", currentUser);
      console.log("Auth token:", localStorage.getItem('token'));
      console.log("Submitting order data:", orderData);
      
      const createdOrder = await createOrder(orderData);
      console.log("Order created successfully:", createdOrder);
      
      if (!createdOrder) {
        throw new Error("Failed to create order - the server returned null or undefined");
      }
      
      const orderDetails = {
        orderNumber: createdOrder._id || orderNumber,
        orderDate,
        deliveryDate: deliveryDateFormatted,
        items: cart,
        subtotal,
        shippingCost,
        tax,
        discount,
        total: totalPrice,
        shippingInfo: customer,
        paymentMethod,
        status: 'processing'
      };

      setOrderDetails(orderDetails);
      setOrderProgress('placed');
      
      // Save the order to the user's order history if user is logged in
      if (currentUser) {
        addOrder({
          items: [...cart], // Create a copy of cart items
          total: totalPrice,
          orderNumber: createdOrder._id || orderNumber,
          date: new Date().toISOString(),
          status: 'processing'
        });
      }
      
      // Clear the cart completely
      clearCart();
      
      setCurrentStep("confirmation");
      
      // Simulate order progress updates
      setTimeout(() => {
        setOrderProgress('processing');
        
        // Simulate shipping after 5 seconds in production this would be updated through an API call
        setTimeout(() => {
          setOrderProgress('shipped');
        }, 5000);
      }, 3000);
    } catch (error) {
      console.error("Error creating order:", error);
      
      // Check for specific error types
      if (error.response) {
        console.error("Server response error:", error.response.data);
        alert(`Server error: ${error.response.data.message || 'Unknown server error'}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("No response received from the server. Please check your connection and try again.");
      } else {
        alert(`Error placing order: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep === "information") {
      // Validate information form
      if (!customer.firstName || !customer.lastName || !customer.email || 
          !customer.phone || !customer.address || !customer.city || 
          !customer.state || !customer.zip) {
        alert("Please fill in all required fields");
        return;
      }
      setCurrentStep("payment");
    } else if (currentStep === "payment") {
      // Check if user is logged in before placing order
      if (!currentUser) {
        // Redirect to login page with a return URL parameter
        navigate('/login?redirect=checkout');
        return;
      }
      handleOrderSubmit();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("information");
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Handle card number input
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setPaymentDetails({ ...paymentDetails, cardNumber: formattedValue });
    
    // Detect card type based on first digits
    const cardNumber = formattedValue.replace(/\s/g, '');
    if (cardNumber.startsWith('4')) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(cardNumber)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(cardNumber)) {
      setCardType('amex');
    } else if (/^6(?:011|5)/.test(cardNumber)) {
      setCardType('discover');
    } else {
      setCardType('');
    }
  };

  // Format expiry date
  const handleExpiryChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    
    setPaymentDetails({ ...paymentDetails, expiry: value });
  };

  // Format CVV to only allow numbers
  const handleCVVChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPaymentDetails({ ...paymentDetails, cvv: value });
  };

  // Set card focus
  const handleCardFocus = (field) => {
    setCardFocus(field);
    if (field === 'cvv') {
      setFlippedCard(true);
    } else {
      setFlippedCard(false);
    }
  };

  // Get product image source
  const getProductImage = (product) => {
    // Use the direct API image URL if available
    if (product.image) {
      // If image is a relative path, add API URL prefix
      if (!product.image.startsWith('http') && !product.image.startsWith('/')) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${apiUrl}/${product.image}`;
      }
      return product.image;
    }
    
    // Try to get image from product reference if available
    if (product.product && product.product.image) {
      return product.product.image;
    }
    
    // Fallback to local images if available
    if (product.localImage) {
      return product.localImage;
    }
    
    // Last resort fallback - use placeholder
    return '/placeholder.png';
  };

  return (
    <>
      <Header />
      <main className="checkout-container">
        <div className="checkout-header">
          <h1>Secure Checkout</h1>
          {cart.length > 0 && <span className="items-count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>}
        </div>

        {/* Login Notification */}
        {!currentUser && (
          <div className="login-notification">
            <i className="fas fa-info-circle"></i>
            <p>
              <strong>Login required to complete checkout.</strong> You must be logged in to place an order.{" "}
              <a href="/login?redirect=checkout">Login</a> or <a href="/signup?redirect=checkout">Sign Up</a> to continue.
            </p>
          </div>
        )}

        {/* Checkout Steps */}
        <div className="checkout-steps">
          <div className={`step ${currentStep === "information" ? "active" : currentStep === "payment" || currentStep === "confirmation" ? "completed" : ""}`}>
            <div className="step-number">{currentStep === "payment" || currentStep === "confirmation" ? "✓" : "1"}</div>
            <div className="step-name">Information</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${currentStep === "payment" ? "active" : currentStep === "confirmation" ? "completed" : ""}`}>
            <div className="step-number">{currentStep === "confirmation" ? "✓" : "2"}</div>
            <div className="step-name">Payment</div>
          </div>
          <div className="step-divider" />
          <div className={`step ${currentStep === "confirmation" ? "active" : ""}`}>
            <div className="step-number">3</div>
            <div className="step-name">Confirmation</div>
          </div>
        </div>

        <div className="checkout-content">
          {/* Left Column - Customer & Payment Info */}
          <div className="checkout-form-section">
            {currentStep === "information" && (
              <div className="checkout-form-container">
                <h2>Shipping Information</h2>
                <form>
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name <span className="required">*</span></label>
                      <input type="text" name="firstName" value={customer.firstName} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Last Name <span className="required">*</span></label>
                      <input type="text" name="lastName" value={customer.lastName} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email <span className="required">*</span></label>
                    <input type="email" name="email" value={customer.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Phone <span className="required">*</span></label>
                    <input type="tel" name="phone" value={customer.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Address <span className="required">*</span></label>
                    <input type="text" name="address" value={customer.address} onChange={handleInputChange} required />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City <span className="required">*</span></label>
                      <input type="text" name="city" value={customer.city} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>State <span className="required">*</span></label>
                      <input type="text" name="state" value={customer.state} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Zip Code <span className="required">*</span></label>
                      <input type="text" name="zip" value={customer.zip} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Country <span className="required">*</span></label>
                      <select name="country" value={customer.country} onChange={handleInputChange} required>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                        <option value="IND">India</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group shipping-options">
                    <label>Shipping Method <span className="required">*</span></label>
                    <div className="shipping-option">
                      <input type="radio" id="standard" name="shipping" value="standard" checked={shippingMethod === "standard"} onChange={handleShippingChange} />
                      <label htmlFor="standard">
                        <div className="shipping-option-content">
                          <div className="shipping-name">Standard Shipping</div>
                          <div className="shipping-price">FREE</div>
                          <div className="shipping-time">5-7 business days</div>
                        </div>
                      </label>
                    </div>
                    <div className="shipping-option">
                      <input type="radio" id="express" name="shipping" value="express" checked={shippingMethod === "express"} onChange={handleShippingChange} />
                      <label htmlFor="express">
                        <div className="shipping-option-content">
                          <div className="shipping-name">Express Shipping</div>
                          <div className="shipping-price">$9.99</div>
                          <div className="shipping-time">2-3 business days</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <button type="button" className="btn-continue checkout-btn" onClick={handleNextStep}>Continue to Payment</button>
                </form>
              </div>
            )}
            {currentStep === "payment" && (
              <div className="checkout-form-container">
                <h2>Payment Method</h2>
                <form>
                  <div className="payment-methods">
                    <div className="payment-option">
                      <input type="radio" id="credit-card" name="paymentMethod" value="credit-card" checked={paymentMethod === "credit-card"} onChange={(e) => setPaymentMethod(e.target.value)} />
                      <label htmlFor="credit-card">
                        <span className="payment-name">Credit Card</span>
                        <span className="payment-icons">Visa / Mastercard / Amex</span>
                      </label>
                    </div>
                    <div className="payment-option">
                      <input type="radio" id="paypal" name="paymentMethod" value="paypal" checked={paymentMethod === "paypal"} onChange={(e) => setPaymentMethod(e.target.value)} />
                      <label htmlFor="paypal">
                        <span className="payment-name">PayPal</span>
                        <span className="payment-description">Pay with your PayPal account</span>
                      </label>
                    </div>
                  </div>
                  
                  {paymentMethod === "credit-card" && (
                    <>
                      <div className="credit-card-preview">
                        <div className={`card-wrapper ${flippedCard ? 'flipped' : ''}`}>
                          <div className="card-front">
                            <div className="card-logo">
                              {cardType && <span className={`card-type ${cardType}`}>{cardType}</span>}
                            </div>
                            <div className="card-number">
                              <span>{paymentDetails.cardNumber || '•••• •••• •••• ••••'}</span>
                            </div>
                            <div className="card-details">
                              <div className="card-holder">
                                <div className="label">Card Holder</div>
                                <div className="value">{paymentDetails.cardName || 'YOUR NAME'}</div>
                              </div>
                              <div className="card-expiry">
                                <div className="label">Expires</div>
                                <div className="value">{paymentDetails.expiry || 'MM/YY'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="card-back">
                            <div className="card-stripe"></div>
                            <div className="card-cvv">
                              <div className="cvv-label">CVV</div>
                              <div className="cvv-value">{paymentDetails.cvv || '•••'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="credit-card-form">
                        <div className="form-group">
                          <label>Card Number <span className="required">*</span></label>
                          <div className={`card-input ${cardFocus === 'cardNumber' ? 'focused' : ''}`}>
                            <i className="far fa-credit-card"></i>
                            {cardType && <span className={`detected-card-type ${cardType}`}></span>}
                            <input 
                              type="text" 
                              name="cardNumber" 
                              value={paymentDetails.cardNumber} 
                              onChange={handleCardNumberChange}
                              onFocus={() => handleCardFocus('cardNumber')}
                              onBlur={() => setCardFocus('')}
                              placeholder="0000 0000 0000 0000" 
                              maxLength="19"
                              required 
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Name on Card <span className="required">*</span></label>
                          <div className={`card-input ${cardFocus === 'cardName' ? 'focused' : ''}`}>
                            <i className="far fa-user"></i>
                            <input 
                              type="text" 
                              name="cardName" 
                              value={paymentDetails.cardName} 
                              onChange={handlePaymentInputChange}
                              onFocus={() => handleCardFocus('cardName')}
                              onBlur={() => setCardFocus('')}
                              placeholder="John Smith" 
                              required 
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label>Expiry Date <span className="required">*</span></label>
                            <div className={`card-input ${cardFocus === 'expiry' ? 'focused' : ''}`}>
                              <i className="far fa-calendar-alt"></i>
                              <input 
                                type="text" 
                                name="expiry" 
                                value={paymentDetails.expiry} 
                                onChange={handleExpiryChange}
                                onFocus={() => handleCardFocus('expiry')}
                                onBlur={() => setCardFocus('')}
                                placeholder="MM/YY" 
                                maxLength="5"
                                required 
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>CVV <span className="required">*</span></label>
                            <div className={`card-input ${cardFocus === 'cvv' ? 'focused' : ''}`}>
                              <i className="fas fa-lock"></i>
                              <input 
                                type="text" 
                                name="cvv" 
                                value={paymentDetails.cvv} 
                                onChange={handleCVVChange}
                                onFocus={() => handleCardFocus('cvv')}
                                onBlur={() => setCardFocus('')}
                                placeholder="000" 
                                maxLength="4"
                                required 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="checkout-buttons">
                    <button type="button" className="btn-back" onClick={handlePreviousStep}>Back</button>
                    <button type="button" className="btn-continue checkout-btn" onClick={handleNextStep}>Place Order</button>
                  </div>
                </form>
              </div>
            )}
            {currentStep === "confirmation" && (
              <div className="checkout-form-container">
                <div className="order-confirmation">
                  <div className="confirmation-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h2>Order Confirmed!</h2>
                  <p>Thank you for your purchase. Your order has been received and is being processed.</p>
                  
                  <div className="order-progress">
                    <div className="progress-bar">
                      <div className="progress-step completed">
                        <div className="step-icon"><i className="fas fa-check"></i></div>
                        <div className="step-label">Order Placed</div>
                        <div className="step-date">{new Date().toLocaleDateString()}</div>
                      </div>
                      <div className={`progress-line ${orderProgress !== 'placed' ? 'completed' : ''}`}></div>
                      <div className={`progress-step ${orderProgress !== 'placed' ? 'completed' : 'pending'}`}>
                        <div className="step-icon"><i className={orderProgress !== 'placed' ? "fas fa-check" : "fas fa-box"}></i></div>
                        <div className="step-label">Processing</div>
                        {orderProgress !== 'placed' && <div className="step-date">{new Date().toLocaleDateString()}</div>}
                      </div>
                      <div className={`progress-line ${orderProgress === 'shipped' ? 'completed' : ''}`}></div>
                      <div className={`progress-step ${orderProgress === 'shipped' ? 'completed' : ''}`}>
                        <div className="step-icon"><i className={orderProgress === 'shipped' ? "fas fa-check" : "fas fa-shipping-fast"}></i></div>
                        <div className="step-label">Shipped</div>
                        {orderProgress === 'shipped' && <div className="step-date">{new Date().toLocaleDateString()}</div>}
                      </div>
                      <div className="progress-line"></div>
                      <div className="progress-step">
                        <div className="step-icon"><i className="fas fa-home"></i></div>
                        <div className="step-label">Delivered</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="order-detail-item">
                      <span className="detail-label">Order Number:</span>
                      <span className="detail-value">{orderDetails?.orderNumber}</span>
                    </div>
                    <div className="order-detail-item">
                      <span className="detail-label">Order Date:</span>
                      <span className="detail-value">{orderDetails?.orderDate}</span>
                    </div>
                    <div className="order-detail-item">
                      <span className="detail-label">Estimated Delivery:</span>
                      <span className="detail-value">{orderDetails?.deliveryDate}</span>
                    </div>
                    <div className="order-detail-item">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">{orderDetails?.paymentMethod === 'credit-card' ? 'Credit Card' : 'PayPal'}</span>
                    </div>
                  </div>
                  
                  <div className="order-items-preview">
                    <h3>Order Items</h3>
                    <div className="items-preview-grid">
                      {orderDetails?.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="item-preview">
                          <img 
                            src={getProductImage(item)} 
                            alt={item.title} 
                            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                            onError={(e) => {
                              // Try a proxy service if the original image fails
                              if (!e.target.dataset.tried) {
                                e.target.dataset.tried = '1';
                                e.target.src = `https://wsrv.nl/?url=${encodeURIComponent(item.image)}&default=placeholder`;
                              } 
                              // If proxy fails, try another one
                              else if (e.target.dataset.tried === '1') {
                                e.target.dataset.tried = '2';
                                e.target.src = `https://images.weserv.nl/?url=${encodeURIComponent(item.image)}`;
                              }
                              // Last resort - category-based placeholder
                              else {
                                if (item.category?.includes('clothing')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Clothing';
                                } else if (item.category?.includes('jewelery') || item.category?.includes('jewelry')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Jewelry';
                                } else if (item.category?.includes('electronics')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Electronics';
                                } else {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                                }
                              }
                            }}
                          />
                          <div className="item-quantity">{item.quantity}</div>
                        </div>
                      ))}
                      {orderDetails?.items.length > 4 && (
                        <div className="item-preview more-items">
                          <span>+{orderDetails.items.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="confirmation-actions">
                    <button className="btn-continue" onClick={() => navigate('/')}>Continue Shopping</button>
                    {currentUser && (
                      <button className="btn-back" onClick={() => navigate('/orders')}>View Orders</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          {(currentStep === "information" || currentStep === "payment") && cart.length > 0 && (
            <div className="order-summary-section">
              <div className="order-summary">
                <div className="summary-header">
                  <h3>Order Summary</h3>
                  <button type="button" className="edit-cart-btn" onClick={() => navigate('/cart')}>Edit Cart</button>
                </div>
                <div className="summary-content">
                  <div className="summary-products">
                    {cart.map((item) => (
                      <div key={item.id} className="summary-product">
                        <div className="product-image">
                          <img 
                            src={getProductImage(item)} 
                            alt={item.title} 
                            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                            onError={(e) => {
                              // Try a proxy service if the original image fails
                              if (!e.target.dataset.tried) {
                                e.target.dataset.tried = '1';
                                e.target.src = `https://wsrv.nl/?url=${encodeURIComponent(item.image)}&default=placeholder`;
                              } 
                              // If proxy fails, try another one
                              else if (e.target.dataset.tried === '1') {
                                e.target.dataset.tried = '2';
                                e.target.src = `https://images.weserv.nl/?url=${encodeURIComponent(item.image)}`;
                              }
                              // Last resort - category-based placeholder
                              else {
                                if (item.category?.includes('clothing')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Clothing';
                                } else if (item.category?.includes('jewelery') || item.category?.includes('jewelry')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Jewelry';
                                } else if (item.category?.includes('electronics')) {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Electronics';
                                } else {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                                }
                              }
                            }}
                          />
                          <span className="product-quantity">{item.quantity}</span>
                        </div>
                        <div className="product-info">
                          <div className="product-name">{item.title}</div>
                          <div className="product-price">${item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!promoApplied && (
                    <div className="promo-code">
                      <div className="promo-form">
                        <input 
                          type="text" 
                          placeholder="Promo Code" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <button type="button" onClick={handlePromoCode}>Apply</button>
                      </div>
                      <p className="promo-hint">Try "WELCOME10" for 10% off</p>
                    </div>
                  )}
                  
                  <div className="order-totals">
                    <div className="order-total-row">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="order-total-row">
                      <span>Shipping</span>
                      <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="order-total-row">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="order-total-row discount">
                        <span>Discount</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="order-total-row total">
                      <span>Total</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="secure-checkout-info">
                    <span className="secure-checkout-icon"><i className="fas fa-lock"></i></span>
                    <p>Your payment information is securely processed. We do not store full card details.</p>
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

export default Checkout;