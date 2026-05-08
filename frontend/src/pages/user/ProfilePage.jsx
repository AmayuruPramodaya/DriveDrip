import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Edit,
  Shield,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { userAPI } from '../../services/api';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
    profile_picture: null
  });
  const [previewImage, setPreviewImage] = useState(user?.profile_picture || '');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        profile_picture: null
      });
      setPreviewImage(user.profile_picture || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData(prev => ({
        ...prev,
        profile_picture: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== '') {
          formData.append(key, profileData[key]);
        }
      });

      const response = await userAPI.updateProfile(formData);
      await updateUserProfile(response.data);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'BUYER': return 'Buyer';
      case 'SELLER': return 'Seller';
      case 'MECHANIC': return 'Mechanic';
      case 'ADMIN': return 'Administrator';
      default: return 'User';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'BUYER': return 'bg-blue-100/90 text-blue-800 border-blue-200';
      case 'SELLER': return 'bg-green-100/90 text-green-800 border-green-200';
      case 'MECHANIC': return 'bg-orange-100/90 text-orange-800 border-orange-200';
      case 'ADMIN': return 'bg-purple-100/90 text-purple-800 border-purple-200';
      default: return 'bg-gray-100/90 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-black">Profile Settings</h1>
          </div>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center space-x-2 backdrop-blur-sm border ${
            message.type === 'success' 
              ? 'bg-green-100/90 text-green-800 border-green-200' 
              : 'bg-red-100/90 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/40 hover:shadow-2xl transition-all duration-300">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mx-auto shadow-lg">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded-full cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-black mb-3">
                  {user?.name || user?.username || 'User'}
                </h3>
                
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border ${getRoleColor(user?.role)}`}>
                  <Shield size={14} className="mr-2" />
                  {getRoleDisplay(user?.role)}
                </div>

                <div className="mt-6 space-y-3 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50/80 rounded-2xl backdrop-blur-sm">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="font-medium">Member since {new Date(user?.date_joined).getFullYear()}</span>
                  </div>
                  {user?.role === 'SELLER' && (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-green-50/80 rounded-2xl backdrop-blur-sm border border-green-200">
                      <Package size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">Verified Seller</span>
                    </div>
                  )}
                  {user?.role === 'MECHANIC' && (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-orange-50/80 rounded-2xl backdrop-blur-sm border border-orange-200">
                      <Shield size={16} className="text-orange-600" />
                      <span className="font-medium text-orange-800">Professional Mechanic</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/40 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-black">Personal Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Edit size={16} />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" />
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full pl-12 pr-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner disabled:bg-gray-100"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" />
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full pl-12 pr-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner disabled:bg-gray-100"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full pl-12 pr-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner disabled:bg-gray-100"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Address
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" />
                      <input
                        type="text"
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        disabled={!editing}
                        className="w-full pl-12 pr-4 py-4 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner disabled:bg-gray-100"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-black mb-3">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={4}
                      className="w-full px-6 py-4 border-0 rounded-3xl focus:ring-4 focus:ring-orange-200 focus:bg-white bg-gray-50/50 hover:bg-white transition-all duration-300 shadow-inner disabled:bg-gray-100"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {editing && (
                  <div className="flex items-center justify-end space-x-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-8 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 hover:border-orange-400 hover:scale-105 transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
                    >
                      <Save size={16} />
                      <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
          
          {/* Mechanic Quick Links */}
          {user?.role === 'MECHANIC' && (
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/40 hover:shadow-2xl transition-all duration-300">
                <h3 className="text-lg font-bold text-black mb-6 flex items-center">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🔧</span>
                  </div>
                  Mechanic Dashboard
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link
                    to="/mechanic-requests"
                    className="group flex items-center space-x-4 p-6 bg-blue-50/80 rounded-3xl hover:bg-blue-100/90 transition-all duration-300 border border-blue-200/50 hover:border-blue-300 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white text-lg">🔧</span>
                    </div>
                    <div>
                      <p className="font-bold text-black group-hover:text-blue-600 transition-colors">Service Requests</p>
                      <p className="text-sm text-gray-600">Manage incoming requests</p>
                    </div>
                  </Link>
                  
                  <Link
                    to={`/mechanic/${user.id}`}
                    className="group flex items-center space-x-4 p-6 bg-green-50/80 rounded-3xl hover:bg-green-100/90 transition-all duration-300 border border-green-200/50 hover:border-green-300 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-bold text-black group-hover:text-green-600 transition-colors">Public Profile</p>
                      <p className="text-sm text-gray-600">View your mechanic profile</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/mechanics"
                    className="group flex items-center space-x-4 p-6 bg-orange-50/80 rounded-3xl hover:bg-orange-100/90 transition-all duration-300 border border-orange-200/50 hover:border-orange-300 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white text-lg">👥</span>
                    </div>
                    <div>
                      <p className="font-bold text-black group-hover:text-orange-600 transition-colors">Find Mechanics</p>
                      <p className="text-sm text-gray-600">Browse other mechanics</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
