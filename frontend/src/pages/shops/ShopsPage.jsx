import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, MapPin, Star, Phone, Mail, Globe, 
  Search, Filter, Grid, List, Plus, Eye,
  Clock, Users, Package, Award, SlidersHorizontal
} from 'lucide-react';
import { shopAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { sriLankanLocations, getProvinces, getDistrictsByProvince } from '../../data/locations';

const ShopsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    rating_min: '',
    verified_only: false,
    province: '',
    district: ''
  });
  const [provinces] = useState(getProvinces());
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    fetchShops();
  }, []);

  // Auto-fetch shops when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShops();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  useEffect(() => {
    if (filters.province) {
      const newDistricts = getDistrictsByProvince(filters.province);
      setDistricts(newDistricts);
      // Reset district when province changes
      if (filters.district && !newDistricts.includes(filters.district)) {
        handleFilterChange('district', '');
      }
    } else {
      setDistricts([]);
    }
  }, [filters.province]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.getShops({
        search: searchTerm,
        ...filters,
      });
      setShops(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch shops');
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchShops();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      rating_min: '',
      verified_only: false,
      province: '',
      district: ''
    });
    setDistricts([]);
  };

  const handleCreateShop = () => {
    navigate('/add-shop');
  };

  const handleViewShop = (shopId) => {
    navigate(`/shops/${shopId}`);
  };

  const handleBrowseShopParts = (shopId) => {
    navigate(`/parts?shop=${shopId}`);
  };

  const ShopCard = ({ shop }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-500 border border-white/40 group">
      <div className="relative overflow-hidden">
        {shop.logo ? (
          <img
            src={shop.logo}
            alt={shop.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Store className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {shop.is_verified && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-100/90 text-green-800 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm flex items-center border border-green-200">
              <Award className="w-3 h-3 mr-1" />
              Verified
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-black truncate group-hover:text-orange-600 transition-colors duration-300">
            {shop.name}
          </h3>
          {parseFloat(shop.average_rating || 0) > 0 && (
            <div className="flex items-center ml-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600 font-medium">
                {parseFloat(shop.average_rating || 0).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {shop.description || 'Quality automotive parts and accessories'}
        </p>
        
        <div className="space-y-2 mb-4">
          {shop.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
              <span className="truncate">{shop.location}</span>
            </div>
          )}
          
          {shop.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
              <span>{shop.phone}</span>
            </div>
          )}
          
          {shop.website && (
            <div className="flex items-center text-sm text-gray-600">
              <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-orange-500" />
              <a 
                href={shop.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 truncate font-medium"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
          <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
            <Package className="w-4 h-4 mr-1 text-orange-500" />
            <span>{shop.total_parts || 0} parts</span>
          </div>
          <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
            <Users className="w-4 h-4 mr-1 text-orange-500" />
            <span>{shop.total_customers || 0} customers</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleViewShop(shop.id)}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Shop
          </button>
          <button 
            onClick={() => handleBrowseShopParts(shop.id)}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Package className="w-4 h-4 mr-2" />
            Browse Parts
          </button>
        </div>
      </div>
    </div>
  );

  const ShopListItem = ({ shop }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/40 hover:scale-102">
      <div className="flex items-center space-x-6">
        <div className="flex-shrink-0">
          {shop.logo ? (
            <img
              src={shop.logo}
              alt={shop.name}
              className="w-20 h-20 object-cover rounded-2xl shadow-md"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-md">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold text-black">
                  {shop.name}
                </h3>
                {shop.is_verified && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center border border-green-200">
                    <Award className="w-3 h-3 mr-1" />
                    Verified
                  </div>
                )}
              </div>
              
              {parseFloat(shop.average_rating || 0) > 0 && (
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">
                    {parseFloat(shop.average_rating || 0).toFixed(1)} ({shop.total_reviews || 0} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mb-3 line-clamp-2">
            {shop.description || 'Quality automotive parts and accessories'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {shop.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                <span>{shop.location}</span>
              </div>
            )}
            
            {shop.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-orange-500" />
                <span>{shop.phone}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-gray-600">
              <Package className="w-4 h-4 mr-2 text-orange-500" />
              <span>{shop.total_parts || 0} parts available</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-orange-500" />
              <span>{shop.total_customers || 0} customers</span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex flex-col space-y-2">
          <button 
            onClick={() => handleViewShop(shop.id)}
            className="px-4 py-2 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Shop
          </button>
          <button 
            onClick={() => handleBrowseShopParts(shop.id)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300"
          >
            <Package className="w-4 h-4 mr-1" />
            Browse Parts
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-black flex items-center justify-center">
                  <Store size={20} className="text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-black">
                  Auto Shops
                </h1>
              </div>
              <p className="text-gray-600">
                Discover trusted automotive shops and service providers
              </p>
            </div>
            
            {user?.role === 'SELLER' && (
              <button 
                onClick={handleCreateShop}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Shop
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-6 lg:space-y-0">
            <div className="flex-grow">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search shops, services, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-0 rounded-full focus:ring-4 focus:ring-orange-200 focus:bg-white shadow-inner text-gray-800 placeholder-gray-400 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 font-medium shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
              
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-full transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-500 hover:bg-white hover:text-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-full transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-500 hover:bg-white hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={handleSearch} 
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 sticky top-4 border border-white/30">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-black flex items-center">
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

              <div className="space-y-6">
                

                {/* Province Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Province
                  </label>
                  <select
                    value={filters.province}
                    onChange={(e) => handleFilterChange('province', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Provinces</option>
                    {provinces.map(province => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    District
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={!filters.province}
                  >
                    <option value="">All Districts</option>
                    {districts.map(district => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.rating_min}
                    onChange={(e) => handleFilterChange('rating_min', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">Any Rating</option>
                    <option value="4">4+ Stars</option>
                    <option value="3">3+ Stars</option>
                    <option value="2">2+ Stars</option>
                  </select>
                </div>

                {/* Verified Only Filter */}
                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.verified_only}
                      onChange={(e) => handleFilterChange('verified_only', e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-black">
                      Verified Shops Only
                    </span>
                  </label>
                </div>

                {/* Apply Filters Button */}
                <button
                  onClick={fetchShops}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-50 p-6 mb-8 border-l-4 border-red-500 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">
                    {shops.length} shops found
                  </h2>
                </div>

                {shops.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/30">
                    <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">
                      No shops found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search criteria or filters
                    </p>
                  </div>
                ) : (
                  <div className={
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  }>
                    {shops.map(shop => (
                      viewMode === 'grid' 
                        ? <ShopCard key={shop.id} shop={shop} />
                        : <ShopListItem key={shop.id} shop={shop} />
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

export default ShopsPage;
