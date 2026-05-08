import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  MessageCircle, 
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench
} from 'lucide-react';

const MyHireRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchHireRequests();
    }
  }, [user, filter]);

  const fetchHireRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      let url = 'http://localhost:8000/api/hire-requests/';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching hire requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'ACCEPTED': return <CheckCircle size={16} />;
      case 'IN_PROGRESS': return <Wrench size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      case 'CANCELLED': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/hire-requests/${requestId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      });

      if (response.ok) {
        fetchHireRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleRateAndReview = (requestId) => {
    navigate(`/rate-mechanic/${requestId}`);
  };

  const handleStartChat = (mechanicUserId, requestId) => {
    navigate(`/chat?participant=${mechanicUserId}&type=CUSTOMER_MECHANIC&request=${requestId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Login Required</h3>
            <button
              onClick={() => navigate('/login')}
              className="text-orange-600 hover:text-orange-800"
            >
              Login to view your hire requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Hire Requests</h1>
          <p className="text-gray-600">Track your mechanic service requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { key: 'all', label: 'All Requests' },
                { key: 'PENDING', label: 'Pending' },
                { key: 'ACCEPTED', label: 'Accepted' },
                { key: 'IN_PROGRESS', label: 'In Progress' },
                { key: 'COMPLETED', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hire requests found</h3>
            <p className="text-gray-600 mb-4">You haven't hired any mechanics yet</p>
            <button
              onClick={() => navigate('/mechanics')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Find Mechanics
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map(request => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {request.mechanic.user.profile_picture ? (
                        <img
                          src={request.mechanic.user.profile_picture}
                          alt={request.mechanic.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.mechanic.business_name || request.mechanic.user.name}
                      </h3>
                      <p className="text-gray-600">{request.mechanic.user.name}</p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span>{request.mechanic.district}, {request.mechanic.province}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1">{request.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Problem:</span> {request.problem_description}
                      </div>
                      <div>
                        <span className="font-medium">Vehicle:</span> {request.vehicle_info}
                      </div>
                      <div>
                        <span className="font-medium">Service Type:</span> {request.job_type.replace('_', ' ')}
                      </div>
                      {request.service_location && (
                        <div>
                          <span className="font-medium">Location:</span> {request.service_location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Schedule & Pricing</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {request.preferred_date && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          <span>Preferred: {new Date(request.preferred_date).toLocaleDateString()}</span>
                          {request.preferred_time && <span> at {request.preferred_time}</span>}
                        </div>
                      )}
                      {request.scheduled_date && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          <span className="font-medium">Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}</span>
                          {request.scheduled_time && <span> at {request.scheduled_time}</span>}
                        </div>
                      )}
                      {request.estimated_cost && (
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-2" />
                          <span>Estimated: ${request.estimated_cost}</span>
                        </div>
                      )}
                      {request.final_cost && (
                        <div className="flex items-center">
                          <DollarSign size={14} className="mr-2" />
                          <span className="font-medium">Final: ${request.final_cost}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {request.work_completed && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Work Completed</h4>
                    <p className="text-green-700 text-sm">{request.work_completed}</p>
                    {request.parts_used && (
                      <p className="text-green-700 text-sm mt-1">
                        <span className="font-medium">Parts Used:</span> {request.parts_used}
                      </p>
                    )}
                  </div>
                )}

                {request.mechanic_notes && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Mechanic Notes</h4>
                    <p className="text-blue-700 text-sm">{request.mechanic_notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Request #_{request.id} • Created {new Date(request.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleStartChat(request.mechanic.user.id, request.id)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>

                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        Cancel
                      </button>
                    )}

                    {request.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleRateAndReview(request.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Star size={16} />
                        <span>Rate & Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHireRequestsPage;
