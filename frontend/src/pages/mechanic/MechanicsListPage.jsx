import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Wrench, 
  Phone, 
  Mail,
  Filter,
  CheckCircle,
  User
} from 'lucide-react';

const MechanicsListPage = () => {
  const navigate = useNavigate();
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    province: '',
    district: '',
    is_mobile: '',
    is_available: 'true',
    specialization: ''
  });
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMechanics();
    fetchVehicleCategories();
  }, [filters]);

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (searchTerm) queryParams.append('search', searchTerm);
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(`http://localhost:8000/api/mechanics/?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setMechanics(data.results || data);
      } else {
        console.error('Failed to fetch mechanics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMechanics();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      province: '',
      district: '',
      is_mobile: '',
      is_available: 'true',
      specialization: ''
    });
    setSearchTerm('');
  };

  const MechanicCard = ({ mechanic }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/40 group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 shadow-lg">
              {mechanic.user.profile_picture ? (
                <img
                  src={mechanic.user.profile_picture}
                  alt={mechanic.user.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User size={28} />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-black group-hover:text-orange-600 transition-colors duration-300">
                  {mechanic.business_name || mechanic.user.name}
                </h3>
                {mechanic.is_verified && (
                  <div className="bg-green-100/90 text-green-800 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center border border-green-200">
                    <CheckCircle size={12} className="mr-1" />
                    Verified
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-gray-600 mb-2">
                <User size={16} className="mr-2 text-orange-500" />
                <span className="text-sm">{mechanic.user.name}</span>
              </div>

              <div className="flex items-center text-yellow-500 mb-2">
                <Star size={16} className="mr-1 fill-current" />
                <span className="font-medium">{Number(mechanic.service_rating || 0).toFixed(1)}</span>
                <span className="text-gray-500 ml-1 text-sm">({mechanic.total_service_ratings} reviews)</span>
              </div>

              <div className="flex items-center text-gray-600 mb-2">
                <Clock size={16} className="mr-2 text-orange-500" />
                <span className="text-sm">{mechanic.years_of_experience} years experience</span>
              </div>

              {mechanic.hourly_rate && (
                <div className="flex items-center text-gray-600 mb-2">
                  <DollarSign size={16} className="mr-2 text-orange-500" />
                  <span className="text-sm font-medium">${mechanic.hourly_rate}/hour</span>
                </div>
              )}

              <div className="flex items-center text-gray-600 mb-3">
                <MapPin size={16} className="mr-2 text-orange-500" />
                <span className="text-sm">{mechanic.district}, {mechanic.province}</span>
                {mechanic.is_mobile && (
                  <span className="ml-2 px-2 py-1 bg-blue-100/90 text-blue-800 text-xs rounded-full border border-blue-200">
                    Mobile Service
                  </span>
                )}
              </div>

              {mechanic.specializations && mechanic.specializations.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {mechanic.specializations.slice(0, 3).map(spec => (
                      <span key={spec.id} className="px-3 py-1 bg-orange-100/90 text-orange-800 text-xs rounded-full border border-orange-200 font-medium">
                        {spec.name}
                      </span>
                    ))}
                    {mechanic.specializations.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100/90 text-gray-600 text-xs rounded-full border border-gray-200">
                        +{mechanic.specializations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons - Right Side */}
          <div className="flex flex-col space-y-3 ml-6">
            <button
              onClick={() => navigate(`/mechanic/${mechanic.id}`)}
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-orange-300 text-orange-600 text-sm font-semibold rounded-full hover:bg-orange-50 hover:border-orange-400 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              <User className="w-4 h-4 mr-2" />
              View Profile
            </button>
            <button
              onClick={() => navigate(`/hire-mechanic/${mechanic.id}`)}
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Hire Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center">
              <Wrench size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-black">
              Professional Mechanics
            </h1>
          </div>
          <p className="text-gray-600">
            Connect with qualified mechanics for all your vehicle needs
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-8 border border-white/20">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-6 lg:space-y-0">
              <div className="flex-grow">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search mechanics by name, business, or location..."
                    className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white shadow-inner text-gray-800 placeholder-gray-400 transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 font-medium shadow-sm flex items-center space-x-2"
                >
                  <Filter size={20} />
                  <span>Filters</span>
                </button>
              </div>
            </div>
          </form>

          {showFilters && (
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-6 mt-6 border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-black flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-orange-500" />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-orange-500 hover:text-orange-600 text-sm font-medium px-4 py-2 rounded-full hover:bg-orange-50 transition-all duration-200"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Province</label>
                  <input
                    type="text"
                    value={filters.province}
                    onChange={(e) => handleFilterChange('province', e.target.value)}
                    placeholder="Enter province"
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">District</label>
                  <input
                    type="text"
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    placeholder="Enter district"
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Specialization</label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => handleFilterChange('specialization', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Specializations</option>
                    {vehicleCategories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Service Type</label>
                  <select
                    value={filters.is_mobile}
                    onChange={(e) => handleFilterChange('is_mobile', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Services</option>
                    <option value="true">Mobile Service</option>
                    <option value="false">Shop Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Availability</label>
                  <select
                    value={filters.is_available}
                    onChange={(e) => handleFilterChange('is_available', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All</option>
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 font-medium">
            {loading ? 'Loading...' : `${mechanics.length} mechanics found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 animate-pulse border border-white/40">
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-full mb-2 w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded-full mb-2 w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : mechanics.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 border border-white/40">
              <Wrench size={64} className="mx-auto text-gray-400 mb-6" />
              <h3 className="text-2xl font-bold text-black mb-3">No mechanics found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {mechanics.map(mechanic => (
              <MechanicCard key={mechanic.id} mechanic={mechanic} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicsListPage;
