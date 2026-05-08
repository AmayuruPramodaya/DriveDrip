import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Eye,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  Filter,
  RefreshCw
} from 'lucide-react';
import { orderAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      const params = filter !== 'all' ? { status: filter } : {};
      
      if (user.role === 'BUYER') {
        response = await orderAPI.getBuyerOrders(params);
      } else if (user.role === 'SELLER') {
        response = await orderAPI.getSellerOrders(params);
      } else {
        response = await orderAPI.getOrders(params);
      }
      
      setOrders(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CONFIRMED':
      case 'PROCESSING':
        return <Package className="w-4 h-4" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Please Login</h2>
          <p className="text-slate-600 mb-6">You need to be logged in to view your orders.</p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">My Orders</h1>
              <p className="text-slate-600">
                {user.role === 'SELLER' ? 'Manage your shop orders' : 'Track your purchases'}
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center space-x-2 bg-white text-slate-700 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status === 'all' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Package className="w-24 h-24 mx-auto text-slate-400 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              {filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </h2>
            <p className="text-slate-600 mb-8">
              {user.role === 'SELLER' 
                ? 'Orders from customers will appear here' 
                : "You haven't placed any orders yet"
              }
            </p>
            {user.role === 'BUYER' && (
              <button
                onClick={() => navigate('/spare-parts')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Browse Parts
              </button>
            )}
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Order #{order.id}
                      </h3>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                      </div>
                      {order.items_count && (
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{order.items_count} item(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {user.role === 'SELLER' && order.buyer_name && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>Customer: {order.buyer_name}</span>
                      </div>
                    )}
                    {user.role === 'BUYER' && order.seller_name && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>Seller: {order.seller_name}</span>
                      </div>
                    )}
                    {order.phone && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600 mb-2">
                        <Phone className="w-4 h-4" />
                        <span>{order.phone}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {order.shipping_address && (
                      <div className="flex items-start space-x-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{order.shipping_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Items:</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{item.spare_part_name || item.name}</span>
                          <span className="text-slate-800">
                            {item.quantity}x ${parseFloat(item.price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-sm text-slate-500">
                          ... and {order.items.length - 3} more item(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;