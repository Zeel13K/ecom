import { createContext, useState, useContext, useEffect } from "react";
import { createOrder as createOrderApi } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
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
      
      // Check for authentication
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.error('CartContext: No auth token available for order creation');
        throw new Error('Authentication required. Please log in to place an order.');
      }

      // Make sure orderItems exist
      if (!orderData.orderItems || orderData.orderItems.length === 0) {
        console.error('CartContext: No order items provided');
        throw new Error('No items in cart. Please add items before placing an order.');
      }

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
      
      // Handle specific error cases
      if (error.response) {
        console.error('CartContext: Server error response:', error.response.data);
        throw error; // Re-throw to let the component handle it
      }
      
      throw error; // Re-throw any other errors
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
