import { createContext, useState, useContext, useEffect } from "react";
import { registerUser as registerUserApi, loginUser as loginUserApi, getUserProfile as getUserProfileApi, updateUserProfile as updateUserProfileApi } from '../services/api';

const AuthContext = createContext();

// Helper function to get token expiration
const getTokenExpiration = () => {
  const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return new Date(Date.now() + expiresIn).getTime();
};

// Helper function to check if token is expired
const isTokenExpired = (expiration) => {
  if (!expiration) return true;
  return Date.now() > expiration;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Load user data from localStorage on initial render
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const userData = JSON.parse(localStorage.getItem("user") || "null");

        console.log('AuthContext - Loading user data:', { 
          hasToken: !!token, 
          isLoggedIn, 
          user: userData?._id
        });

        if (token && isLoggedIn && userData) {
          console.log('Setting user as authenticated:', userData.email);
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } else {
          console.log('No valid authentication found, clearing auth state');
          // Clear any existing auth data
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem("token");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setAuthError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const registerUser = async (userData) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('Registering user with data:', { 
        email: userData.email, 
        firstName: userData.firstName, 
        lastName: userData.lastName 
      });
      
      // Make sure the userData has the expected format for the backend
      const formattedUserData = {
        name: userData.name || `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password
      };
      
      console.log('Sending API request to register user...');
      const response = await registerUserApi(formattedUserData);
      
      console.log('Registration API response:', response?.status, response?.data);
      
      if (response && response.data) {
        // Extract user and token data from response
        const user = response.data;
        const token = response.data.token;
        
        if (!token) {
          console.error('No token received in registration response');
          throw new Error('Invalid response: No authentication token received');
        }
        
        // Update state with user data
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Ensure localStorage is properly set
        localStorage.setItem('token', token);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('Registration successful, user authenticated:', { email: user.email });
        return { success: true, user, token };
      } else {
        console.error('Invalid registration response:', response);
        throw new Error('Invalid response from server during registration');
      }
    } catch (error) {
      console.error("Registration error:", error);
      
      // Add detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Set auth error based on response
      const errorMessage = error.response?.data?.message || 
                          'Registration failed. Please try again.';
      setAuthError(errorMessage);
      
      // Clean up any partial data
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('Logging in user:', { email });
      
      // First, clear any existing auth data
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      
      const credentials = { email, password };
      const response = await loginUserApi(credentials);
      
      console.log('Login API response:', response);
      
      if (response && response.data) {
        // Extract token and user data
        const user = response.data;
        const token = response.data.token;
        
        // Update state with user data
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        console.log('Login successful, user authenticated:', { email: user.email });
        return { success: true, user, token };
      } else {
        console.error('Invalid login response:', response);
        throw new Error('Invalid response from server during login');
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Set auth error based on response
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials and try again.';
      setAuthError(errorMessage);
      
      // Clean up any partial data
      localStorage.removeItem("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("user");
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    
    // Update state
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    
    console.log('User logged out successfully');
  };

  const updateUserProfile = async (updatedData) => {
    if (!isAuthenticated || !currentUser) {
      return { success: false, error: "Not authenticated" };
    }
    
    try {
      setLoading(true);
      const response = await updateUserProfileApi(updatedData);
      
      if (response && response.data) {
        const updatedUser = response.data;
        
        // Update user data in localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Update state
        setCurrentUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      const errorMessage = error.response?.data?.message || 
                         'Failed to update profile. Please try again.';
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated,
        authError,
        registerUser,
        loginUser,
        logoutUser,
        updateUserProfile,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
