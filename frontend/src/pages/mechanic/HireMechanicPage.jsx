import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  DollarSign, 
  User, 
  Wrench,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

const HireMechanicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mechanic, setMechanic] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    service: '',
    job_type: 'SHOP',
    problem_description: '',
    vehicle_info: '',
    service_location: '',
    preferred_date: '',
    preferred_time: '',
    customer_notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchMechanicDetails();
      fetchMechanicServices();
    }
  }, [id]);

  const fetchMechanicDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/mechanics/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setMechanic(data);
      }
    } catch (error) {
      console.error('Error fetching mechanic details:', error);
    }
  };

  const fetchMechanicServices = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/mechanic-services/?mechanic=${id}`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching mechanic services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.problem_description) {
      setMessage({ type: 'error', text: 'Please describe the problem with your vehicle' });
      return false;
    }
    
    if (!formData.vehicle_info) {
      setMessage({ type: 'error', text: 'Please provide vehicle information' });
      return false;
    }
    
    if ((formData.job_type === 'ON_SITE' || formData.job_type === 'ROADSIDE') && !formData.service_location) {
      setMessage({ type: 'error', text: 'Please provide service location for on-site/roadside service' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('accessToken');
      
      const requestData = {
        mechanic: parseInt(id),
        ...formData
      };

      if (formData.service) {
        requestData.service = parseInt(formData.service);
      }

      const response = await fetch('http://localhost:8000/api/hire-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Hire request submitted successfully!' });
        
        setTimeout(() => {
          navigate('/my-hire-requests');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'error', 
          text: errorData.detail || errorData.error || 'Failed to submit hire request' 
        });
      }
    } catch (error) {
      console.error('Error submitting hire request:', error);
      setMessage({ type: 'error', text: 'Failed to submit hire request. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-4">You need to be logged in to hire a mechanic.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Mechanic not found</h3>
            <button
              onClick={() => navigate('/mechanics')}
              className="text-orange-600 hover:text-orange-800"
            >
              Back to mechanics list
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hire a Mechanic</h1>
            
            {/* Mechanic Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                {mechanic.user.profile_picture ? (
                  <img
                    src={mechanic.user.profile_picture}
                    alt={mechanic.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {mechanic.business_name || mechanic.user.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {mechanic.district}, {mechanic.province}
                </p>
                {mechanic.hourly_rate && (
                  <p className="text-sm text-orange-600 font-medium">
                    ${mechanic.hourly_rate}/hour
                  </p>
                )}
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Service Selection */}
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service (Optional)
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select a service (or describe in problem description)</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ${service.base_price}
                        {service.price_per_hour && ` + $${service.price_per_hour}/hr`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="SHOP">At Mechanic Shop</option>
                  {mechanic.is_mobile && (
                    <>
                      <option value="ON_SITE">On-Site (My Location)</option>
                      <option value="ROADSIDE">Roadside Assistance</option>
                    </>
                  )}
                </select>
                {!mechanic.is_mobile && (
                  <p className="text-sm text-gray-500 mt-1">
                    This mechanic only provides shop-based services
                  </p>
                )}
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description *
                </label>
                <div className="relative">
                  <FileText size={20} className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="problem_description"
                    value={formData.problem_description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Describe the problem with your vehicle in detail..."
                  />
                </div>
              </div>

              {/* Vehicle Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Information *
                </label>
                <input
                  type="text"
                  name="vehicle_info"
                  value={formData.vehicle_info}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 2018 Toyota Camry, License: ABC-1234"
                />
              </div>

              {/* Service Location (for on-site/roadside) */}
              {(formData.job_type === 'ON_SITE' || formData.job_type === 'ROADSIDE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Location *
                  </label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="service_location"
                      value={formData.service_location}
                      onChange={handleInputChange}
                      required={formData.job_type === 'ON_SITE' || formData.job_type === 'ROADSIDE'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter the address where service is needed"
                    />
                  </div>
                </div>
              )}

              {/* Preferred Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date
                  </label>
                  <div className="relative">
                    <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="preferred_date"
                      value={formData.preferred_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <div className="relative">
                    <Clock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      name="preferred_time"
                      value={formData.preferred_time}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="customer_notes"
                  value={formData.customer_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Any additional information or special requirements..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Wrench size={18} />
                  <span>{submitting ? 'Submitting...' : 'Submit Hire Request'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HireMechanicPage;
