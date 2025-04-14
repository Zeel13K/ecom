import axios from 'axios';

// Check which environment we're in and set the appropriate URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-api.com/api' 
  : 'http://localhost:5000/api';

console.log('API URL set to:', API_URL);

// Add a development fallback if the API is not responding
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add the auth token to requests
api.interceptors.request.use(
  config => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Check if the request is to an admin endpoint
    const isAdminEndpoint = config.url.includes('/admin') || 
                           (config.url.includes('/orders') && config.method !== 'post');
    
    // For admin endpoints, check both admin token and user.isAdmin
    if (isAdminEndpoint) {
      if (adminToken && user.isAdmin) {
        console.log('Adding admin token to request');
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // For user endpoints, first try user token, then fall back to admin token if user is admin
      if (userToken) {
        console.log('Adding user token to request');
        config.headers.Authorization = `Bearer ${userToken}`;
      } else if (user.isAdmin && adminToken) {
        console.log('Adding admin token for admin user');
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config.url
      });
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Clear all auth tokens
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        
        // Redirect to appropriate login page
        const isAdminEndpoint = error.config.url.includes('/admin');
        window.location.href = isAdminEndpoint ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Debug helper to check if token exists
const checkAuthToken = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    console.log('Auth token exists:', token.substring(0, 15) + '...');
    return true;
  } else {
    console.log('No auth token found');
    return false;
  }
};

// User API functions
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    
    if (response.data && response.data.token) {
      // Store user data and token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    console.log('Attempting login with credentials:', { email: credentials.email });
    
    // For development mode - allow test user login
    if (process.env.NODE_ENV === 'development' && 
        credentials.email === 'test@example.com' && 
        credentials.password === 'test123') {
      console.log('DEV MODE: Using test user login');
      
      const testUserData = {
        _id: 'test-user-id',
        name: 'Test User',
        email: credentials.email,
        isAdmin: false,
        token: 'test-token-' + Date.now()
      };
      
      // Store test user data
      localStorage.setItem('token', testUserData.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(testUserData));
      
      return {
        data: {
          success: true,
          token: testUserData.token,
          user: testUserData
        }
      };
    }
    
    // Make the actual API call
    const response = await api.post('/users/login', credentials);
    
    if (response.data && response.data.token) {
      // Store user data and token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // If user is admin, also set admin token
      if (response.data.user.isAdmin) {
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminEmail', response.data.user.email);
      }
      
      console.log('Login successful:', {
        isAdmin: response.data.user.isAdmin,
        email: response.data.user.email
      });
    } else {
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid response from server');
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error.response || error);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response.status === 404) {
        throw new Error('User not found');
      }
    }
    
    throw error;
  }
};

export const getUserProfile = () => api.get('/users/profile');
export const updateUserProfile = (userData) => api.put('/users/profile', userData);
export const forgotPassword = (email, verifyOnly = false) => {
  console.log(`${verifyOnly ? 'Verifying email' : 'Sending forgot password request for email'}: ${email}`);
  
  // For development/testing - allow bypass of API call if backend isn't fully set up
  // REMOVE THIS IN PRODUCTION - THIS IS JUST FOR TESTING
  if (process.env.NODE_ENV === 'development' && verifyOnly) {
    console.log('DEVELOPMENT MODE: Bypassing actual API call for email verification');
    // Simulate some registered emails for testing
    const testEmails = ['test@example.com', 'admin@example.com', 'user@example.com'];
    
    // Check if entered email is in test list
    if (testEmails.includes(email.toLowerCase()) || localStorage.getItem('user')) {
      console.log('Email found in test data, returning success');
      // Return a resolved promise to simulate a successful API response
      return Promise.resolve({
        data: {
          success: true,
          message: 'Email verified successfully'
        }
      });
    } else {
      console.log('Email not found in test data, returning 404');
      // Return a rejected promise to simulate a 404 API response
      return Promise.reject({
        response: {
          status: 404,
          data: {
            success: false,
            message: 'No user found with that email address'
          }
        }
      });
    }
  }
  
  // Real API call
  return api.post('/users/forgot-password', { email, verifyOnly })
    .then(response => {
      console.log('Forgot password response:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Error in forgotPassword API call:', error);
      throw error;
    });
};
export const resetPassword = (token, password) => {
  console.log(`Attempting to reset password with token: ${token.substring(0, 8)}...`);
  
  // Try multiple endpoint formats in sequence
  return api.post(`/users/reset-password/${token}`, { password })
    .catch(error => {
      if (error.response && error.response.status === 404) {
        console.log('Standard reset endpoint not found, trying alternative format...');
        return api.post('/users/reset-password', { token, password });
      }
      
      if (error.response && error.response.status === 404) {
        console.log('Alternative format also failed, trying simpler format...');
        return api.post('/users/reset', { token, password });
      }
      
      throw error;
    });
};
export const verifyResetToken = (token) => {
  console.log(`Verifying token: ${token.substring(0, 8)}...`);
  
  // Try multiple endpoint formats in sequence
  return api.get(`/users/reset-password/${token}/verify`)
    .catch(error => {
      if (error.response && error.response.status === 404) {
        console.log('Verification endpoint not found, trying alternative format...');
        return api.get(`/users/verify-token/${token}`);
      }
      
      if (error.response && error.response.status === 404) {
        console.log('Alternative format failed, trying POST format...');
        return api.post('/users/verify-token', { token });
      }
      
      // If both fail but we're getting a 401 or 403, it means the token is invalid
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return { data: { valid: false, message: 'Token is invalid or expired' } };
      }
      
      // If we're getting a 404 after trying all endpoints, the backend probably doesn't 
      // support token verification, so we'll assume it's valid and let the reset handle it
      if (error.response && error.response.status === 404) {
        console.log('No verification endpoint found, assuming token is valid for now...');
        return { data: { valid: true, message: 'Assuming valid token' } };
      }
      
      throw error;
    });
};

export const resetPasswordDirect = (email, password) => {
  console.log(`Attempting to reset password directly for email: ${email}`);
  
  // For development/testing - allow bypass of API call if backend isn't fully set up
  // REMOVE THIS IN PRODUCTION - THIS IS JUST FOR TESTING
  if (process.env.NODE_ENV === 'development') {
    console.log('DEVELOPMENT MODE: Bypassing actual API call for password reset');
    
    // Simulate successful password reset
    return Promise.resolve({
      data: {
        success: true,
        message: 'Password has been reset successfully'
      }
    });
  }
  
  // Real API call - try multiple endpoint formats in sequence
  return api.post('/users/reset-password-direct', { email, password })
    .catch(error => {
      if (error.response && error.response.status === 404) {
        console.log('Direct reset endpoint not found, trying alternative format...');
        return api.post('/users/reset-direct', { email, password });
      }
      
      throw error;
    });
};

// Admin API functions
export const getAllUsers = () => api.get('/users');
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getContactMessages = () => api.get('/contact');
export const updateContactMessage = (id, data) => api.put(`/contact/${id}`, data);
export const deleteContactMessage = (id) => api.delete(`/contact/${id}`);

// Contact API functions
export const submitContactForm = (formData) => {
  console.log('Submitting contact form data:', formData);
  
  // For development/testing - allow bypass of API call if backend isn't fully set up
  // REMOVE THIS IN PRODUCTION - THIS IS JUST FOR TESTING
  if (process.env.NODE_ENV === 'development') {
    console.log('DEVELOPMENT MODE: Bypassing actual API call for contact form submission');
    
    // Save to localStorage for development testing
    try {
      const existingMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      const newMessage = { ...formData, id: Date.now().toString(), status: 'new' };
      localStorage.setItem('contactMessages', JSON.stringify([newMessage, ...existingMessages]));
      console.log('Contact message saved to localStorage:', newMessage);
    } catch (e) {
      console.error('Error saving contact message to localStorage:', e);
    }
    
    // Simulate successful submission
    return Promise.resolve({
      data: {
        success: true,
        message: 'Your message has been submitted successfully',
        id: Date.now().toString()
      }
    });
  }
  
  // Real API call
  return api.post('/contact', formData);
};

// Product API functions
export const getProducts = async () => {
  try {
    const response = await api.get('/products');
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    // For development, return mock data if API fails
    if (process.env.NODE_ENV === 'development') {
      return {
        data: [
          // ... your mock products data ...
        ]
      };
    }
    throw error;
  }
};
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post('/products', productData);
export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Add development mode fallback for orders
const getOrdersFromLocalStorage = () => {
  try {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    return {
      data: {
        orders,
        page: 1,
        pages: 1,
        total: orders.length
      }
    };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { data: { orders: [], page: 1, pages: 1, total: 0 } };
  }
};

// Update the getOrders function
export const getOrders = async ({ page = 1, status = '' } = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (status) queryParams.append('status', status);
    queryParams.append('_t', Date.now());
    
    console.log('Fetching orders with params:', Object.fromEntries(queryParams));
    
    try {
      const response = await api.get(`/admin/orders?${queryParams.toString()}`);
      if (response?.data?.orders) {
        return {
          data: {
            orders: response.data.orders,
            page: response.data.page || page,
            pages: response.data.pages || 1,
            total: response.data.total || response.data.orders.length
          }
        };
      }
    } catch (apiError) {
      console.warn('API call failed, falling back to localStorage in development:', apiError);
      if (process.env.NODE_ENV === 'development') {
        return getOrdersFromLocalStorage();
      }
      throw apiError;
    }
    
    throw new Error('No data received from server');
  } catch (error) {
    console.error('Error in getOrders:', error);
    throw error;
  }
};

export const getMyOrders = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to view orders');
    }
    
    const response = await api.get('/orders/myorders');
    return response;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = async (orderData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please log in to place an order');
    }
    
    const response = await api.post('/orders', orderData);
    return response;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
export const updateOrderToPaid = (id, paymentResult) => api.put(`/orders/${id}/pay`, paymentResult);
export const updateOrderStatus = async (id, status) => {
  try {
    // Validate status before making the request
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error('Invalid status value');
    }

    const response = await api.put(`/orders/${id}/status`, { status: status.toLowerCase() });
    
    // For development mode - allow fallback to localStorage
    if (process.env.NODE_ENV === 'development' && !response.data.success) {
      console.log('API update failed, falling back to localStorage');
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (userData.orders) {
        // Update the order status and add timestamp
        const updatedOrders = userData.orders.map(order => {
          if (order.id === id || order._id === id) {
            return { 
              ...order, 
              status: status.toLowerCase(),
              statusUpdatedAt: new Date().toISOString(),
              statusHistory: [
                ...(order.statusHistory || []),
                {
                  status: status.toLowerCase(),
                  timestamp: new Date().toISOString()
                }
              ]
            };
          }
          return order;
        });
        
        // Update localStorage
        const updatedUserData = { ...userData, orders: updatedOrders };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        
        return {
          data: {
            success: true,
            message: 'Order status updated in localStorage',
            order: updatedOrders.find(o => o.id === id || o._id === id)
          }
        };
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export default api;
