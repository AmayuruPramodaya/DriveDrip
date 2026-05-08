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
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Phone,
  Mail,
  Edit,
  Plus
} from 'lucide-react';

const MechanicRequestsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user && user.role === 'MECHANIC') {
      fetchMechanicRequests();
    }
  }, [user, filter]);

  const fetchMechanicRequests = async () => {
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
      console.error('Error fetching mechanic requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/hire-requests/${requestId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchMechanicRequests();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRequestUpdate = async (requestId, updateData) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/hire-requests/${requestId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setEditingRequest(null);
        setFormData({});
        fetchMechanicRequests();
      }
    } catch (error) {
      console.error('Error updating request:', error);
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

  const startEditing = (request) => {
    setEditingRequest(request.id);
    setFormData({
      estimated_cost: request.estimated_cost || '',
      scheduled_date: request.scheduled_date || '',
      scheduled_time: request.scheduled_time || '',
      mechanic_notes: request.mechanic_notes || '',
      work_completed: request.work_completed || '',
      parts_used: request.parts_used || '',
      final_cost: request.final_cost || ''
    });
  };

  const handleFormSubmit = (e, requestId) => {
    e.preventDefault();
    handleRequestUpdate(requestId, formData);
  };

  const handleStartChat = (customerUserId, requestId) => {
    navigate(`/chat?participant=${customerUserId}&type=CUSTOMER_MECHANIC&request=${requestId}`);
  };

  if (!user || user.role !== 'MECHANIC') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">This page is only accessible to mechanics</p>
            <button
              onClick={() => navigate('/')}
              className="text-orange-600 hover:text-orange-800"
            >
              Go to Homepage
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Requests</h1>
          <p className="text-gray-600">Manage your incoming service requests</p>
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">No service requests found</h3>
            <p className="text-gray-600">You don't have any service requests yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {requests.map(request => (
              <div key={request.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                      {request.customer.profile_picture ? (
                        <img
                          src={request.customer.profile_picture}
                          alt={request.customer.name}
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
                        {request.customer.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Phone size={14} className="mr-1" />
                          <span>{request.customer.phone_number}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail size={14} className="mr-1" />
                          <span>{request.customer.email}</span>
                        </div>
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
                    <h4 className="font-medium text-gray-900 mb-2">Service Request</h4>
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
                      {request.preferred_date && (
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-2" />
                          <span>Preferred: {new Date(request.preferred_date).toLocaleDateString()}</span>
                          {request.preferred_time && <span> at {request.preferred_time}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Service Details</h4>
                    {editingRequest === request.id ? (
                      <form onSubmit={(e) => handleFormSubmit(e, request.id)} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            placeholder="Estimated Cost"
                            value={formData.estimated_cost}
                            onChange={(e) => setFormData({...formData, estimated_cost: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          {request.status === 'COMPLETED' && (
                            <input
                              type="number"
                              placeholder="Final Cost"
                              value={formData.final_cost}
                              onChange={(e) => setFormData({...formData, final_cost: e.target.value})}
                              className="px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            placeholder="Scheduled Date"
                            value={formData.scheduled_date}
                            onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="time"
                            placeholder="Scheduled Time"
                            value={formData.scheduled_time}
                            onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <textarea
                          placeholder="Mechanic Notes"
                          value={formData.mechanic_notes}
                          onChange={(e) => setFormData({...formData, mechanic_notes: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          rows={2}
                        />
                        {(request.status === 'IN_PROGRESS' || request.status === 'COMPLETED') && (
                          <>
                            <textarea
                              placeholder="Work Completed"
                              value={formData.work_completed}
                              onChange={(e) => setFormData({...formData, work_completed: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              rows={2}
                            />
                            <input
                              type="text"
                              placeholder="Parts Used"
                              value={formData.parts_used}
                              onChange={(e) => setFormData({...formData, parts_used: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </>
                        )}
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRequest(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-600">
                        {request.scheduled_date && (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2" />
                            <span>Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}</span>
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
                            <span>Final: ${request.final_cost}</span>
                          </div>
                        )}
                        {request.work_completed && (
                          <div>
                            <span className="font-medium">Work Done:</span> {request.work_completed}
                          </div>
                        )}
                        {request.parts_used && (
                          <div>
                            <span className="font-medium">Parts:</span> {request.parts_used}
                          </div>
                        )}
                        {request.mechanic_notes && (
                          <div>
                            <span className="font-medium">Notes:</span> {request.mechanic_notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Request #{request.id} • {new Date(request.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleStartChat(request.customer.id, request.id)}
                      className="flex items-center space-x-1 px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>

                    <button
                      onClick={() => startEditing(request)}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>

                    {request.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'ACCEPTED')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {request.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'IN_PROGRESS')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Start Work
                      </button>
                    )}

                    {request.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusUpdate(request.id, 'COMPLETED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Complete
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

export default MechanicRequestsPage;
