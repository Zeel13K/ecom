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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const tokenExpiration = localStorage.getItem("tokenExpiration");
        const authToken = localStorage.getItem("authToken");
        const rememberMe = localStorage.getItem("rememberMe") === "true";

        // Check if token is expired
        if (tokenExpiration && !isTokenExpired(parseInt(tokenExpiration))) {
          if (authToken) {
            const user = await getUserProfileApi();
            setCurrentUser(user.data);
            setIsAuthenticated(true);
            
            // Refresh token expiration
            const newExpiration = getTokenExpiration();
            localStorage.setItem("tokenExpiration", newExpiration.toString());
          }
        } else {
          // Token is expired, clear authentication if not remembering
          if (!rememberMe) {
            setCurrentUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem("authToken");
            localStorage.removeItem("tokenExpiration");
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        
        // Clean up invalid tokens
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("tokenExpiration");
          localStorage.removeItem("user");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Set up interval to check token expiration
    const checkTokenInterval = setInterval(() => {
      const tokenExpiration = localStorage.getItem("tokenExpiration");
      if (tokenExpiration && isTokenExpired(parseInt(tokenExpiration))) {
        loadUserData();
      }
    }, 60000); // Check every minute

    window.addEventListener("storage", loadUserData);
    return () => {
      window.removeEventListener("storage", loadUserData);
      clearInterval(checkTokenInterval);
    };
  }, []);

  const registerUser = async (userData, rememberMe = true) => {
    setAuthError(null);
    try {
      // Format data to match backend expectations
      const formattedData = {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email.trim().toLowerCase(),
        password: userData.password
      };
      
      const response = await registerUserApi(formattedData);
      const { token, ...user } = response.data;

      // Set token expiration
      const tokenExpiration = getTokenExpiration();
      localStorage.setItem("tokenExpiration", tokenExpiration.toString());
      localStorage.setItem("rememberMe", rememberMe.toString());
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("authToken", token);

      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      console.error("Error registering user:", error);
      
      let errorMessage = "Registration failed";
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const loginUser = async (email, password, rememberMe = true) => {
    setAuthError(null);
    try {
      // For development - handle direct login if in dev mode without backend
      if (process.env.NODE_ENV === 'development') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            
            if (user.email && 
                user.email.toLowerCase() === email.toLowerCase() && 
                (!user.password || user.password === password)) {
              
              console.log('DEV MODE: Bypassing API - logging in with localStorage user');
              
              const fakeToken = 'dev-mode-token-' + Date.now();
              const tokenExpiration = getTokenExpiration();
              
              const updatedUser = {
                ...user,
                password: password // Store password for dev use - NEVER do this in production!
              };
              
              localStorage.setItem('user', JSON.stringify(updatedUser));
              localStorage.setItem('authToken', fakeToken);
              localStorage.setItem('tokenExpiration', tokenExpiration.toString());
              localStorage.setItem('rememberMe', rememberMe.toString());
              
              setCurrentUser(updatedUser);
              setIsAuthenticated(true);
              return { success: true, user: updatedUser };
            }
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }
      
      // Proceed with API login if not in dev mode or user not found in localStorage
      const response = await loginUserApi({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      const { token, ...user } = response.data;

      // Set token expiration
      const tokenExpiration = getTokenExpiration();
      localStorage.setItem("tokenExpiration", tokenExpiration.toString());
      localStorage.setItem("rememberMe", rememberMe.toString());
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("authToken", token);

      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      console.error("Error logging in:", error);
      
      let errorMessage = "Invalid email or password";
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logoutUser = () => {
    try {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthError(null);

      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenExpiration");
      localStorage.removeItem("rememberMe");
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      return false;
    }
  };

  const updateUserProfile = async (updatedData) => {
    if (currentUser && isAuthenticated) {
      try {
        const response = await updateUserProfileApi(updatedData);
        const updatedUser = response.data;
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        return { success: true, user: updatedUser };
      } catch (error) {
        console.error("Error updating profile:", error);
        
        let errorMessage = "Failed to update profile";
        
        if (error.response && error.response.data) {
          errorMessage = error.response.data.message || errorMessage;
        }
        
        return { success: false, error: errorMessage };
      }
    }
    return { success: false, error: "Not authenticated" };
  };

  // Add order to user's order history
  const addOrder = (orderData) => {
    if (!currentUser) return false;
    
    try {
      // Get existing orders from localStorage or initialize empty array
      const existingOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      
      // Add new order to the array
      const updatedOrders = [orderData, ...existingOrders];
      
      // Save updated orders back to localStorage
      localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      
      // Update the user object with the order without replacing orders that might have been fetched from API
      const updatedUser = {
        ...currentUser,
        orders: currentUser.orders 
          ? [orderData, ...currentUser.orders] 
          : [orderData]
      };
      
      // Update state and localStorage
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error("Error adding order to history:", error);
      return false;
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
        addOrder,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
