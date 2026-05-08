import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Truck,
  Shield,
  Clock,
  Filter,
  Search,
  Grid,
  List,
  ArrowLeft
} from 'lucide-react';
import { shopAPI, sparePartsAPI } from '../../services/api';

const ShopDetailPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partsLoading, setPartsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchShopDetails();
  }, [shopId]);

  useEffect(() => {
    fetchShopParts();
  }, [shopId, currentPage, searchTerm, sortBy, categoryFilter]);

  const fetchShopDetails = async () => {
    try {
      setLoading(true);
      const response = await shopAPI.getShop(shopId);
      setShop(response.data);
    } catch (error) {
      console.error('Error fetching shop details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopParts = async () => {
    setPartsLoading(true);
    try {
      const params = {
        shop: shopId,
        page: currentPage,
        search: searchTerm,
        ordering: sortBy,
        category: categoryFilter
      };
      
      const response = await sparePartsAPI.getAll(params);
      setParts(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 12));
    } catch (error) {
      console.error('Error fetching shop parts:', error);
    } finally {
      setPartsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const addToCart = (part) => {
    const cart = JSON.parse(localStorage.getItem('driveDripCart') || '[]');
    const existingItem = cart.find(item => item.id === part.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...part, quantity: 1 });
    }
    
    localStorage.setItem('driveDripCart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  const addToWishlist = (part) => {
    const wishlist = JSON.parse(localStorage.getItem('driveDripWishlist') || '[]');
    const exists = wishlist.find(item => item.id === part.id);
    
    if (!exists) {
      wishlist.push({ ...part, date_added: new Date().toISOString() });
      localStorage.setItem('driveDripWishlist', JSON.stringify(wishlist));
      alert('Added to wishlist!');
    } else {
      alert('Already in wishlist!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Shop Not Found</h2>
          <button 
            onClick={() => navigate('/shops')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/shops')}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
              <ArrowLeft size={20} />
            </div>
            <span className="font-medium">Back to Shops</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-8">
            <div className="flex items-center space-x-6 mb-4 lg:mb-0">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-gray-200">
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.name} className="w-16 h-16 object-cover rounded-2xl" />
                ) : (
                  <Package size={32} className="text-orange-500" />
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-black mb-2">{shop.name}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="font-medium">{parseFloat(shop.average_rating || 0).toFixed(1)}</span>
                    <span>({shop.total_reviews || 0} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                    <Package size={16} className="text-orange-500" />
                    <span className="font-medium">{shop.total_parts || 0} parts</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                    <Calendar size={16} className="text-orange-500" />
                    <span className="font-medium">Since {new Date(shop.created_at).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                shop.is_verified 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                <Shield size={14} className="inline mr-1" />
                {shop.is_verified ? 'Verified Shop' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Info */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Shop Details */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6 border border-white/30">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-orange-500" />
                Shop Information
              </h3>
              
              <div className="space-y-4">
                {shop.description && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">About</h4>
                    <p className="text-gray-600 text-sm">{shop.description}</p>
                  </div>
                )}
                
                {shop.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin size={16} className="text-orange-500 mt-1" />
                    <div>
                      <h4 className="font-medium text-gray-700">Address</h4>
                      <p className="text-gray-600 text-sm">{shop.address}</p>
                    </div>
                  </div>
                )}
                
                {shop.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-orange-500" />
                    <div>
                      <h4 className="font-medium text-gray-700">Phone</h4>
                      <p className="text-gray-600 text-sm">{shop.phone}</p>
                    </div>
                  </div>
                )}
                
                {shop.email && (
                  <div className="flex items-center space-x-3">
                    <Mail size={16} className="text-orange-500" />
                    <div>
                      <h4 className="font-medium text-gray-700">Email</h4>
                      <p className="text-gray-600 text-sm">{shop.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Clock size={16} className="text-orange-500" />
                  <div>
                    <h4 className="font-medium text-gray-700">Business Hours</h4>
                    <p className="text-gray-600 text-sm">
                      {shop.business_hours || 'Contact shop for hours'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parts Section */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-6 border border-white/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search parts..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10 pr-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                    />
                  </div>
                  
                  <select
                    value={categoryFilter}
                    onChange={handleCategoryChange}
                    className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="">All Categories</option>
                    <option value="ENGINE">Engine Parts</option>
                    <option value="BRAKES">Brake System</option>
                    <option value="SUSPENSION">Suspension</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="BODY">Body Parts</option>
                    <option value="INTERIOR">Interior</option>
                    <option value="EXTERIOR">Exterior</option>
                    <option value="FILTERS">Filters</option>
                    <option value="OILS">Oils & Fluids</option>
                    <option value="TIRES">Tires & Wheels</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                  >
                    <option value="created_at">Newest First</option>
                    <option value="-created_at">Oldest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                    <option value="-name">Name: Z to A</option>
                  </select>
                  
                  <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        viewMode === 'grid' 
                          ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                          : 'text-gray-500 hover:bg-white hover:text-gray-700'
                      }`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-full transition-all duration-300 ${
                        viewMode === 'list' 
                          ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                          : 'text-gray-500 hover:bg-white hover:text-gray-700'
                      }`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Parts Grid/List */}
            {partsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading parts...</p>
              </div>
            ) : parts.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-12 text-center border border-white/30">
                <Package size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">No Parts Found</h3>
                <p className="text-gray-600">This shop doesn't have any parts matching your criteria.</p>
              </div>
            ) : (
              <div className={`${
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }`}>
                {parts.map((part) => (
                  <div key={part.id} className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/30 ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}>
                    <div className={`${viewMode === 'list' ? 'w-48' : 'h-48'} bg-gray-200 flex items-center justify-center`}>
                      {part.main_image ? (
                        <img 
                          src={part.main_image} 
                          alt={part.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={64} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-black line-clamp-2">{part.name}</h3>
                        <button
                          onClick={() => addToWishlist(part)}
                          className="text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <Star size={20} />
                        </button>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{part.description}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold text-orange-600">
                          ${parseFloat(part.price || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Stock: {part.quantity || 0}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => addToCart(part)}
                          disabled={!part.quantity || part.quantity === 0}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2 px-4 rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => navigate(`/parts/${part.id}`)}
                          className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 hover:scale-105 transition-all duration-300 font-medium"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-black font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailPage;
