import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/SignUp.css';
import '../styles/Header.css';

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
  const { registerUser, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  // Update message when authError changes
  useEffect(() => {
    if (authError) {
      setMessage({ type: 'error', text: authError });
    }
  }, [authError]);

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

  const getRedirectUrl = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    return redirect || '/';
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters long and contain a letter and a number
    return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
  };

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
      const result = await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Registration successful! Redirecting to login...' });
        const redirectUrl = getRedirectUrl();
        setTimeout(() => navigate(`/login?redirect=${redirectUrl}`), 1500);
      } else {
        setMessage({ type: 'error', text: result.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again later.' });
      console.error('Registration error:', error);
    } finally {
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
      <Header />
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Your Account</h1>
            <p>Join our community and enjoy personalized shopping experiences.</p>
          </div>
          <form id="signup-form" onSubmit={handleSubmit}>
            {message.text && (
              <div className={`form-message ${message.type}`} id="signup-message">
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
                I agree to the <Link to="#">Terms of Service</Link> and <Link to="#">Privacy Policy</Link>
              </label>
            </div>
            <button 
              type="submit" 
              className="auth-submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
            <div className="auth-footer">
              <p>Already have an account? <Link to="/login">Login</Link></p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default SignUp;
