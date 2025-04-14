import axios from 'axios';

// Check environment variables first, fallback to hardcoded values
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    // Get tokens from localStorage
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    // Try to get user data from localStorage
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    
    // Determine if this is an admin endpoint or special handling needed
    // Admin endpoints are those in the /admin path or GET requests to /orders
    // POST to /orders is a user endpoint for creating orders
    const isAdminEndpoint = config.url && (
      config.url.includes('/admin') || 
      (config.url.includes('/orders') && config.method !== 'post')
    );
    
    // Log the request and authentication status
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      isAdminEndpoint,
      hasToken: !!token,
      hasAdminToken: !!adminToken,
      isUserAdmin: user?.isAdmin
    });
    
    // For admin endpoints, check if user is admin
    if (isAdminEndpoint) {
      if (user?.isAdmin && (adminToken || token)) {
        console.log('Adding admin authorization to request');
        config.headers.Authorization = `Bearer ${adminToken || token}`;
      }
    } else if (token) {
      // For user endpoints including creating orders, add user token
      console.log('Adding user authorization to request');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No authentication token available for request:', config.url);
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
        url: error.config?.url
      });
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Clear all auth tokens
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('user');
        
        // Redirect to appropriate login page
        const isAdminEndpoint = error.config?.url?.includes('/admin');
        window.location.href = isAdminEndpoint ? '/admin/login' : '/login';
      }
    } else {
      console.error('API Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Development fallback helpers
const isDevelopment = process.env.NODE_ENV === 'development';

// In development mode, provide test users
const testUsers = isDevelopment ? [
  {
    _id: 'test-user-1',
    email: 'user@example.com',
    password: 'password123',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    isAdmin: false
  },
  {
    _id: 'test-admin-1',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Test Admin',
    firstName: 'Test',
    lastName: 'Admin',
    isAdmin: true
  }
] : [];

// Development Helper for debugging registered users
const checkRegisteredUsers = () => {
  if (isDevelopment) {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      if (registeredUsers.length === 0) {
        console.log('No registered users found in localStorage');
        return;
      }
      
      console.log(`Found ${registeredUsers.length} registered users in localStorage:`);
      registeredUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name || user.firstName + ' ' + user.lastName})`);
      });
    } catch (error) {
      console.error('Error checking registered users:', error);
    }
  }
};

// Execute during initialization in development mode
if (isDevelopment) {
  // Log the test users available
  console.log('Test users available for development:', testUsers.map(u => ({
    email: u.email,
    password: u.password,
    isAdmin: u.isAdmin
  })));
  
  // Check registered users
  checkRegisteredUsers();
}

// User API functions
export const registerUser = async (userData) => {
  try {
    console.log('Registering user with data:', { 
      email: userData.email, 
      name: userData.name || `${userData.firstName} ${userData.lastName}`
    });
    
    // Prepare user data in expected format for backend
    const userToRegister = {
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      password: userData.password
    };
    
    // Make the real API call
    const response = await api.post('/users', userToRegister);
    
    // Check if response is valid
    if (response?.data?.token) {
      console.log('Registration successful, setting auth data');
      
      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    console.log('Attempting login with:', { email: credentials.email });
    
    // Make the API call 
    const response = await api.post('/users/login', credentials);
    
    // Check if response contains token and user data
    if (response?.data?.token) {
      console.log('Login successful, setting auth data');
      
      // Store auth data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error.response || error);
    throw error;
  }
};

export const getUserProfile = async () => {
  if (isDevelopment) {
    // In dev mode, return user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      return { data: JSON.parse(user) };
    }
    return Promise.reject({
      response: { status: 401, data: { message: 'Not authenticated' } }
    });
  }
  return api.get('/users/profile');
};

export const getMyOrders = async () => {
  try {
    console.log('Fetching user orders...');
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('Authentication status:', { 
      hasToken: !!token, 
      hasUser: !!user,
      userId: user?._id
    });
    
    if (!token || !user) {
      console.error('No authentication data available for fetching orders');
      throw new Error('Authentication required to fetch orders');
    }
    
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    
    // Try to fetch from the real API
    try {
      const url = `/orders/myorders?_t=${timestamp}`;
      console.log(`Making API request to ${url}`);
      
      const response = await api.get(url);
      console.log('Orders API response:', response);
      return response;
    } catch (apiError) {
      console.error('Error fetching user orders from API:', apiError);
      
      // In development mode, provide fallback to localStorage
      if (process.env.NODE_ENV === 'development') {
        console.log('Using development fallback for orders');
        
        // Get user orders from localStorage
        try {
          const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
          
          // Ensure we have a valid user ID
          if (!user._id) {
            console.warn('No user ID found in localStorage');
            return { data: [] };
          }
          
          // Filter orders by user ID
          const userOrders = allOrders.filter(order => order.user === user._id);
          console.log(`Found ${userOrders.length} orders for user in localStorage:`, userOrders);
          
          // If no orders found and this is development, create some test orders
          if (userOrders.length === 0) {
            console.log('No orders found for user, creating test orders in development mode');
            const testOrders = Array(3).fill().map((_, i) => ({
              _id: `mock-order-${Date.now()}-${i}`,
              user: user._id,
              orderItems: [
                {
                  name: 'Wireless Headphones',
                  quantity: 1,
                  image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
                  price: 99.99,
                  product: 'mock-1'
                },
                {
                  name: 'Smart Watch',
                  quantity: 2,
                  image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg',
                  price: 199.99,
                  product: 'mock-2'
                }
              ],
              shippingAddress: {
                address: '123 Main St',
                city: 'Anytown',
                postalCode: '12345',
                country: 'USA'
              },
              paymentMethod: 'Credit Card',
              paymentResult: {
                id: `pay-${Date.now()}-${i}`,
                status: 'completed',
                update_time: new Date().toISOString(),
                email_address: user.email
              },
              taxPrice: 30.00,
              shippingPrice: 10.00,
              totalPrice: 509.98,
              isPaid: true,
              paidAt: new Date().toISOString(),
              status: ['processing', 'shipped', 'delivered'][i % 3],
              createdAt: new Date(Date.now() - i * 86400000).toISOString(),
              updatedAt: new Date().toISOString()
            }));
            
            // Save the test orders to localStorage
            const allOrdersUpdated = [...testOrders, ...allOrders];
            localStorage.setItem('orders', JSON.stringify(allOrdersUpdated));
            
            console.log('Created test orders for development:', testOrders);
            return { data: testOrders };
          }
          
          return { data: userOrders };
        } catch (storageError) {
          console.error('Error reading from localStorage:', storageError);
          throw new Error('Failed to load orders from storage: ' + storageError.message);
        }
      }
      
      // In production, just throw the error
      throw apiError;
    }
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    throw error;
  }
};

// Export all the other functions
export const updateUserProfile = (userData) => api.put('/users/profile', userData);

// Admin login function 
export const adminLogin = async (credentials) => {
  try {
    console.log('Attempting admin login with:', { email: credentials.email });
    
    // For development mode - simulate admin login
    if (isDevelopment) {
      console.log('DEV MODE: Simulating admin login');
      
      // Find admin user in test data
      const adminUser = testUsers.find(u => 
        u.email === credentials.email && 
        u.password === credentials.password &&
        u.isAdmin === true
      );
      
      console.log('Admin user found:', adminUser ? 'Yes' : 'No');
      
      if (adminUser) {
        // Generate admin token with prefix for easy identification
        const adminToken = 'dev-admin-token-' + Date.now();
        
        // Create user object without password
        const safeUser = { ...adminUser };
        delete safeUser.password;
        
        console.log('DEV MODE: Creating admin session with token:', adminToken.substring(0, 15) + '...');
        
        // For development, manually set localStorage items
        localStorage.setItem('user', JSON.stringify(safeUser));
        localStorage.setItem('adminToken', adminToken);
        localStorage.setItem('token', adminToken); // Also set as regular token for API interceptors
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('adminLoggedIn', 'true');
        
        // Return simulated response
        return {
          data: {
            success: true,
            token: adminToken,
            user: safeUser
          }
        };
      } else {
        // For debugging, show all available test users
        console.log('Available test users:', testUsers.map(u => ({ 
          email: u.email, 
          password: u.password, 
          isAdmin: u.isAdmin 
        })));
        
        // Simulate authentication failure
        return Promise.reject({
          response: {
            status: 401,
            data: { message: 'Invalid admin credentials or not authorized as admin' }
          }
        });
      }
    }
    
    // For production, use the same endpoint but store token differently
    const response = await api.post('/users/login', credentials);
    
    // Verify the user is admin
    if (response?.data?.user?.isAdmin) {
      console.log('Admin login successful:', response.data);
      
      // Store the token as adminToken and set adminLoggedIn flag
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('token', response.data.token); // Also set as regular token
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return response;
    } else {
      // User is not an admin
      console.error('User is not an admin:', response.data.user);
      
      return Promise.reject({
        response: {
          status: 403,
          data: { message: 'User is not authorized as admin' }
        }
      });
    }
  } catch (error) {
    console.error('Admin login error:', error.response || error);
    throw error;
  }
};

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
    // Try FakeStore API first
    console.log('Fetching products from FakeStore API...');
    try {
      const fakeStoreResponse = await axios.get('https://fakestoreapi.com/products');
      console.log('FakeStore API Response:', fakeStoreResponse);
      
      if (fakeStoreResponse.data && Array.isArray(fakeStoreResponse.data)) {
        // Transform FakeStore API data to match our expected format
        const transformedProducts = fakeStoreResponse.data.map(product => ({
          _id: product.id.toString(),
          name: product.title,
          title: product.title,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.image
        }));
        
        return { data: transformedProducts };
      }
    } catch (fakeStoreError) {
      console.error('FakeStore API failed, falling back to backend:', fakeStoreError);
    }
    
    // Fallback to our backend API
    try {
      const response = await api.get('/products');
      return response;
    } catch (backendError) {
      console.error('Backend API failed, using mock data:', backendError);
      throw backendError;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    // For development, return mock data if all APIs fail
    if (process.env.NODE_ENV === 'development') {
      return {
        data: [
          {
            _id: 'mock-1',
            name: 'Wireless Headphones',
            title: 'Wireless Headphones',
            price: 99.99,
            category: 'electronics',
            description: 'High-quality wireless headphones with noise cancellation',
            image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg'
          },
          {
            _id: 'mock-2',
            name: 'Smart Watch',
            title: 'Smart Watch',
            price: 199.99,
            category: 'electronics',
            description: 'Advanced smartwatch with fitness tracking and notifications',
            image: 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg'
          },
          {
            _id: 'mock-3',
            name: 'Running Shoes',
            title: 'Running Shoes',
            price: 79.99,
            category: 'clothing',
            description: 'Comfortable running shoes with excellent support',
            image: 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg'
          }
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

// Get order by ID
export const getOrderById = async (id) => {
  try {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const response = await api.get(`/orders/${id}?_t=${timestamp}`);
    return response;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Export other necessary API functions
export const createOrder = async (orderData) => {
  try {
    console.log('API: Creating order with data:', orderData);
    
    // For development - include fallback if API server is not available
    if (isDevelopment) {
      try {
        // First try to make the real API call
        const response = await api.post('/orders', orderData);
        console.log('API: Order created successfully via API');
        return response;
      } catch (apiError) {
        // If API call fails in development, create a mock order
        console.warn('API: Order creation API call failed, using development fallback:', apiError.message);
        
        // Generate mock order data
        const mockOrderId = 'dev-order-' + Date.now();
        const mockOrder = {
          _id: mockOrderId,
          orderItems: orderData.orderItems,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
          itemsPrice: orderData.itemsPrice,
          taxPrice: orderData.taxPrice,
          shippingPrice: orderData.shippingPrice,
          totalPrice: orderData.totalPrice,
          user: JSON.parse(localStorage.getItem('user') || '{}')._id || 'dev-user',
          isPaid: false,
          isDelivered: false,
          status: 'processing',
          createdAt: new Date().toISOString()
        };
        
        // Save to localStorage for development testing
        try {
          // Get existing orders or initialize empty array
          const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
          const updatedOrders = [mockOrder, ...existingOrders];
          localStorage.setItem('orders', JSON.stringify(updatedOrders));
          console.log('API: Mock order saved to localStorage:', mockOrderId);
        } catch (storageError) {
          console.error('API: Error saving mock order to localStorage:', storageError);
        }
        
        // Return as if it was a successful API response
        return { data: mockOrder };
      }
    }
    
    // For production, just make the API call
    const response = await api.post('/orders', orderData);
    return response;
  } catch (error) {
    console.error('API: Error creating order:', error.message);
    
    // Add detailed error information
    const errorDetails = {
      message: error.message
    };
    
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
    }
    
    console.error('API: Order creation error details:', errorDetails);
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
    return response;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export default api;