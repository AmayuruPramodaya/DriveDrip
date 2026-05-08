import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Star, 
  Package, 
  ShoppingCart,
  Trash2,
  Eye,
  Filter,
  Search
} from 'lucide-react';

const WishlistPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_added');

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [wishlistItems, searchTerm, sortBy]);

  const loadWishlist = () => {
    // Load wishlist from localStorage for now
    // In a real app, this would be fetched from the API
    const savedWishlist = localStorage.getItem('driveDripWishlist');
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist);
        setWishlistItems(wishlist);
      } catch (error) {
        console.error('Error parsing wishlist data:', error);
        localStorage.removeItem('driveDripWishlist');
      }
    }
    setLoading(false);
  };

  const filterAndSortItems = () => {
    let filtered = [...wishlistItems];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price_low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'rating':
          return parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0);
        case 'date_added':
        default:
          return new Date(b.date_added || 0) - new Date(a.date_added || 0);
      }
    });

    setFilteredItems(filtered);
  };

  const removeFromWishlist = (partId) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== partId);
    setWishlistItems(updatedWishlist);
    localStorage.setItem('driveDripWishlist', JSON.stringify(updatedWishlist));
  };

  const addToCart = (part) => {
    // Get current cart
    const savedCart = localStorage.getItem('driveDripCart');
    let cart = [];
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === part.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.push({
        ...part,
        quantity: 1
      });
    }

    // Save cart
    localStorage.setItem('driveDripCart', JSON.stringify(cart));
    
    // Optional: Show success message or navigate to cart
    alert('Added to cart!');
  };

  const moveAllToCart = () => {
    wishlistItems.forEach(item => addToCart(item));
    // Clear wishlist
    setWishlistItems([]);
    localStorage.removeItem('driveDripWishlist');
    navigate('/cart');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart size={48} className="text-automotive-steel mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-automotive-darkblue mb-2">Please Login</h2>
          <p className="text-automotive-steel mb-4">You need to login to view your wishlist.</p>
          <button 
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="automotive-header px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart size={24} className="text-white" />
                <h1 className="text-2xl font-bold text-white">My Wishlist</h1>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {wishlistItems.length} items
                </span>
              </div>
              {wishlistItems.length > 0 && (
                <button
                  onClick={moveAllToCart}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ShoppingCart size={16} />
                  <span>Move All to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          {wishlistItems.length > 0 && (
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                    Search Items
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search your wishlist..."
                      className="input-automotive pl-10"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-automotive-steel" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-automotive-darkblue mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-automotive"
                  >
                    <option value="date_added">Date Added</option>
                    <option value="name">Name</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wishlist Items */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Heart size={48} className="text-automotive-steel mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-automotive-darkblue mb-2">Your wishlist is empty</h3>
            <p className="text-automotive-steel mb-6">Save your favorite spare parts for later</p>
            <button 
              onClick={() => navigate('/parts')}
              className="btn-primary"
            >
              Browse Parts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((part) => (
              <div key={part.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  {part.main_image ? (
                    <img 
                      src={part.main_image} 
                      alt={part.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <Package size={48} className="text-automotive-steel" />
                    </div>
                  )}
                  
                  {/* Remove from wishlist button */}
                  <button
                    onClick={() => removeFromWishlist(part.id)}
                    className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Rating badge */}
                  {parseFloat(part.average_rating || 0) > 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="badge-primary flex items-center space-x-1">
                        <Star size={14} className="text-secondary-400" />
                        <span>{parseFloat(part.average_rating || 0).toFixed(1)}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-automotive-darkblue mb-1 line-clamp-2">
                    {part.name}
                  </h3>
                  <p className="text-sm text-automotive-steel mb-2">{part.category_name}</p>
                  {part.part_number && (
                    <p className="text-xs text-automotive-steel mb-3">Part #: {part.part_number}</p>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary-600">
                      ${part.price}
                    </span>
                    <span className="text-sm text-automotive-steel">
                      {part.seller_name || 'Unknown Seller'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/parts/${part.id}`)}
                      className="flex-1 btn-outline flex items-center justify-center space-x-1"
                    >
                      <Eye size={16} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => addToCart(part)}
                      className="flex-1 btn-primary flex items-center justify-center space-x-1"
                    >
                      <ShoppingCart size={16} />
                      <span>Add to Cart</span>
                    </button>
                  </div>

                  {part.date_added && (
                    <p className="text-xs text-automotive-steel mt-3 text-center">
                      Added {new Date(part.date_added).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results from filter */}
        {!loading && wishlistItems.length > 0 && filteredItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Search size={48} className="text-automotive-steel mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-automotive-darkblue mb-2">No items found</h3>
            <p className="text-automotive-steel">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
