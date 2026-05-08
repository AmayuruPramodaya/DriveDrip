import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  Calendar,
  CheckCircle,
  User,
  Wrench,
  MessageCircle,
  ArrowLeft,
  Shield,
  Building,
  Edit,
  Save,
  X
} from 'lucide-react';

const MechanicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mechanic, setMechanic] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Check if this is the mechanic's own profile
  const isOwnProfile = user && mechanic && user.id === mechanic.user.id;

  useEffect(() => {
    if (id) {
      fetchMechanicDetails();
      fetchMechanicServices();
      fetchMechanicReviews();
    }
  }, [id]);

  const fetchMechanicDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/mechanics/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setMechanic(data);
        setEditForm({
          business_name: data.business_name || '',
          business_address: data.business_address || '',
          service_area: data.service_area || '',
          hourly_rate: data.hourly_rate || '',
          is_mobile: data.is_mobile || false,
          is_available: data.is_available || true
        });
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
    }
  };

  const fetchMechanicReviews = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reviews/?reviewed_mechanic=${id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    // Navigate to chat with this mechanic
    navigate(`/chat?participant=${mechanic.user.id}&type=CUSTOMER_MECHANIC`);
  };

  const handleHire = () => {
    navigate(`/hire-mechanic/${id}`);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    setEditForm({
      business_name: mechanic.business_name || '',
      business_address: mechanic.business_address || '',
      service_area: mechanic.service_area || '',
      hourly_rate: mechanic.hourly_rate || '',
      is_mobile: mechanic.is_mobile || false,
      is_available: mechanic.is_available || true
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/mechanics/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setMechanic(updatedData);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!mechanic) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
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
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {mechanic.user.profile_picture ? (
                  <img
                    src={mechanic.user.profile_picture}
                    alt={mechanic.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={32} />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-3">
                    {mechanic.business_name || mechanic.user.name}
                  </h1>
                  {mechanic.is_verified && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle size={20} className="mr-1" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600 mb-2">
                  <User size={16} className="mr-2" />
                  <span>{mechanic.user.name}</span>
                </div>

                <div className="flex items-center text-yellow-500 mb-2">
                  <Star size={18} className="mr-1 fill-current" />
                  <span className="font-medium text-lg">{Number(mechanic.service_rating || 0).toFixed(1)}</span>
                  <span className="text-gray-500 ml-2">({mechanic.total_service_ratings} reviews)</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <Clock size={16} className="mr-2" />
                  <span>{mechanic.years_of_experience} years of experience</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin size={16} className="mr-2" />
                  <span>{mechanic.district}, {mechanic.province}</span>
                  {mechanic.is_mobile && (
                    <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Mobile Service Available
                    </span>
                  )}
                </div>

                {mechanic.hourly_rate && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign size={16} className="mr-2" />
                    <span className="font-medium">${mechanic.hourly_rate}/hour</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              {isOwnProfile ? (
                // Own profile - show edit buttons
                <div className="flex flex-col space-y-3">
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                    >
                      <Edit size={18} />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      mechanic.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mechanic.is_available ? 'Available for Jobs' : 'Currently Unavailable'}
                    </span>
                  </div>
                </div>
              ) : (
                // Public profile - show hire/chat buttons
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleHire}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                  >
                    <Wrench size={18} />
                    <span>Hire Mechanic</span>
                  </button>
                  
                  {user && (
                    <button
                      onClick={handleStartChat}
                      className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2"
                    >
                      <MessageCircle size={18} />
                      <span>Start Chat</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {['about', 'services', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Information</h3>
                  
                  {isEditing && isOwnProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                        <input
                          type="text"
                          value={editForm.business_name}
                          onChange={(e) => handleFormChange('business_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter business name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                        <textarea
                          value={editForm.business_address}
                          onChange={(e) => handleFormChange('business_address', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter complete business address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
                        <textarea
                          value={editForm.service_area}
                          onChange={(e) => handleFormChange('service_area', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Describe areas you provide service to"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                        <input
                          type="number"
                          value={editForm.hourly_rate}
                          onChange={(e) => handleFormChange('hourly_rate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter hourly rate"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.is_mobile}
                            onChange={(e) => handleFormChange('is_mobile', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Mobile Service Available</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.is_available}
                            onChange={(e) => handleFormChange('is_available', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Currently Available</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mechanic.business_name && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Business Name: </span>
                          <span className="text-gray-900">{mechanic.business_name}</span>
                        </div>
                      )}
                      
                      {mechanic.business_address && (isOwnProfile || mechanic.business_address) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                            <Building size={16} className="mr-2" />
                            Business Address
                          </h4>
                          <p className="text-gray-600">{mechanic.business_address}</p>
                        </div>
                      )}
                      
                      {mechanic.service_area && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Service Area</h4>
                          <p className="text-gray-600">{mechanic.service_area}</p>
                        </div>
                      )}
                      
                      {mechanic.hourly_rate && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Hourly Rate: </span>
                          <span className="text-gray-900 font-semibold">${mechanic.hourly_rate}/hour</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Professional Information - Always visible */}
                {(isOwnProfile || mechanic.license_number) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Shield size={18} className="mr-2" />
                      Professional Information
                    </h3>
                    <div className="space-y-2">
                      {mechanic.license_number && (
                        <p className="text-gray-600">License Number: {mechanic.license_number}</p>
                      )}
                      <p className="text-gray-600">Years of Experience: {mechanic.years_of_experience}</p>
                      {isOwnProfile && (
                        <div>
                          <p className="text-gray-600">Account Status: 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              mechanic.is_verified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {mechanic.is_verified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mechanic.specializations && mechanic.specializations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {mechanic.specializations.map(spec => (
                        <span key={spec.id} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                          {spec.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{mechanic.total_jobs_completed}</div>
                      <div className="text-sm text-gray-600">Jobs Completed</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{mechanic.years_of_experience}</div>
                      <div className="text-sm text-gray-600">Years Experience</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{Number(mechanic.service_rating || 0).toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{mechanic.total_service_ratings}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Contact Information - Only for mechanic's own profile */}
                {isOwnProfile && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Mail size={16} className="mr-2" />
                        <span>{mechanic.user.email}</span>
                      </div>
                      {mechanic.user.mobile_no && (
                        <div className="flex items-center text-gray-600">
                          <Phone size={16} className="mr-2" />
                          <span>{mechanic.user.mobile_no}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
                {services.length === 0 ? (
                  <p className="text-gray-600">No services listed yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(service => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <span className="text-sm text-gray-500">{service.service_type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-orange-600 font-medium">
                            ${service.base_price}
                            {service.price_per_hour && ` + $${service.price_per_hour}/hr`}
                          </div>
                          {service.estimated_duration && (
                            <div className="text-sm text-gray-500">
                              ~{Math.floor(service.estimated_duration / 60)}h {service.estimated_duration % 60}min
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-gray-600">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                            {review.rating && (
                              <div className="flex items-center ml-2">
                                <Star size={14} className="text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600 ml-1">{review.rating.rating}/5</span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                        <p className="text-gray-600">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicProfilePage;
