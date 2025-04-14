import { createContext, useState, useContext, useEffect } from "react";
import { createOrder as createOrderApi } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      // Reset cart if there's an error
      setCart([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const incrementQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (productId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const createOrder = async (orderData) => {
    try {
      console.log('CartContext: Creating order with data:', orderData);
      
      // Check for authentication - use the correct token name
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('CartContext: No auth token available for order creation');
        throw new Error('Authentication required. Please log in to place an order.');
      }

      // Make sure orderItems exist
      if (!orderData.orderItems || orderData.orderItems.length === 0) {
        console.error('CartContext: No order items provided');
        throw new Error('No items in cart. Please add items before placing an order.');
      }

      // Log the API URL and headers for debugging
      console.log('CartContext: API URL for order creation:', import.meta.env.VITE_API_URL || 'Using default URL');
      console.log('CartContext: Using token for authorization (first 10 chars):', token.substring(0, 10) + '...');

      // Make API call to create order
      console.log('CartContext: Sending order to API');
      const response = await createOrderApi(orderData);
      
      // Handle successful response
      console.log('CartContext: Order created successfully:', response.data);
      
      // Clear cart only after successful order creation
      clearCart();
      
      return response.data;
    } catch (error) {
      console.error('CartContext: Error creating order:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('CartContext: Server error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('CartContext: No response received. Request details:', {
          method: error.request.method,
          url: error.request.url,
          responseType: error.request.responseType
        });
      } else {
        console.error('CartContext: Error setting up request:', error.message);
      }
      
      // Re-throw the error with more context
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error creating order';
      throw new Error(`Order creation failed: ${errorMessage}`);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        incrementQuantity,
        decrementQuantity,
        removeFromCart,
        clearCart,
        createOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
