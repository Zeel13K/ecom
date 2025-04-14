import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { resetPassword, verifyResetToken } from '../services/api';
import '../styles/Login.css';
import '../styles/Header.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { token } = useParams();
  const navigate = useNavigate();

  // Validate and verify token exists
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'Invalid password reset link. Please request a new one.' 
        });
        setVerifying(false);
        setTokenVerified(false);
        return;
      }

      try {
        console.log('Checking reset token:', token);
        
        // Always assume the token might be valid even if verification fails
        // This allows systems without token verification endpoints to work
        setTokenVerified(true);
        
        // Try to verify with the API, but don't block the user if it fails
        try {
          const response = await verifyResetToken(token);
          console.log('Token verification response:', response);
          
          // If the API explicitly says the token is invalid, honor that
          if (response.data && response.data.valid === false) {
            console.log('Token explicitly marked as invalid by API');
            setTokenVerified(false);
            setMessage({ 
              type: 'error', 
              text: response.data.message || 'This password reset link is invalid or has expired.' 
            });
          }
        } catch (err) {
          console.warn('Token verification attempt failed, but we\'ll still allow reset:', err);
          // We continue with the reset process even if verification fails
          // The actual reset attempt will determine if the token is valid
        }
        
      } catch (error) {
        console.error('Token verification processing error:', error);
        // Don't mark token as invalid just because verification failed
        // Let the actual reset attempt determine validity
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

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

  const togglePasswordVisibility = (fieldId) => {
    const passwordInput = document.getElementById(fieldId);
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  };

  const handleSubmit = async (e) => {
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
      console.log('Submitting password reset for token:', token.substring(0, 8) + '...');
      
      const response = await resetPassword(token, password);
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
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Extract error message from response if available
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.log(`Server returned ${status}:`, responseData);
        
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (status === 400) {
          errorMessage = 'Invalid request. Please check your password and try again.';
        } else if (status === 401 || status === 403) {
          errorMessage = 'The reset token is invalid or has expired. Please request a new password reset link.';
        } else if (status === 404) {
          errorMessage = 'Reset endpoint not found. The system may be temporarily unavailable.';
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
            <p>Enter your new password below.</p>
          </div>
          
          {verifying ? (
            <div className="verifying-container">
              <div className="loading-spinner"></div>
              <p>Verifying your reset link...</p>
            </div>
          ) : isSuccess ? (
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
          ) : !tokenVerified ? (
            <div className="error-container">
              <div className="error-icon">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <h2>Invalid Reset Link</h2>
              <p>{message.text || 'The password reset link is invalid or has expired.'}</p>
              <div className="auth-footer">
                <p>
                  <Link to="/forgot-password">Request a new reset link</Link> or <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </div>
          ) : (
            <form id="reset-password-form" onSubmit={handleSubmit}>
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

export default ResetPassword; 