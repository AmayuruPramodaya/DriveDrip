import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { item, quantity = 1 } = action.payload;
      const existingItem = state.items.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = state.items.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
        
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + quantity,
          totalAmount: calculateTotal(updatedItems)
        };
      } else {
        // Add new item to cart
        const newItem = {
          id: item.id,
          name: item.name,
          price: parseFloat(item.price || 0),
          image: item.main_image || (item.images && item.images[0]?.image),
          shop_name: item.shop_name,
          shop_id: item.shop_id || item.shop,
          seller_id: item.seller_id || item.seller,
          seller: item.seller_id || item.seller,
          condition: item.condition,
          part_number: item.part_number,
          stock: item.quantity || 0,
          quantity: quantity
        };
        
        const updatedItems = [...state.items, newItem];
        
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + quantity,
          totalAmount: calculateTotal(updatedItems)
        };
      }
    }
    
    case CART_ACTIONS.REMOVE_ITEM: {
      const itemId = action.payload;
      const itemToRemove = state.items.find(item => item.id === itemId);
      const updatedItems = state.items.filter(item => item.id !== itemId);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems - (itemToRemove?.quantity || 0),
        totalAmount: calculateTotal(updatedItems)
      };
    }
    
    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        return cartReducer(state, { type: CART_ACTIONS.REMOVE_ITEM, payload: itemId });
      }
      
      const oldItem = state.items.find(item => item.id === itemId);
      const updatedItems = state.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      const quantityDiff = quantity - (oldItem?.quantity || 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDiff,
        totalAmount: calculateTotal(updatedItems)
      };
    }
    
    case CART_ACTIONS.CLEAR_CART:
      return {
        items: [],
        totalItems: 0,
        totalAmount: 0
      };
    
    case CART_ACTIONS.LOAD_CART:
      return action.payload;
    
    default:
      return state;
  }
};

// Helper function to calculate total amount
const calculateTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Initial cart state
const initialCartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);

  // Load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('drivedrip_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('drivedrip_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Cart actions
  const addToCart = (item, quantity = 1) => {
    if (quantity <= 0) return;
    
    // Check if we have enough stock
    const existingItem = cart.items.find(cartItem => cartItem.id === item.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;
    
    if (newTotalQuantity > (item.quantity || 0)) {
      throw new Error(`Only ${item.quantity || 0} items available in stock`);
    }
    
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { item, quantity }
    });
  };

  const removeFromCart = (itemId) => {
    dispatch({
      type: CART_ACTIONS.REMOVE_ITEM,
      payload: itemId
    });
  };

  const updateQuantity = (itemId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { itemId, quantity }
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const getItemQuantity = (itemId) => {
    const item = cart.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const isItemInCart = (itemId) => {
    return cart.items.some(item => item.id === itemId);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isItemInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};