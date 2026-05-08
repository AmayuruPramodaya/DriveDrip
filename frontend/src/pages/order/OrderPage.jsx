import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X, 
  Eye,
  Filter,
  Search,
  Calendar,
  ShoppingCart,
  MapPin,
  Phone,
  Mail,
  Star
} from 'lucide-react';
import { orderAPI, sparePartsAPI } from '../../services/api';

const OrderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        ...filters
      };
      
      let response;
      
      // Use specific endpoints based on user role
      if (user.role === 'SELLER') {
        response = await orderAPI.getSellerOrders(params);
      } else {
        response = await orderAPI.getBuyerOrders(params);
      }
      
      const data = response.data;
      
      setOrders(data.results || data || []);
      setTotalPages(Math.ceil((data.count || data.length) / 10));
      setTotalOrders(data.count || data.length || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'CONFIRMED':
        return <CheckCircle size={16} />;
      case 'PROCESSING':
        return <Package size={16} />;
      case 'SHIPPED':
        return <Truck size={16} />;
      case 'DELIVERED':
        return <CheckCircle size={16} />;
      case 'CANCELLED':
        return <X size={16} />;
      default:
        return <Package size={16} />;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateOrder(orderId, { status: newStatus });
      fetchOrders(); // Refresh orders
      setShowOrderModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      // You could add error handling here, like showing a toast notification
    }
  };

  const OrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="automotive-header px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Order Details</h2>
            <button
              onClick={() => setShowOrderModal(false)}
              className="text-white hover:text-red-300"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-automotive-darkblue">Order Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Order Number:</span> {selectedOrder.order_number}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  <p><span className="font-medium">Total:</span> ${parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">{selectedOrder.status}</span>
                    </span>
                  </div>
                  {selectedOrder.notes && (
                    <div>
                      <span className="font-medium">Notes:</span>
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-automotive-darkblue">
                  {user.role === 'SELLER' ? 'Buyer' : 'Seller'} Information
                </h3>
                <div className="space-y-2">
                  <p className="flex items-center">
                    <Mail size={16} className="mr-2 text-automotive-steel" />
                    {user.role === 'SELLER' ? selectedOrder.buyer_email : selectedOrder.seller_email}
                  </p>
                  <p className="flex items-center">
                    <Phone size={16} className="mr-2 text-automotive-steel" />
                    {selectedOrder.delivery_phone}
                  </p>
                  <p className="flex items-center">
                    <MapPin size={16} className="mr-2 text-automotive-steel" />
                    {selectedOrder.delivery_address}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold text-automotive-darkblue mb-4">Order Items</h3>
              <div className="space-y-4">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center">
                        {item.spare_part.main_image ? (
                          <img 
                            src={item.spare_part.main_image} 
                            alt={item.spare_part.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package size={24} className="text-automotive-steel" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-automotive-darkblue">{item.spare_part.name}</h4>
                        <p className="text-sm text-automotive-steel">{item.spare_part.part_number}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm">Quantity: {item.quantity}</span>
                          <span className="font-medium">${item.price} each</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update (Sellers only) */}
            {user.role === 'SELLER' && selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-automotive-darkblue mb-4">Update Order Status</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <CheckCircle size={16} />
                        <span>Accept Order</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELLED')}
                        className="btn-outline text-red-600 border-red-600 hover:bg-red-600 hover:text-white flex items-center space-x-2"
                      >
                        <X size={16} />
                        <span>Reject Order</span>
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'CONFIRMED' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'PROCESSING')}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Package size={16} />
                      <span>Start Processing</span>
                    </button>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'SHIPPED')}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Truck size={16} />
                      <span>Mark as Shipped</span>
                    </button>
                  )}
                  {selectedOrder.status === 'SHIPPED' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'DELIVERED')}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle size={16} />
                      <span>Mark as Delivered</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="automotive-header px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShoppingCart size={24} className="text-white" />
                <h1 className="text-2xl font-bold text-white">
                  {user.role === 'SELLER' ? 'Sales Orders' : 'My Orders'}
                </h1>
              </div>
              <div className="text-white text-sm">
                Total: {totalOrders} orders
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                  Search Orders
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Order ID, part name..."
                    className="input-automotive pl-10"
                  />
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-automotive-steel" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="input-automotive"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="input-automotive"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="input-automotive"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <ShoppingCart size={48} className="text-automotive-steel mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-automotive-darkblue mb-2">No Orders Found</h3>
            <p className="text-automotive-steel">
              {user.role === 'SELLER' 
                ? 'You haven\'t received any orders yet.' 
                : 'You haven\'t placed any orders yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart size={24} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-automotive-darkblue">Order #{order.order_number || order.id}</h3>
                      <p className="text-sm text-automotive-steel">
                        {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </span>
                    <span className="text-xl font-bold text-primary-600">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-automotive-steel">
                      {user.role === 'SELLER' ? 'Buyer' : 'Seller'}: {user.role === 'SELLER' ? order.buyer_username : order.seller_username}
                    </p>
                    <p className="text-sm text-automotive-steel">
                      Email: {user.role === 'SELLER' ? order.buyer_email : order.seller_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-automotive-steel">
                      Delivery Address: {order.delivery_address}
                    </p>
                    <p className="text-sm text-automotive-steel">
                      Phone: {order.delivery_phone}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-automotive-steel">
                      {order.items?.length || 0} items
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <Eye size={16} />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Package size={16} />
                      <span>Quick View</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-neutral-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === index + 1
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-neutral-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && <OrderModal />}
    </div>
  );
};

export default OrderPage;
