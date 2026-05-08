import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Store, 
  Edit, 
  Package, 
  Users, 
  Star, 
  TrendingUp, 
  Eye,
  Plus,
  Settings,
  BarChart3,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { shopAPI, sparePartsAPI, orderAPI } from '../../services/api';

const MyShopPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopParts, setShopParts] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [stats, setStats] = useState({
    totalParts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user && user.role === 'SELLER') {
      fetchShopsData();
    }
  }, [user]);

  const fetchShopsData = async () => {
    try {
      setLoading(true);
      
      // Use secure endpoint to get only current user's shops
      const shopsResponse = await shopAPI.getUserShops();
      const userShops = shopsResponse.data.results || shopsResponse.data || [];
      
      console.log(`User ${user.id} has ${userShops.length} shops:`, userShops.map(s => s.name));
      
      if (userShops.length > 0) {
        setShops(userShops);
        // Select the first shop by default or from URL params
        const selectedShopId = new URLSearchParams(window.location.search).get('shop');
        const shopToSelect = selectedShopId 
          ? userShops.find(shop => shop.id === parseInt(selectedShopId))
          : userShops[0];
        
        if (shopToSelect) {
          await selectShop(shopToSelect);
        }
      } else {
        setShops([]);
        setSelectedShop(null);
      }
    } catch (error) {
      console.error('Error fetching shops data:', error);
      setMessage({ type: 'error', text: 'Failed to load shops data' });
    } finally {
      setLoading(false);
    }
  };

  const selectShop = async (shop) => {
    try {
      setSelectedShop(shop);
      
      // Fetch shop parts and orders in parallel
      const [partsResponse, ordersResponse] = await Promise.all([
        sparePartsAPI.getAll({ shop: shop.id }),
        orderAPI.getOrders({ shop: shop.id })
      ]);
      
      const parts = partsResponse.data.results || partsResponse.data || [];
      const orders = ordersResponse.data.results || ordersResponse.data || [];
      
      setShopParts(parts);
      setShopOrders(orders);
      
      // Calculate stats
      const totalRevenue = orders
        .filter(order => order.status === 'COMPLETED')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
      
      setStats({
        totalParts: parts.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        avgRating: parseFloat(shop.average_rating || 0)
      });
    } catch (error) {
      console.error('Error fetching shop data:', error);
      setMessage({ type: 'error', text: 'Failed to load shop data' });
    }
  };

  const handleCreateShop = () => {
    navigate('/add-shop');
  };

  const handleEditShop = () => {
    navigate(`/edit-shop/${selectedShop.id}`);
  };

  const handleAddPart = () => {
    navigate('/add-parts');
  };

  const handleViewShop = () => {
    navigate(`/shops/${selectedShop.id}`);
  };

  const handleViewPart = (partId) => {
    navigate(`/parts/${partId}`);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  // Check if user is a seller
  if (!user || user.role !== 'SELLER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">
            Seller Account Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be registered as a seller to manage a shop.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Register as Seller
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-black text-xl">Loading shop data...</div>
        </div>
      </div>
    );
  }

  // If no shops exist, show create shop option
  if (!shops.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-lg mx-auto mb-6">
                <Store size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-black mb-4">
                Create Your Shop
              </h1>
              <p className="text-gray-600 mb-8 text-lg">
                You haven't created a shop yet. Create your shop to start selling vehicle spare parts on DriveDrip.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={handleCreateShop}
                  className="w-full py-4 px-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg hover:shadow-xl text-lg"
                >
                  <Store className="w-6 h-6 mr-3 inline" />
                  Create My Shop
                </button>
                <p className="text-sm text-gray-500">
                  Setting up your shop only takes a few minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-lg">
              <Store size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-black mb-4">
            My Shop
          </h1>
          <p className="text-lg text-gray-600">
            Manage your shop, parts, and orders
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center space-x-2 shadow-sm ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Shop Selector - Show only if multiple shops */}
        {shops.length > 1 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-black mb-1">Select Shop to Manage</h3>
                <p className="text-sm text-gray-600">You have {shops.length} shops. Choose one to manage.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => selectShop(shop)}
                    className={`px-4 py-2 rounded-full transition-all font-medium ${
                      selectedShop?.id === shop.id
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    {shop.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Show only if a shop is selected */}
        {selectedShop && (
          <>
            {/* Shop Header Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                {selectedShop.logo ? (
                  <img 
                    src={selectedShop.logo.startsWith('http') ? selectedShop.logo : `http://localhost:8000${selectedShop.logo}`} 
                    alt={selectedShop.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h2 className="text-2xl font-bold text-black">{selectedShop.name}</h2>
                  {selectedShop.is_verified && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      <Shield size={12} />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span>{stats.avgRating.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span>Since {new Date(selectedShop.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleViewShop}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Public Shop
              </button>
              <button 
                onClick={handleEditShop}
                className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Shop
              </button>
              <button 
                onClick={handleAddPart}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Part
              </button>
              <button 
                onClick={handleCreateShop}
                className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
              >
                <Store className="w-4 h-4 mr-2" />
                Add New Shop
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-black">{stats.totalParts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-black">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-black">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-black">{stats.avgRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'parts', label: `Parts (${stats.totalParts})`, icon: Package },
                { id: 'orders', label: `Orders (${stats.totalOrders})`, icon: Users },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Store className="w-5 h-5 mr-2 text-orange-500" />
                Shop Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {selectedShop.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-black">{selectedShop.address}</p>
                      </div>
                    </div>
                  )}
                  {selectedShop.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-black">{selectedShop.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedShop.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-black">{selectedShop.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedShop.website && (
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Website</p>
                        <a 
                          href={selectedShop.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-700 underline"
                        >
                          {selectedShop.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {selectedShop.description && (
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-black">{selectedShop.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-black">Your Parts</h3>
              <button 
                onClick={handleAddPart}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Part
              </button>
            </div>
            
            {shopParts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-black mb-2">No parts yet</h4>
                <p className="text-gray-600 mb-6">Start by adding your first spare part</p>
                <button 
                  onClick={handleAddPart}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Part
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shopParts.map((part) => (
                  <div key={part.id} className="border border-gray-200 rounded-3xl p-4 hover:shadow-md transition-shadow bg-white/50">
                    <div className="aspect-square bg-gray-100 rounded-2xl mb-4 overflow-hidden">
                      {part.main_image ? (
                        <img 
                          src={part.main_image.startsWith('http') ? part.main_image : `http://localhost:8000${part.main_image}`}
                          alt={part.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-semibold text-black mb-2 truncate">{part.name}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-orange-600">${parseFloat(part.price || 0).toFixed(2)}</span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Qty: {part.quantity}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {parseFloat(part.average_rating || 0).toFixed(1)} ({part.total_ratings || 0})
                      </span>
                    </div>
                    <button 
                      onClick={() => handleViewPart(part.id)}
                      className="w-full px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium text-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Part
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <h3 className="text-lg font-semibold text-black mb-6">Recent Orders</h3>
            
            {shopOrders.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-black mb-2">No orders yet</h4>
                <p className="text-gray-600">Orders will appear here when customers purchase your parts</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Order ID</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Items</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Total</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 text-sm font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="py-3 text-sm font-medium text-black">#{order.id}</td>
                        <td className="py-3 text-sm text-black">{order.buyer_name || 'Customer'}</td>
                        <td className="py-3 text-sm text-gray-600">{order.items?.length || 0} items</td>
                        <td className="py-3 text-sm font-medium text-black">${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <button 
                            onClick={() => handleViewOrder(order.id)}
                            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 p-6">
            <h3 className="text-lg font-semibold text-black mb-6">Shop Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                <div>
                  <h4 className="font-medium text-black">Edit Shop Information</h4>
                  <p className="text-sm text-gray-600">Update your shop details, description, and contact information</p>
                </div>
                <button 
                  onClick={handleEditShop}
                  className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Shop
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl">
                <div>
                  <h4 className="font-medium text-black">Shop Verification</h4>
                  <p className="text-sm text-gray-600">
                    {selectedShop.is_verified 
                      ? 'Your shop is verified and trusted by customers'
                      : 'Submit business documents to get your shop verified'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedShop.is_verified ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  ) : (
                    <button className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium">
                      <Shield className="w-4 h-4 mr-2" />
                      Apply for Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyShopPage;