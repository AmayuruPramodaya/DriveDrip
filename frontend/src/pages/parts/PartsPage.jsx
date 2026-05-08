import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Filter, Grid, List, Star, MapPin, 
  Car, Package, ShoppingCart, Eye, Heart,
  ChevronDown, SlidersHorizontal, Check, Plus
} from 'lucide-react';
import { sparePartsAPI, vehicleAPI } from '../../services/api';
import { sriLankanLocations, getProvinces, getDistrictsByProvince } from '../../data/locations';
import { useCart } from '../../contexts/CartContext';
import SemanticSearchBox from '../../components/SemanticSearchBox';

const PartsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, getItemQuantity, isItemInCart } = useCart();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [addingToCart, setAddingToCart] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchMode, setSearchMode] = useState('traditional'); // 'traditional' or 'semantic'
  const [semanticResults, setSemanticResults] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    vehicle_brand: '',
    vehicle_model: '',
    condition: '',
    price_min: '',
    price_max: '',
    year_from: '',
    year_to: '',
    shop: '',
    location: '',
    province: '',
    district: ''
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [provinces] = useState(getProvinces());
  const [districts, setDistricts] = useState([]);
  const [showFilters, setShowFilters] = useState(false); // Hidden by default on mobile, shown on desktop via CSS

  useEffect(() => {
    // Check if semantic results were passed from homepage
    if (location.state?.semanticResults) {
      setSemanticResults(location.state.semanticResults);
      setSearchMode('semantic');
      setParts(location.state.semanticResults.results || []);
      setLoading(false);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
      return;
    }

    // Get URL parameters
    const urlParams = new URLSearchParams(location.search);
    const shopId = urlParams.get('shop');
    const searchQuery = urlParams.get('search');
    
    if (shopId) {
      setFilters(prev => ({ ...prev, shop: shopId }));
    }
    
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
    
    fetchParts();
    fetchCategories();
    fetchBrands();
    fetchModels(); // Load all models initially
  }, [location.search]);

  useEffect(() => {
    if (filters.vehicle_brand) {
      fetchModels(filters.vehicle_brand);
      // Clear vehicle model selection when brand changes
      if (filters.vehicle_model) {
        handleFilterChange('vehicle_model', '');
      }
    } else {
      fetchModels(); // Fetch all models when no brand is selected
    }
  }, [filters.vehicle_brand]);

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

  // Auto-fetch parts when filters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchParts();
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, searchTerm]);

  const fetchParts = async () => {
    try {
      setLoading(true);
      
      // Prepare filter parameters for the API - matching backend expectations exactly
      const apiFilters = {};

      // Basic filters
      if (searchTerm) apiFilters.search = searchTerm;
      if (filters.category) apiFilters.category = filters.category;
      if (filters.condition) apiFilters.condition = filters.condition;
      if (filters.vehicle_model) apiFilters.vehicle_model = filters.vehicle_model;
      if (filters.shop) apiFilters.shop = filters.shop;
      if (filters.province) apiFilters.province = filters.province;
      if (filters.district) apiFilters.district = filters.district;

      // Vehicle brand filtering - NOW SUPPORTED
      if (filters.vehicle_brand) apiFilters.vehicle_brand = filters.vehicle_brand;

      // Year range filtering - NOW SUPPORTED
      if (filters.year_from) apiFilters.year_from = filters.year_from;
      if (filters.year_to) apiFilters.year_to = filters.year_to;

      // Price filters - backend expects min_price and max_price
      if (filters.price_min) apiFilters.min_price = filters.price_min;
      if (filters.price_max) apiFilters.max_price = filters.price_max;

      console.log('API Filters being sent:', apiFilters); // Debug log

      const response = await sparePartsAPI.getSpareParts(apiFilters);
      setParts(response.data.results || response.data);
    } catch (err) {
      setError('Failed to fetch parts');
      console.error('Error fetching parts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await sparePartsAPI.getCategories();
      setCategories(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await vehicleAPI.getBrands();
      setBrands(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchModels = async (brandId = null) => {
    try {
      const params = brandId ? { brand: brandId } : {};
      const response = await vehicleAPI.getModels(params);
      setModels(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const handleSearch = () => {
    fetchParts();
  };

  const handleSemanticSearchResults = (results) => {
    setSemanticResults(results);
    setSearchMode('semantic');
    if (results?.results) {
      setParts(results.results);
      setLoading(false);
    }
  };

  const switchToTraditionalSearch = () => {
    setSearchMode('traditional');
    setSemanticResults(null);
    fetchParts();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      vehicle_brand: '',
      vehicle_model: '',
      condition: '',
      price_min: '',
      price_max: '',
      year_from: '',
      year_to: '',
      shop: '',
      location: '',
      province: '',
      district: ''
    });
    setDistricts([]);
    fetchModels(); // Reload all models when filters are cleared
  };

  const handleAddToCart = async (part) => {
    try {
      setAddingToCart(prev => ({ ...prev, [part.id]: true }));
      
      // Check if item is already in cart
      const currentQuantity = getItemQuantity(part.id);
      
      // Check stock availability
      if (currentQuantity >= (part.quantity || 0)) {
        setMessage({ 
          type: 'error', 
          text: `Only ${part.quantity || 0} items available in stock` 
        });
        return;
      }
      
      // Add to cart
      await addToCart(part, 1);
      
      setMessage({ 
        type: 'success', 
        text: `${part.name} added to cart successfully!` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to add item to cart' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setAddingToCart(prev => ({ ...prev, [part.id]: false }));
    }
  };

  const PartCard = ({ part }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-500 flex flex-col h-full border border-white/40 group">
      <div className="relative overflow-hidden">
        {part.main_image ? (
          <img
            src={part.main_image}
            alt={part.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : part.images && part.images.length > 0 ? (
          <img
            src={part.images[0].image}
            alt={part.name}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <button className="absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg">
          <Heart className="w-4 h-4 text-gray-400 hover:text-orange-500 transition-colors duration-300" />
        </button>
        {part.condition && (
          <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            part.condition === 'NEW' ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200' :
            part.condition === 'USED' ? 'bg-amber-100/90 text-amber-800 border border-amber-200' :
            'bg-blue-100/90 text-blue-800 border border-blue-200'
          }`}>
            {part.condition}
          </span>
        )}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-black mb-3 truncate group-hover:text-orange-600 transition-colors duration-300">
          {part.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {part.description}
        </p>
        
        {part.part_number && (
          <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 px-2 py-1 rounded-full inline-block">
            Part #: {part.part_number}
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          {part.category_name && (
            <div className="flex items-center text-sm text-gray-600">
              <Package className="w-4 h-4 mr-2 text-orange-500" />
              <span>{part.category_name}</span>
            </div>
          )}
          
          {part.compatible_vehicles_info && part.compatible_vehicles_info.length > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <Car className="w-4 h-4 mr-2 text-orange-500" />
              <span>{part.compatible_vehicles_info[0].brand_name} {part.compatible_vehicles_info[0].name}</span>
              {part.compatible_vehicles_info.length > 1 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                  +{part.compatible_vehicles_info.length - 1}
                </span>
              )}
            </div>
          )}
          
          {part.shop_name && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-orange-500" />
              <span>{part.shop_name}</span>
            </div>
          )}
          
          {parseFloat(part.average_rating || 0) > 0 && (
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600 font-medium">
                {parseFloat(part.average_rating || 0).toFixed(1)} ({part.total_ratings || 0})
              </span>
            </div>
          )}
        </div>
        
        {/* Price and Stock at bottom */}
        <div className="flex items-center justify-between mb-6 mt-auto">
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
            Rs {parseFloat(part.price || 0).toFixed(2)}
          </span>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
            Stock: {part.quantity || 0}
          </span>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate(`/parts/${part.id}`)}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </button>
          <button 
            onClick={() => handleAddToCart(part)}
            disabled={addingToCart[part.id] || (part.quantity || 0) <= 0}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {addingToCart[part.id] ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                {isItemInCart(part.id) ? 'Added' : 'Add'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const PartListItem = ({ part }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/40 hover:scale-102">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {part.main_image ? (
            <img
              src={part.main_image}
              alt={part.name}
              className="w-20 h-20 object-cover rounded-2xl shadow-md"
            />
          ) : part.images && part.images.length > 0 ? (
            <img
              src={part.images[0].image}
              alt={part.name}
              className="w-20 h-20 object-cover rounded-2xl shadow-md"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-md">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-grow">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-black mb-1">
                {part.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {part.description}
              </p>
              
              {part.part_number && (
                <div className="text-xs text-gray-500 mb-1 font-mono bg-gray-50 px-2 py-1 rounded-full inline-block">
                  Part #: {part.part_number}
                </div>
              )}
              
              {part.category_name && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Package className="w-4 h-4 mr-1 text-orange-500" />
                  <span>{part.category_name}</span>
                </div>
              )}
              
              {part.compatible_vehicles_info && part.compatible_vehicles_info.length > 0 && (
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Car className="w-4 h-4 mr-1 text-orange-500" />
                  <span>{part.compatible_vehicles_info[0].brand_name} {part.compatible_vehicles_info[0].name}</span>
                  {part.compatible_vehicles_info.length > 1 && (
                    <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                      +{part.compatible_vehicles_info.length - 1} more
                    </span>
                  )}
                </div>
              )}
              
              {part.shop_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                  <span>{part.shop_name}</span>
                </div>
              )}
            </div>
            
            <div className="text-right ml-4">
              {part.condition && (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                  part.condition === 'NEW' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  part.condition === 'USED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {part.condition}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 text-right">
          <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-2">
            Rs {parseFloat(part.price || 0).toFixed(2)}
          </div>
          
          <div className="text-sm text-gray-600 mb-2 bg-gray-100 px-3 py-1 rounded-full font-medium">
            Stock: {part.quantity || 0}
          </div>
          
          {parseFloat(part.average_rating || 0) > 0 && (
            <div className="flex items-center justify-end mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600 font-medium">
                {parseFloat(part.average_rating || 0).toFixed(1)} ({part.total_ratings || 0})
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <button 
              onClick={() => navigate(`/parts/${part.id}`)}
              className="px-4 py-2 border-2 border-orange-500 text-orange-500 text-sm font-semibold rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </button>
            <button 
              onClick={() => handleAddToCart(part)}
              disabled={addingToCart[part.id] || (part.quantity || 0) <= 0}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingToCart[part.id] ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {isItemInCart(part.id) ? 'Added' : 'Add'}
                </>
              )}
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
              <Package size={20} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-black">
              Spare Parts
            </h1>
          </div>
          <p className="text-gray-600">
            Find the perfect parts for your vehicle from trusted sellers
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-8 border border-white/20">
          {/* Search Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-full p-1 inline-flex">
              <button
                onClick={() => setSearchMode('traditional')}
                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                  searchMode === 'traditional'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Traditional Search
              </button>
              <button
                onClick={() => setSearchMode('semantic')}
                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                  searchMode === 'semantic'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                AI Search
              </button>
            </div>
          </div>

          {searchMode === 'semantic' ? (
            /* AI-Powered Semantic Search */
            <SemanticSearchBox
              onResults={handleSemanticSearchResults}
              className="mb-4"
            />
          ) : (
            /* Traditional Search */
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-6 lg:space-y-0">
              <div className="flex-grow">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search for parts, brands, models..."
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
                
                <button 
                  onClick={handleSearch} 
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {/* View Mode Toggle - Always Visible */}
          <div className="flex justify-center mt-6">
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
            
            {/* Filters Toggle for Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden ml-4 px-6 py-3 border-2 border-orange-300 text-orange-600 rounded-full hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 font-medium shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </button>
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
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Vehicle Brand
                  </label>
                  <select
                    value={filters.vehicle_brand}
                    onChange={(e) => handleFilterChange('vehicle_brand', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle Model Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Vehicle Model
                  </label>
                  <select
                    value={filters.vehicle_model}
                    onChange={(e) => handleFilterChange('vehicle_model', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Models</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {filters.vehicle_brand && models.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No models available for selected brand
                    </p>
                  )}
                </div>

                {/* Year Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Year Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="From"
                      value={filters.year_from}
                      onChange={(e) => handleFilterChange('year_from', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                      min="1900"
                      max="2025"
                    />
                    <input
                      type="number"
                      placeholder="To"
                      value={filters.year_to}
                      onChange={(e) => handleFilterChange('year_to', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                      min="1900"
                      max="2025"
                    />
                  </div>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Condition
                  </label>
                  <select
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">Any Condition</option>
                    <option value="NEW">New</option>
                    <option value="USED">Used</option>
                    <option value="REFURBISHED">Refurbished</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.price_min}
                      onChange={(e) => handleFilterChange('price_min', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.price_max}
                      onChange={(e) => handleFilterChange('price_max', e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200 text-center"
                      min="0"
                    />
                  </div>
                </div>

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
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2 rotate-45" />
                  )}
                  {message.text}
                </div>
              </div>
            )}

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
                    {parts.length} parts found
                  </h2>
                </div>

                {parts.length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/30">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black mb-2">
                      No parts found
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
                    {parts.map(part => (
                      viewMode === 'grid' 
                        ? <PartCard key={part.id} part={part} />
                        : <PartListItem key={part.id} part={part} />
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

export default PartsPage;
