import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock,
  Wrench,
  Building,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { authAPI } from '../../services/api';

const MechanicRegistrationPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vehicleCategories, setVehicleCategories] = useState([]);
  
  const [formData, setFormData] = useState({
    // User basic info
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    nic: '',
    mobile_no: '',
    role: 'MECHANIC',
    
    // Mechanic profile info
    license_number: '',
    years_of_experience: '',
    specializations: [],
    province: '',
    district: '',
    service_area: '',
    is_mobile: false,
    hourly_rate: '',
    business_name: '',
    business_address: ''
  });

  useEffect(() => {
    fetchVehicleCategories();
  }, []);

  const fetchVehicleCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/vehicle-categories/');
      if (response.ok) {
        const data = await response.json();
        setVehicleCategories(data);
      }
    } catch (error) {
      console.error('Error fetching vehicle categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecializationChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(categoryId)
        ? prev.specializations.filter(id => id !== categoryId)
        : [...prev.specializations, categoryId]
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return false;
    }
    
    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return false;
    }
    
    if (formData.nic.length !== 10) {
      setMessage({ type: 'error', text: 'NIC must be 10 digits' });
      return false;
    }
    
    if (formData.mobile_no.length !== 10) {
      setMessage({ type: 'error', text: 'Mobile number must be 10 digits' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // First, register the user
      const userRegistrationData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        nic: formData.nic,
        mobile_no: formData.mobile_no,
        role: 'MECHANIC'
      };

      const registrationResponse = await authAPI.register(userRegistrationData);
      
      // Login the user
      const loginResponse = await authAPI.login({
        username: formData.username,
        password: formData.password
      });
      
      await login(loginResponse.data.access, loginResponse.data.refresh);

      // Create mechanic profile
      const mechanicProfileData = {
        license_number: formData.license_number,
        years_of_experience: parseInt(formData.years_of_experience) || 0,
        specialization_ids: formData.specializations,
        province: formData.province,
        district: formData.district,
        service_area: formData.service_area,
        is_mobile: formData.is_mobile,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        business_name: formData.business_name,
        business_address: formData.business_address
      };

      await fetch('http://localhost:8000/api/mechanics/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginResponse.data.access}`
        },
        body: JSON.stringify(mechanicProfileData)
      });

      setMessage({ type: 'success', text: 'Registration successful! Redirecting...' });
      
      setTimeout(() => {
        navigate('/mechanic/profile');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || error.response?.data?.error || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-red-600 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Wrench className="h-12 w-12 text-white mr-3" />
            <h1 className="text-4xl font-bold text-white">Become a Mechanic</h1>
          </div>
          <p className="text-white/80 text-lg">Join our platform and start offering your professional services</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Choose a username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Create a password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIC Number *
                    </label>
                    <input
                      type="text"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      required
                      maxLength="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter your NIC number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        name="mobile_no"
                        value={formData.mobile_no}
                        onChange={handleInputChange}
                        required
                        maxLength="10"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Professional Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter your license number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <div className="relative">
                      <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="years_of_experience"
                        value={formData.years_of_experience}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (Optional)
                    </label>
                    <div className="relative">
                      <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter hourly rate"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <div className="relative">
                      <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your province"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter your district"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Building size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        name="business_name"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter your business name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <textarea
                      name="business_address"
                      value={formData.business_address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter your business address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Area Description
                    </label>
                    <textarea
                      name="service_area"
                      value={formData.service_area}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Describe your service coverage area"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_mobile"
                      checked={formData.is_mobile}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      I offer mobile services (can travel to customer locations)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Vehicle Specializations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vehicleCategories.map(category => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(category.id)}
                      onChange={() => handleSpecializationChange(category.id)}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Wrench size={20} />
                <span>{loading ? 'Creating Account...' : 'Register as Mechanic'}</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MechanicRegistrationPage;
