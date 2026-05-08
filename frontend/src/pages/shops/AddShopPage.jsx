import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Upload, 
  FileText, 
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Camera
} from 'lucide-react';
import { shopAPI } from '../../services/api';
import { sriLankanLocations, getProvinces, getDistrictsByProvince } from '../../data/locations';

const AddShopPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Location data
  const [provinces] = useState(getProvinces());
  const [districts, setDistricts] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    province: '',
    district: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    business_license: '',
    tax_id: '',
    logo: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update districts when province changes
    if (name === 'province') {
      const newDistricts = getDistrictsByProvince(value);
      setDistricts(newDistricts);
      setFormData(prev => ({
        ...prev,
        district: '' // Reset district when province changes
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validation
      if (!formData.name || !formData.description || !formData.province || !formData.district || !formData.address || !formData.phone) {
        setMessage({ type: 'error', text: 'Please fill in all required fields including province, district, and address' });
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      if (!user) {
        setMessage({ type: 'error', text: 'Please login to create a shop' });
        setLoading(false);
        return;
      }

      // Prepare form data for submission
      const submitData = new FormData();
      
      // Required fields
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('province', formData.province);
      submitData.append('district', formData.district);
      submitData.append('address', formData.address.trim());
      submitData.append('phone', formData.phone.trim());
      
      // Optional fields - only add if they have values
      if (formData.email && formData.email.trim()) {
        submitData.append('email', formData.email.trim());
      }
      if (formData.website && formData.website.trim()) {
        submitData.append('website', formData.website.trim());
      }
      if (formData.business_license && formData.business_license.trim()) {
        submitData.append('business_license', formData.business_license.trim());
      }
      if (formData.tax_id && formData.tax_id.trim()) {
        submitData.append('tax_id', formData.tax_id.trim());
      }
      
      // Logo file
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      
      console.log('Submitting shop data:');
      console.log('User:', user);
      console.log('User role:', user?.role);
      console.log('User authenticated:', !!user);
      
      // Log form data entries
      console.log('FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes)` : value);
      }
      
      // Make API call
      const response = await shopAPI.createShop(submitData);
      console.log('Shop created successfully:', response.data);
      
      setMessage({ type: 'success', text: 'Shop created successfully! Redirecting...' });
      
      // Redirect to shop management page after 2 seconds
      setTimeout(() => {
        navigate('/my-shop');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating shop:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create shop. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'You are not authorized. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create a shop. Make sure you are registered as a seller.';
      } else if (error.response?.data) {
        const errors = error.response.data;
        if (typeof errors === 'object' && errors !== null) {
          const errorMessages = Object.entries(errors)
            .map(([key, value]) => {
              const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
              const message = Array.isArray(value) ? value.join(', ') : value;
              return `${fieldName}: ${message}`;
            })
            .join('\n');
          errorMessage = errorMessages;
        } else if (typeof errors === 'string') {
          errorMessage = errors;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        }
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
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
            You need to be registered as a seller to create a shop.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="w-full px-6 py-8">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 mb-8 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
              <ArrowLeft size={20} />
            </div>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-black flex items-center justify-center shadow-xl">
              <Store size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-black mb-6">
            Create Your Shop
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join thousands of sellers on DriveDrip and start selling vehicle spare parts to customers across the country
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className={`p-6 rounded-2xl flex items-center space-x-3 shadow-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span className="whitespace-pre-line text-lg font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Shop Information</h2>
              <p className="text-orange-100 mt-1">Fill in the details to create your shop profile</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Shop Logo */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center justify-center">
                      <Camera className="w-5 h-5 mr-2 text-orange-500" />
                      Shop Logo
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover rounded-3xl" />
                          ) : (
                            <div className="text-center">
                              <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-500">Upload Logo</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <label className="inline-flex items-center px-6 py-3 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 cursor-pointer font-medium shadow-sm hover:shadow-md">
                        <Upload className="w-5 h-5 mr-2" />
                        Choose Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500">
                        Recommended: Square image, max 2MB (JPG, PNG)
                      </p>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <Store className="w-5 h-5 mr-2 text-orange-500" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Shop Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your shop name"
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="e.g., +94 11 234 5678"
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="shop@example.com"
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://yourshop.com"
                          className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Shop Description *
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Describe your shop, the types of parts you sell, your expertise, etc."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 resize-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                      Shop Location *
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            Province *
                          </label>
                          <select
                            name="province"
                            value={formData.province}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                            required
                          >
                            <option value="">Select Province</option>
                            {provinces.map(province => (
                              <option key={province} value={province}>
                                {province}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-black mb-2">
                            District *
                          </label>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={!formData.province}
                            required
                          >
                            <option value="">Select District</option>
                            {districts.map(district => (
                              <option key={district} value={district}>
                                {district}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Street Address *
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Street number, building name, and other address details"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 resize-none"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Enter the specific street address. Province and district will be added automatically.
                        </p>
                        
                        {/* Address Preview */}
                        {formData.address && formData.district && formData.province && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
                            <p className="text-sm font-medium text-blue-800 mb-1">Full Address Preview:</p>
                            <p className="text-sm text-blue-700">
                              {formData.address}, {formData.district}, {formData.province}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-orange-500" />
                        Business Information (Optional)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business License Number
                          </label>
                          <input
                            type="text"
                            name="business_license"
                            value={formData.business_license}
                            onChange={handleInputChange}
                            placeholder="e.g., BL123456789"
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:bg-gray-50 transition-all duration-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax ID Number
                          </label>
                          <input
                            type="text"
                            name="tax_id"
                            value={formData.tax_id}
                            onChange={handleInputChange}
                            placeholder="e.g., TAX123456789"
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white hover:bg-gray-50 transition-all duration-200"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                        Providing business information helps build trust with customers and may be required for verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                    I agree to the{' '}
                    <a href="/terms" className="text-orange-600 hover:text-orange-700 underline font-medium">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/seller-agreement" className="text-orange-600 hover:text-orange-700 underline font-medium">
                      Seller Agreement
                    </a>
                    . I understand that my shop will be reviewed before activation.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating Shop...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4" />
                      <span>Create Shop</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShopPage;