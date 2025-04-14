import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext"; 
import { useAuth } from "../context/AuthContext";
import "../styles/Header.css";

function Header({ cartCount }) {
  const { cart } = useCart();
  const { currentUser, logoutUser } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // If cartCount is provided directly, use it, otherwise calculate from cart context
  const cartItemCount = cartCount !== undefined 
    ? cartCount 
    : (cart && Array.isArray(cart) ? cart.reduce((total, item) => total + item.quantity, 0) : 0);

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    logoutUser();
    setShowProfileMenu(false);
  };

  return (
    <header className="main-container">
      <nav>
        <div className="logo">
          <Link to="/">
            <img src="/logo.png" alt="E-Store Logo" />
          </Link>
        </div>
        <div className="nav-links">
          <Link className="navlinkss" to="/">Home</Link>
          <Link className="navlinkss" to="/shop">Shop</Link>
          <Link className="navlinkss" to="/about">About</Link>
          <Link className="navlinkss" to="/contact">Contact</Link>
          
          {currentUser ? (
            <div className="profile-container">
              <div className="profile-icon" onClick={toggleProfileMenu}>
                <i className="fas fa-user-circle"></i>
                <span className="profile-name">
                  {currentUser.firstName}
                </span>
              </div>
              
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <span className="full-name">{currentUser.firstName} {currentUser.lastName}</span>
                    <span className="email">{currentUser.email}</span>
                  </div>
                  <div className="profile-menu-items">
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                      <i className="fas fa-user"></i> My Profile
                    </Link>
                    <Link to="/orders" onClick={() => setShowProfileMenu(false)}>
                      <i className="fas fa-shopping-bag"></i> My Orders
                    </Link>
                    <button onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/signup" className="signup-btn">Sign Up</Link>
            </div>
          )}
          
          <Link to="/cart" className="cart-button">
            🛒 Cart ({cartItemCount})
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;
