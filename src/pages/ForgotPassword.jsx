import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { forgotPassword, resetPasswordDirect } from '../services/api';
import '../styles/Login.css';
import '../styles/Header.css';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const navigate = useNavigate();

  // For development - check if user exists in local storage
  useEffect(() => {
    if (isDevelopment) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData && userData.email) {
            console.log('Development mode: Found user in localStorage:', userData.email);
          }
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }
  }, []);

  const handleEmailChange = (e) => {
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
    setConfirmPassword(e.target.value);
  };

  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const togglePasswordVisibility = (fieldId) => {
    const passwordInput = document.getElementById(fieldId);
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    // Don't submit if already submitting
    if (isSubmitting) return;

    // Reset any previous messages
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email is required' });
      return;
    }

    if (!validateEmail(email.trim())) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      console.log(`Verifying email exists: ${email}`);
      
      // Development mode check for quick testing
      if (isDevelopment) {
        // Quick check for stored user email match in development
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
              console.log('Development mode: Email matches stored user, accepting');
              setEmailVerified(true);
              setMessage({ 
                type: 'success', 
                text: 'Email verified! Please enter your new password.' 
              });
              setIsSubmitting(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
            // Continue with normal API call
          }
        }
      }
      
      // Only verify if email exists in database
      const response = await forgotPassword(email.trim(), true);
      console.log('Email verification successful:', response);
      
      setEmailVerified(true);
      setMessage({ 
        type: 'success', 
        text: 'Email verified! Please enter your new password.' 
      });
    } catch (error) {
      console.error('Email verification failed:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      
      // Extract error message from response if available
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.log(`Server returned ${status}:`, responseData);
        
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (status === 400) {
          errorMessage = 'Invalid email address. Please check and try again.';
        } else if (status === 404) {
          errorMessage = 'Email not found. Please check your email address or create a new account.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Network error - no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        // Other error with a message
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Don't submit if already submitting
    if (isSubmitting) return;

    // Reset any previous messages
    setMessage({ type: '', text: '' });

    // Basic validation
    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    // Set submitting state
    setIsSubmitting(true);

    try {
      console.log(`Resetting password for: ${email}`);
      
      // Development mode: Update the user in localStorage if using the same email
      if (isDevelopment) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.email && userData.email.toLowerCase() === email.toLowerCase()) {
              console.log('Development mode: Updating user password in localStorage');
              // In a real app we'd encrypt the password, but this is just for development
              userData.password = password; 
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (e) {
            console.error('Error updating user in localStorage:', e);
          }
        }
      }
      
      // Reset password directly with email + new password
      const response = await resetPasswordDirect(email.trim(), password);
      console.log('Password reset successful:', response);
      
      setIsSuccess(true);
      setMessage({ 
        type: 'success', 
        text: 'Your password has been successfully reset!' 
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset failed:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again later.';
      
      // Extract error message from response if available
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.log(`Server returned ${status}:`, responseData);
        
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (status === 400) {
          errorMessage = 'Invalid request. Please check your password and try again.';
        } else if (status === 404) {
          errorMessage = 'Email not found. The account may no longer exist.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        // Network error - no response received
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message) {
        // Other error with a message
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Your Password</h1>
            <p>{emailVerified ? 'Enter your new password below.' : 'Enter your email address to reset your password.'}</p>
          </div>
          
          {isSuccess ? (
            <div className="success-container">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Password Reset Complete</h2>
              <p>Your password has been reset successfully.</p>
              <p>You will be redirected to the login page in a few seconds...</p>
              <div className="auth-footer">
                <p>
                  <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </div>
          ) : !emailVerified ? (
            <form id="verify-email-form" onSubmit={handleVerifyEmail}>
              {message.text && (
                <div className={`form-message ${message.type}`} id="forgot-password-message">
                  {message.text}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope" />
                  <input
                    type="email"
                    id="email"
                    className="input-padded"
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                </div>
                {email && !validateEmail(email) && (
                  <small className="input-error">Please enter a valid email address</small>
                )}
              </div>
              <button 
                type="submit" 
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Continue'}
              </button>
              <div className="auth-footer">
                <p>Remember your password? <Link to="/login">Login</Link></p>
              </div>
            </form>
          ) : (
            <form id="reset-password-form" onSubmit={handleResetPassword}>
              {message.text && (
                <div className={`form-message ${message.type}`} id="reset-password-message">
                  {message.text}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock" />
                  <input
                    type="password"
                    id="password"
                    className="input-padded"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    minLength="6"
                  />
                  <i
                    className="fas fa-eye toggle-password"
                    onClick={() => togglePasswordVisibility('password')}
                  />
                </div>
                {password && password.length < 6 && (
                  <small className="input-error">Password must be at least 6 characters long</small>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-with-icon">
                  <i className="fas fa-lock" />
                  <input
                    type="password"
                    id="confirmPassword"
                    className="input-padded"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    required
                  />
                  <i
                    className="fas fa-eye toggle-password"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <small className="input-error">Passwords do not match</small>
                )}
              </div>
              
              <button 
                type="submit" 
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
              
              <div className="auth-footer">
                <p>Remember your password? <Link to="/login">Login</Link></p>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
};

export default ForgotPassword; 