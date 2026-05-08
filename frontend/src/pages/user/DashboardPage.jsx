import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient, { shopAPI } from '../../services/api';
import { 
  UserCircle, Edit3, Save, XCircle, Camera, AlertCircle, 
  Car, Store, Package, ShoppingCart, Star, TrendingUp,
  Plus, Eye, Settings, MapPin, Phone, Mail, Globe, Heart
} from 'lucide-react';

const DashboardPage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState({
    shops: [],
    parts: [],
    orders: [],
    reviews: [],
    stats: {}
  });
  const fileInputRef = useRef(null);

  // Shop management state
  const [userShops, setUserShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopFormData, setShopFormData] = useState({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
    website: ''
  });
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState('');
  const [shopSuccess, setShopSuccess] = useState('');

  useEffect(() => {
    // Check URL parameters for active tab
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dob: user.dob || '',
        nic: user.nic || '',
        mobile_no: user.mobile_no || '',
      });

      if (!profileImageFile) {
        setPreviewImage(user.profile_picture || null);
      }
      
      // Fetch dashboard data
      fetchDashboardData();
      
      // Fetch user's shops if they're a seller
      if (user.role === 'SELLER') {
        fetchUserShops();
      }
    }
    if (!isEditing) {
      setFormErrors({});
    }
  }, [user, isEditing, profileImageFile]);

  const fetchUserShops = async () => {
    try {
      const response = await shopAPI.getShops({ owner: 'me' });
      const shops = response.data.results || response.data || [];
      setUserShops(shops);
      if (shops.length > 0) {
        setSelectedShop(shops[0]);
        setShopFormData({
          name: shops[0].name || '',
          description: shops[0].description || '',
          location: shops[0].location || '',
          phone: shops[0].phone || '',
          email: shops[0].email || '',
          website: shops[0].website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user shops:', error);
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    setShopLoading(true);
    setShopError('');
    setShopSuccess('');

    try {
      let response;
      if (selectedShop) {
        response = await shopAPI.updateShop(selectedShop.id, shopFormData);
        setShopSuccess('Shop updated successfully!');
      } else {
        response = await shopAPI.createShop(shopFormData);
        setShopSuccess('Shop created successfully!');
      }
      
      // Update the shops list
      await fetchUserShops();
      fetchDashboardData(); // Refresh dashboard data
    } catch (error) {
      console.error('Error saving shop:', error);
      setShopError(error.response?.data?.message || 'Failed to save shop');
    } finally {
      setShopLoading(false);
    }
  };

  const handleShopInputChange = (e) => {
    const { name, value } = e.target;
    setShopFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchDashboardData = async () => {
    try {
      const promises = [];
      
      // Fetch user's shops if they're a seller
      if (user.role === 'SELLER') {
        promises.push(apiClient.get('/shops/').then(res => ({ shops: res.data.results || res.data })));
      }
      
      // Fetch user's orders
      promises.push(apiClient.get('/orders/').then(res => ({ orders: res.data.results || res.data })));
      
      // Fetch user's reviews (both given and received)
      promises.push(apiClient.get('/reviews/').then(res => ({ reviews: res.data.results || res.data })));
      
      // If seller, fetch their parts
      if (user.role === 'SELLER') {
        promises.push(apiClient.get('/spare-parts/?owner=me').then(res => ({ parts: res.data.results || res.data })));
      }

      const results = await Promise.allSettled(promises);
      const dashboardInfo = {};
      
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(dashboardInfo, result.value);
        }
      });

      setDashboardData(prev => ({ ...prev, ...dashboardInfo }));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-automotive-chrome via-neutral-50 to-primary-50 flex items-center justify-center">
        <div className="automotive-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-automotive-steel">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({ ...prev, profile_picture: 'Please select an image file.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, profile_picture: 'Image size should be less than 5MB.' }));
        return;
      }
      setFormErrors(prev => ({ ...prev, profile_picture: null }));

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setFormErrors({});

    const dataToSubmit = new FormData();
    let hasChanges = false;

    Object.keys(formData).forEach(key => {
      if (formData[key] !== (user[key] || '')) {
        dataToSubmit.append(key, formData[key]);
        hasChanges = true;
      }
    });

    if (profileImageFile) {
      dataToSubmit.append('profile_picture', profileImageFile);
      hasChanges = true;
    }

    if (!hasChanges) {
      setSuccess("No changes detected.");
      setLoading(false);
      setIsEditing(false);
      return;
    }

    try {
      const response = await apiClient.patch(`/user/${user.id}/`, dataToSubmit);
      
      try {
        await updateProfile(response.data);
      } catch (updateError) {
        console.warn("UpdateProfile function error (non-critical):", updateError);
        // Continue with success even if updateProfile fails
      }
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setProfileImageFile(null);
    } catch (err) {
      console.error("Error updating profile:", err.response || err);
      if (err.response?.data) {
        const backendErrors = err.response.data;
        if (typeof backendErrors === 'object' && !Array.isArray(backendErrors)) {
          setFormErrors(backendErrors);
          setError("Please correct the errors below.");
        } else if (backendErrors.detail) {
          setError(backendErrors.detail);
        } else {
          setError('An error occurred. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    setFormErrors({});
    setProfileImageFile(null);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dob: user.dob || '',
        nic: user.nic || '',
        mobile_no: user.mobile_no || '',
      });
      setPreviewImage(user.profile_picture || null);
    }
  };

  const StatCard = ({ icon, label, value, color = "orange" }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 text-center border border-white/40 hover:shadow-2xl transition-all duration-300">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${
        color === "orange" ? "from-orange-500 to-orange-600" :
        color === "blue" ? "from-blue-500 to-blue-600" :
        color === "green" ? "from-green-500 to-green-600" :
        color === "yellow" ? "from-yellow-500 to-yellow-600" :
        "from-gray-500 to-gray-600"
      } mb-4 shadow-lg`}>
        {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
      </div>
      <h3 className="text-2xl font-bold text-black mb-1">{value}</h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );

  const QuickActionCard = ({ icon, title, description, onClick, color = "orange" }) => (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-white/40 hover:scale-105"
      onClick={onClick}
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${
        color === "orange" ? "from-orange-500 to-orange-600" :
        color === "blue" ? "from-blue-500 to-blue-600" :
        color === "green" ? "from-green-500 to-green-600" :
        color === "purple" ? "from-purple-500 to-purple-600" :
        "from-gray-500 to-gray-600"
      } mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
      </div>
      <h3 className="text-lg font-bold text-black mb-2 group-hover:text-orange-600 transition-colors">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-black">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-600">
            Welcome back, {user.name || user.username}! Here's your DriveDrip overview.
          </p>
        </div>

        {/* Alerts */}
        {error && !Object.keys(formErrors).length && (
          <div className="mb-6 p-4 bg-red-100/90 border border-red-200 rounded-2xl flex items-center backdrop-blur-sm">
            <AlertCircle size={20} className="text-red-600 mr-3" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100/90 border border-green-200 rounded-2xl backdrop-blur-sm">
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/40 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white"
                      onError={(e) => {
                        console.error("Image load error:", e.target.src);
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg border-4 border-white">
                      <UserCircle size={48} className="text-gray-400" />
                    </div>
                  )}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                      title="Change profile picture"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>
                
                <h2 className="text-xl font-bold text-black mb-1">
                  {user.name || user.username}
                </h2>
                <p className="text-gray-600 mb-3">{user.email}</p>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-orange-100/90 text-orange-800 border border-orange-200 backdrop-blur-sm">
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </div>
                
                {parseFloat(user.average_rating || 0) > 0 && (
                  <div className="flex items-center justify-center mt-3 p-3 bg-yellow-50/80 rounded-2xl backdrop-blur-sm border border-yellow-200">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="ml-2 text-sm text-yellow-800 font-medium">
                      {parseFloat(user.average_rating || 0).toFixed(1)} ({user.total_reviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="Full Name" value={user.name || 'Not set'} />
                  </div>
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="Email" value={user.email} />
                  </div>
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="Phone" value={user.phone || user.mobile_no || 'Not set'} />
                  </div>
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="Date of Birth" value={user.dob ? new Date(user.dob + 'T00:00:00').toLocaleDateString() : 'Not set'} />
                  </div>
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="NIC" value={user.nic || 'Not set'} />
                  </div>
                  <div className="p-4 bg-gray-50/50 rounded-2xl backdrop-blur-sm">
                    <DetailItem label="Address" value={user.address || 'Not set'} />
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsEditing(true); 
                      setError(''); 
                      setSuccess(''); 
                      // Clear any previous success messages when starting to edit
                      setTimeout(() => setSuccess(''), 100);
                    }}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl mt-6"
                  >
                    <Edit3 size={18} className="mr-2" />
                    Edit Profile
                  </button>
                </div>
                            ) : (
                            <div className="w-full">
                              <form onSubmit={handleSubmit} className="space-y-4 w-full">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                              />
                              
                              <div className="w-full">
                                <label className="block text-sm font-semibold text-black mb-3">Full Name</label>
                                <input 
                                type="text" 
                                name="name" 
                                value={formData.name || ''} 
                                onChange={handleInputChange} 
                                className={`w-full px-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner ${formErrors.name ? 'ring-2 ring-red-300' : ''}`}
                                required 
                                placeholder="Enter your full name"
                                />
                                {formErrors.name && <p className="mt-2 text-xs text-red-500 ml-4">{Array.isArray(formErrors.name) ? formErrors.name[0] : formErrors.name}</p>}
                              </div>

                              <div className="w-full">
                                <label className="block text-sm font-semibold text-black mb-3">Email</label>
                                <input 
                                type="email" 
                                name="email" 
                                value={formData.email || ''} 
                                onChange={handleInputChange} 
                                className={`w-full px-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner ${formErrors.email ? 'ring-2 ring-red-300' : ''}`}
                                required 
                                placeholder="Enter your email"
                                />
                                {formErrors.email && <p className="mt-2 text-xs text-red-500 ml-4">{Array.isArray(formErrors.email) ? formErrors.email[0] : formErrors.email}</p>}
                              </div>

                              <div className="w-full">
                                <label className="block text-sm font-semibold text-black mb-3">Date of Birth</label>
                                <input 
                                type="date" 
                                name="dob" 
                                value={formData.dob || ''} 
                                onChange={handleInputChange} 
                                className={`w-full px-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner ${formErrors.dob ? 'ring-2 ring-red-300' : ''}`}
                                />
                                {formErrors.dob && <p className="mt-2 text-xs text-red-500 ml-4">{Array.isArray(formErrors.dob) ? formErrors.dob[0] : formErrors.dob}</p>}
                              </div>

                              <div className="w-full">
                                <label className="block text-sm font-semibold text-black mb-3">NIC</label>
                                <input 
                                type="text" 
                                name="nic" 
                                value={formData.nic || ''} 
                                onChange={handleInputChange} 
                                className={`w-full px-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner ${formErrors.nic ? 'ring-2 ring-red-300' : ''}`}
                                placeholder="Enter your NIC"
                                />
                                {formErrors.nic && <p className="mt-2 text-xs text-red-500 ml-4">{Array.isArray(formErrors.nic) ? formErrors.nic[0] : formErrors.nic}</p>}
                              </div>

                              <div className="w-full">
                                <label className="block text-sm font-semibold text-black mb-3">Mobile</label>
                                <input 
                                type="tel" 
                                name="mobile_no" 
                                value={formData.mobile_no || ''} 
                                onChange={handleInputChange} 
                                className={`w-full px-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner ${formErrors.mobile_no ? 'ring-2 ring-red-300' : ''}`}
                                placeholder="Enter your mobile number"
                                />
                                {formErrors.mobile_no && <p className="mt-2 text-xs text-red-500 ml-4">{Array.isArray(formErrors.mobile_no) ? formErrors.mobile_no[0] : formErrors.mobile_no}</p>}
                              </div>

                              {formErrors.profile_picture && (
                                <p className="text-xs text-red-500 ml-4">{Array.isArray(formErrors.profile_picture) ? formErrors.profile_picture[0] : formErrors.profile_picture}</p>
                              )}

                              <div className="flex space-x-4 pt-6 w-full">
                                <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 hover:border-orange-400 hover:scale-105 transition-all duration-300 font-semibold shadow-sm hover:shadow-md flex items-center justify-center"
                                >
                                <XCircle size={18} className="mr-2" />
                                Cancel
                                </button>
                                <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold shadow-lg hover:shadow-xl"
                                >
                                <Save size={18} className="mr-2" />
                                {loading ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                              </form>
                            </div>
                            )}
                          </div>
                          </div>

                          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                icon={<ShoppingCart />} 
                label="Orders" 
                value={dashboardData.orders?.length || 0} 
                color="blue"
              />
              <StatCard 
                icon={<Star />} 
                label="Reviews" 
                value={dashboardData.reviews?.length || 0} 
                color="yellow"
              />
              {user.role === 'SELLER' && (
                <>              <StatCard 
                icon={<Store />} 
                label="Shops" 
                value={userShops?.length || 0} 
                color="green"
              />
                  <StatCard 
                    icon={<Package />} 
                    label="Parts" 
                    value={dashboardData.parts?.length || 0} 
                    color="orange"
                  />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center mr-3">
                  <TrendingUp size={16} className="text-white" />
                </div>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.role === 'SELLER' && (
                  <>
                    <QuickActionCard
                      icon={<Plus />}
                      title="Add New Part"
                      description="List a new spare part in your shop"
                      onClick={() => navigate('/add-parts')}
                    />
                    <QuickActionCard
                      icon={<Store />}
                      title="My Shops"
                      description="Create and manage your shops"
                      onClick={() => navigate('/my-shop')}
                      color="green"
                    />
                    <QuickActionCard
                      icon={<Plus />}
                      title="Add New Shop"
                      description="Create another shop"
                      onClick={() => navigate('/add-shop')}
                      color="purple"
                    />
                  </>
                )}
                <QuickActionCard
                  icon={<ShoppingCart />}
                  title="Browse Parts"
                  description="Explore available spare parts"
                  onClick={() => window.location.href = '/parts'}
                  color="blue"
                />
                <QuickActionCard
                  icon={<Eye />}
                  title="Order History"
                  description="View your past orders"
                  onClick={() => window.location.href = '/orders'}
                  color="purple"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-xl font-bold text-black mb-6 flex items-center">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center mr-3">
                  <TrendingUp size={16} className="text-white" />
                </div>
                Recent Activity
              </h3>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/40 hover:shadow-2xl transition-all duration-300">
                {dashboardData.orders?.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.orders.slice(0, 5).map((order, index) => (
                      <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 rounded-xl px-4 transition-colors duration-200">
                        <div>
                          <p className="font-bold text-black">Order #{order.id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">${order.total_amount}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            order.status === 'COMPLETED' ? 'bg-green-100/90 text-green-800 border border-green-200' :
                            order.status === 'PENDING' ? 'bg-yellow-100/90 text-yellow-800 border border-yellow-200' :
                            'bg-gray-100/90 text-gray-800 border border-gray-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No recent activity</p>
                    <p className="text-sm text-gray-500 mt-1">Your orders and activities will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <dt className="text-sm text-gray-600 font-medium">{label}</dt>
    <dd className="text-sm text-black font-semibold">{value || 'N/A'}</dd>
  </div>
);

export default DashboardPage;

// Updated to use secure getUserShops endpoint for better security