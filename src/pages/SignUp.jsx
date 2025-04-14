import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/SignUp.css';
import '../styles/Header.css';

// Simple header that doesn't rely on contexts
const SimpleHeader = () => {
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
          <div className="auth-buttons">
            <Link to="/login" className="login-btn">Login</Link>
            <Link to="/signup" className="signup-btn">Sign Up</Link>
          </div>
          <Link to="/cart" className="cart-button">
            🛒 Cart (0)
          </Link>
        </div>
      </nav>
    </header>
  );
};

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registerUser, authError, clearAuthError, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL
  const getRedirectUrl = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect || '/';
  };

  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    if (clearAuthError) clearAuthError();
    return () => {
      if (clearAuthError) clearAuthError();
    };
  }, [clearAuthError]);

  // Update message when authError changes
  useEffect(() => {
    if (authError) {
      setMessage({ type: 'error', text: authError });
      setIsSubmitting(false);
    }
  }, [authError]);

  // Redirect if authenticated after registration
  useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      navigate(redirectUrl);
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { id, value, checked, type } = e.target;
    // Clear error messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
    
    setFormData({
      ...formData,
      [id === 'first-name' ? 'firstName' : 
       id === 'last-name' ? 'lastName' : 
       id === 'confirm-password' ? 'confirmPassword' : id]: 
       type === 'checkbox' ? checked : value
    });
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters long and contain a letter and a number
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  };

  // Handle successful registration
  const handleRegistrationSuccess = (user, token) => {
    console.log('Registration successful, setting up authentication');
    
    // Ensure localStorage is properly set
    localStorage.setItem('token', token);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    
    // Show success message
    setMessage({ 
      type: 'success', 
      text: 'Registration successful! Redirecting to home page...' 
    });
    
    // Small delay for user to see success message
    setTimeout(() => {
      const redirectUrl = getRedirectUrl();
      navigate(redirectUrl);
    }, 1000);
  };
  
  // Debug helper function
  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('SignUp - Auth status:', { 
      hasToken: !!token, 
      isLoggedInFlag, 
      hasUserData: !!userData,
      userData: userData ? userData.email : null,
      isAuthenticated
    });
  };

  // Check auth status on component mount
  useEffect(() => {
    console.log('SignUp component mounted, checking auth status');
    checkAuthStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Don't submit if already submitting
    if (isSubmitting) return;
    
    // Reset any previous messages
    setMessage({ type: '', text: '' });

    // Validate name fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setMessage({ type: 'error', text: 'First and last name are required' });
      return;
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Validate password
    if (!validatePassword(formData.password)) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters long and include both letters and numbers' 
      });
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    // Check terms agreement
    if (!formData.terms) {
      setMessage({ type: 'error', text: 'You must agree to the terms and conditions' });
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`
      };

      console.log('Registering user with data:', { 
        email: userData.email, 
        name: userData.name
      });
      
      // Call the registerUser function from AuthContext
      const result = await registerUser(userData);
      
      console.log('Registration result:', result);
      
      if (result && result.success) {
        // Show success message
        setMessage({ 
          type: 'success', 
          text: 'Registration successful! Redirecting to home page...' 
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          const redirectUrl = getRedirectUrl();
          navigate(redirectUrl);
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Registration failed. Please try again.' 
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Registration failed. Please try again.' 
      });
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    const passwordInput = document.getElementById('password');
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  };

  return (
    <>
      <SimpleHeader />
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create an Account</h1>
            <p>Join our community and enjoy a personalized shopping experience</p>
          </div>
          <form id="signup-form" onSubmit={handleSubmit}>
            {message.text && (
              <div className={`auth-${message.type}`} id="signup-message">
                {message.text}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name">First Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user" />
                  <input
                    type="text"
                    id="first-name"
                    className="input-padded"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Enter first name"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="last-name">Last Name</label>
                <div className="input-with-icon">
                  <i className="fas fa-user" />
                  <input
                    type="text"
                    id="last-name"
                    className="input-padded"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  id="email"
                  className="input-padded"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              {formData.email && !validateEmail(formData.email) && (
                <small className="input-error">Please enter a valid email address</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  id="password"
                  className="input-padded"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  placeholder="Create a password"
                />
                <i
                  className="fas fa-eye toggle-password"
                  onClick={togglePasswordVisibility}
                />
              </div>
              {formData.password && !validatePassword(formData.password) && (
                <small className="input-error">
                  Password must be at least 8 characters long and include both letters and numbers
                </small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  id="confirm-password"
                  className="input-padded"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small className="input-error">Passwords do not match</small>
              )}
            </div>
            <div className="form-terms">
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={handleChange}
                required
              />
              <label htmlFor="terms">
                I agree to the <Link to="/terms">Terms & Conditions</Link>
              </label>
            </div>
            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            <div className="auth-links">
              <p>
                Already have an account?{' '}
                <Link to="/login">Sign In</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default SignUp;
