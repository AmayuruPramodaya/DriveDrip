import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft,
  Package,
  CreditCard,
  CheckCircle,
  MapPin
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { orderAPI } from '../services/api';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  // Checkout form data
  const [checkoutData, setCheckoutData] = useState({
    shipping_address: '',
    phone: '',
    notes: ''
  });

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowCheckout(true);
  };

  const processOrder = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Group items by seller
      const itemsBySeller = cart.items.reduce((acc, item) => {
        const sellerId = item.seller_id || item.seller;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push(item);
        return acc;
      }, {});

      // Create separate orders for each seller
      const orderPromises = [];
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const orderItems = items.map(item => ({
          spare_part: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }));

        const orderData = {
          order_items: orderItems,
          delivery_address: checkoutData.shipping_address,
          delivery_phone: checkoutData.phone,
          notes: checkoutData.notes,
          total_amount: items.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2)
        };

        // Create order via API
        orderPromises.push(orderAPI.createOrder(orderData));
      }

      // Wait for all orders to be created
      const createdOrders = await Promise.all(orderPromises);

      // Clear cart and show success message
      setMessage({ 
        type: 'success', 
        text: `Successfully placed ${createdOrders.length} order(s)! Redirecting to your orders...` 
      });
      clearCart();

      setTimeout(() => {
        navigate('/dashboard?tab=orders');
      }, 2000);

    } catch (error) {
      console.error('Error processing order:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.response?.data?.detail || 'Failed to process order. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 mx-auto text-slate-400 mb-6" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-8">
              Looks like you haven't added any parts to your cart yet.
            </p>
            <Link 
              to="/spare-parts" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              <Package className="w-5 h-5" />
              <span>Browse Parts</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Shopping Cart</h1>
                <p className="text-slate-600">{cart.totalItems} items in your cart</p>
              </div>
            </div>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          </div>
          
          {/* Message Display */}
          {message.text && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <ArrowLeft className="w-5 h-5 mr-2 rotate-45" />
                )}
                {message.text}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow">
                    <h3 className="font-semibold text-slate-800 mb-1">{item.name}</h3>
                    {item.part_number && (
                      <p className="text-sm text-slate-500 mb-1">Part #: {item.part_number}</p>
                    )}
                    {item.condition && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                        item.condition === 'NEW' ? 'bg-green-100 text-green-800' :
                        item.condition === 'USED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.condition}
                      </span>
                    )}
                    {item.shop_name && (
                      <div className="flex items-center text-sm text-slate-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{item.shop_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Price and Quantity */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-500 mb-2">
                      ${item.price.toFixed(2)} each
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-md p-6 h-fit sticky top-8">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal ({cart.totalItems} items)</span>
                <span className="font-medium">${cart.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">${cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!showCheckout ? (
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-automotive-darkblue">Checkout Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                    Shipping Address *
                  </label>
                  <textarea
                    name="shipping_address"
                    required
                    rows={3}
                    value={checkoutData.shipping_address}
                    onChange={(e) => setCheckoutData({ ...checkoutData, shipping_address: e.target.value })}
                    className="input-automotive"
                    placeholder="Enter your full shipping address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={checkoutData.phone}
                    onChange={(e) => setCheckoutData({ ...checkoutData, phone: e.target.value })}
                    className="input-automotive"
                    placeholder="Your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={checkoutData.notes}
                    onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                    className="input-automotive"
                    placeholder="Any special instructions..."
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={processOrder}
                    disabled={loading || !checkoutData.shipping_address || !checkoutData.phone}
                    className="w-full btn-primary flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full btn-outline"
                  >
                    Back to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
