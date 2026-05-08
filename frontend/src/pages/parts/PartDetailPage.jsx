import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { 
  Package, 
  Star, 
  ShoppingCart, 
  Heart,
  Truck,
  Shield,
  Calendar,
  Car,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  MessageSquareQuote,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { sparePartsAPI, shopAPI, reviewAPI, chatAPI } from '../../services/api';
import CompatibilityChatbot from '../../components/CompatibilityChatbot';

const PartDetailPage = () => {
  const { partId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart: addItemToCart } = useCart();
  
  const [part, setPart] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    fetchPartDetails();
  }, [partId]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (part && part.total_ratings > 2) { // Fetch only if there are reviews
        setSummaryLoading(true);
        try {
          console.log('Fetching review summary for part ID:', part.id);
          const response = await sparePartsAPI.getReviewSummary(part.id);
          console.log('Review summary response:', response.data);
          setSummary(response.data);
        } catch (error) {
          console.error("Failed to fetch review summary", error);
          console.error("Error response:", error.response);
          // Don't show error to user for summary fetch failure
        } finally {
          setSummaryLoading(false);
        }
      }
    };
    
    if (part) {
      fetchSummary();
      fetchReviews(); // Always fetch reviews regardless of user login status
    }
  }, [part]); // Depend on 'part' to run after part details are fetched

  const fetchPartDetails = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      
      console.log('Fetching part with ID:', partId);
      
      const response = await sparePartsAPI.getDetail(partId);
      console.log('API Response:', response);
      
      const partData = response.data;
      console.log('Part data:', partData);
      
      if (!partData) {
        setMessage({ type: 'error', text: 'Part not found' });
        return;
      }
      
      setPart(partData);
      
      if (partData.main_image) {
        setSelectedImage(0);
      }
      
      // Fetch shop details if available
      if (partData.shop) {
        try {
          console.log('Fetching shop details for shop ID:', partData.shop);
          const shopResponse = await shopAPI.getShopDetail(partData.shop);
          console.log('Shop response:', shopResponse);
          setShop(shopResponse.data);
        } catch (error) {
          console.error('Error fetching shop details:', error);
          // Don't show error to user for shop fetch failure
        }
      }
    } catch (error) {
      console.error('Error fetching part details:', error);
      console.error('Error response:', error.response);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to load part details. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      console.log('Fetching reviews for part ID:', part.id);
      
      const response = await reviewAPI.getReviews({ 
        reviewed_spare_part: parseInt(part.id),
        ordering: '-created_at'
      });
      
      console.log('Reviews response:', response.data);
      const reviewsData = response.data.results || response.data || [];
      setReviews(reviewsData);
      
      // Check if current user has already reviewed this part (only if user is logged in)
      if (user) {
        const userReviewExists = reviewsData.some(
          review => review.reviewer === user.id
        );
        setUserHasReviewed(userReviewExists);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      console.error('Error response:', error.response);
      // Don't fail silently - still try to show what we can
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setUserRating(rating);
  };

  const submitReview = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to submit a review' });
      return;
    }

    if (!userRating) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    if (!userReview.trim()) {
      setMessage({ type: 'error', text: 'Please write a review' });
      return;
    }

    try {
      setSubmittingReview(true);

      // Submit rating first
      await reviewAPI.rateItem({
        rating_type: 'SPARE_PART',
        target_id: parseInt(part.id),
        rating: userRating
      });

      // Submit review
      await reviewAPI.createReview({
        reviewed_spare_part: parseInt(part.id),
        review_type: 'SPARE_PART',
        title: `Review for ${part.name}`,
        content: userReview.trim(),
        rating: userRating
      });

      setMessage({ type: 'success', text: 'Review submitted successfully!' });
      setShowReviewForm(false);
      setUserRating(0);
      setUserReview('');
      setUserHasReviewed(true);
      
      // Refresh reviews and part details
      fetchReviews();
      fetchPartDetails();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Failed to submit review' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Star Rating Component
  const StarRating = ({ rating, onRatingClick, interactive = false, size = 20 }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingClick && onRatingClick(star)}
            disabled={!interactive}
            className={`${interactive ? 'hover:scale-110 transition-transform cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={`${
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  // Individual Review Component
  const ReviewItem = ({ review }) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-semibold">
              {review.reviewer_name ? review.reviewer_name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <h5 className="font-medium text-black">
              {review.reviewer_name || 'Anonymous User'}
            </h5>
            <div className="flex items-center space-x-2">
              <StarRating rating={review.rating || 0} size={16} />
              <span className="text-sm text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed">{review.content || review.review}</p>
    </div>
  );

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (part?.quantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const addToCart = () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to add items to cart' });
      return;
    }

    if (user.role !== 'BUYER') {
      setMessage({ type: 'error', text: 'Only buyers can add items to cart' });
      return;
    }

    if (!part.quantity || part.quantity === 0) {
      setMessage({ type: 'error', text: 'This item is out of stock' });
      return;
    }

    try {
      // Create cart item with proper structure
      const cartItem = {
        id: part.id,
        name: part.name,
        price: parseFloat(part.price || 0),
        image: part.main_image,
        seller: part.seller_username || 'Unknown',
        shop: part.shop_name || 'Unknown Shop',
        condition: part.condition,
        part_number: part.part_number,
        quantity: quantity,
        max_quantity: part.quantity
      };

      // Use the context method to add to cart
      addItemToCart(cartItem, quantity);
      
      setMessage({ type: 'success', text: `Added ${quantity} item(s) to cart successfully!` });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setMessage({ type: 'error', text: 'Failed to add item to cart. Please try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const addToWishlist = () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to add items to wishlist' });
      return;
    }

    const wishlist = JSON.parse(localStorage.getItem('driveDripWishlist') || '[]');
    const exists = wishlist.find(item => item.id === part.id);
    
    if (!exists) {
      wishlist.push({ ...part, date_added: new Date().toISOString() });
      localStorage.setItem('driveDripWishlist', JSON.stringify(wishlist));
      setMessage({ type: 'success', text: 'Added to wishlist!' });
    } else {
      setMessage({ type: 'error', text: 'Already in wishlist!' });
    }
    
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const startChat = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please login to chat with sellers' });
      return;
    }

    if (user.role !== 'BUYER') {
      setMessage({ type: 'error', text: 'Only buyers can start chats with sellers' });
      return;
    }

    if (!part.seller || user.id === part.seller) {
      setMessage({ type: 'error', text: 'You cannot chat with yourself' });
      return;
    }

    try {
      // Create or find existing conversation
      const conversationData = {
        seller: part.seller,
        related_spare_part: part.id
      };

      const response = await chatAPI.createConversation(conversationData);
      
      // Navigate to chat page
      navigate('/chat');
      
      setMessage({ type: 'success', text: 'Chat started! Redirecting to messages...' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      // If conversation already exists, the backend will return an error
      // In that case, just redirect to chat
      if (error.response?.status === 400) {
        navigate('/chat');
        setMessage({ type: 'success', text: 'Opening existing conversation...' });
      } else {
        console.error('Error starting chat:', error);
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.detail || 'Failed to start chat. Please try again.' 
        });
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'NEW':
        return 'bg-green-100 text-green-800';
      case 'USED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFURBISHED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case 'NEW':
        return 'Brand New';
      case 'USED':
        return 'Used';
      case 'REFURBISHED':
        return 'Refurbished';
      default:
        return condition;
    }
  };

  // Review Summary Component
  const ReviewSummary = () => {
    if (summaryLoading) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      );
    }

    // Don't show anything if there are not enough reviews
    if (!part || !part.total_ratings || part.total_ratings < 3) {
      return null;
    }

    // Handle case where summary is just a message about not enough reviews
    if (summary && summary.summary && !summary.overall_summary) {
      return null; // Don't show if backend says not enough reviews
    }

    if (!summary || !summary.overall_summary) return null;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
        <h3 className="text-xl font-bold text-black mb-4 flex items-center">
          <MessageSquareQuote className="mr-2 text-orange-500" size={20} /> 
          AI Review Summary
        </h3>
        <p className="text-gray-700 mb-6 italic leading-relaxed">"{summary.overall_summary}"</p>
        
        {(summary.pros || summary.cons) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summary.pros && summary.pros.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                  <ThumbsUp className="mr-2" size={16} /> Pros
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  {summary.pros.map((pro, index) => (
                    <li key={index} className="leading-relaxed">{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {summary.cons && summary.cons.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                  <ThumbsDown className="mr-2" size={16} /> Cons
                </h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
                  {summary.cons.map((con, index) => (
                    <li key={index} className="leading-relaxed">{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-black text-xl">Loading part details...</div>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-black">Part Not Found</h2>
          <button 
            onClick={() => navigate('/parts')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Back to Parts
          </button>
        </div>
      </div>
    );
  }

  const images = [];
  
  // Add main image if it exists
  if (part.main_image) {
    // Handle both full URL and relative path
    const mainImageUrl = part.main_image.startsWith('http') 
      ? part.main_image 
      : `http://localhost:8000${part.main_image}`;
    images.push(mainImageUrl);
  }
  
  // Add additional images if they exist
  if (part.images && part.images.length > 0) {
    part.images.forEach(imageObj => {
      if (imageObj.image) {
        const imageUrl = imageObj.image.startsWith('http') 
          ? imageObj.image 
          : `http://localhost:8000${imageObj.image}`;
        images.push(imageUrl);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-black hover:text-orange-600 mb-6 transition-colors px-4 py-2 rounded-full hover:bg-orange-50"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-full flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="h-full">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 h-full flex flex-col">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 flex-shrink-0">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={part.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={64} className="text-gray-400" />
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto flex-shrink-0">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index ? 'border-orange-500 scale-105' : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${part.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Part Details */}
          <div className="h-full">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/30 h-full flex flex-col">
              <div className="mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-black mb-3">{part.name}</h1>
              </div>

              <div className="flex items-center space-x-4 mb-8 flex-shrink-0">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                  Rs {parseFloat(part.price || 0).toFixed(2)}
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getConditionColor(part.condition)}`}>
                  {getConditionLabel(part.condition)}
                </span>
                {part.part_number && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                    #{part.part_number}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
                <div>
                  <h3 className="font-medium text-black mb-1">Availability</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      part.quantity > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className={part.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {part.quantity > 0 ? `${part.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-black mb-1">Category</h3>
                  <span className="text-gray-600">{part.category_name || 'General'}</span>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-1">Rating</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <StarRating rating={parseFloat(part.average_rating || 0)} size={16} />
                    </div>
                    <span className="text-gray-600">
                      {parseFloat(part.average_rating || 0).toFixed(1)} ({part.total_ratings || 0} reviews)
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-black mb-1">Seller</h3>
                  <span className="text-gray-600">{part.seller_username || 'Unknown'}</span>
                </div>
              </div>

              {/* Flexible spacer to push content to bottom */}
              <div className="flex-grow"></div>

              {/* Bottom section with fixed positioning */}
              <div className="flex-shrink-0">
                {/* Quantity Selector */}
                <div className="mb-6">
                  <h3 className="font-medium text-black mb-2">Quantity</h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-orange-300 transition-all duration-200"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-xl font-medium px-4">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= (part.quantity || 1)}
                      className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-orange-300 transition-all duration-200"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 mb-6">
                  <div className="flex space-x-3">
                    <button
                      onClick={addToCart}
                      disabled={!part.quantity || part.quantity === 0}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                      <ShoppingCart size={20} />
                      <span>Add to Cart</span>
                    </button>
                    <button
                      onClick={addToWishlist}
                      className="p-3 border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 hover:scale-105"
                    >
                      <Heart size={20} />
                    </button>
                  </div>
                  
                  {/* Contact Seller Button for Buyers */}
                  {user && user.role === 'BUYER' && part.seller && user.id !== part.seller && (
                    <button
                      onClick={startChat}
                      className="w-full flex items-center justify-center space-x-2 bg-white border-2 border-orange-500 text-orange-600 py-3 px-6 rounded-full hover:bg-orange-50 transition-all duration-300 font-medium"
                    >
                      <MessageSquareQuote size={20} />
                      <span>Contact Seller</span>
                    </button>
                  )}
                </div>

                {/* Total Price */}
                <div className="p-4 bg-gray-50/50 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">Total:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                       Rs {(parseFloat(part.price || 0) * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Part Description Section */}
        <div className="mb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/30">
            <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
              <Package className="mr-3 text-orange-500" size={24} />
              Product Description
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {part.description}
              </p>
            </div>
          </div>
        </div>

        {/* Compatibility Chatbot */}
        <div className="mb-8">
          <CompatibilityChatbot partId={part.id} partName={part.name} />
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Review Summary - spans full width */}
          <div className="lg:col-span-3">
            <ReviewSummary />
          </div>

          {/* Reviews Section - spans full width */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-black">
                  Customer Reviews ({reviews && reviews.length ? reviews.length : 0})
                </h3>
                
                {user && user.role === 'BUYER' && !userHasReviewed && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium text-sm"
                  >
                    Write Review
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30 mb-6">
                  <h4 className="text-lg font-bold text-black mb-4">Write a Review</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Rating *</label>
                      <StarRating 
                        rating={userRating} 
                        onRatingClick={handleRatingClick} 
                        interactive={true}
                        size={24}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Review *</label>
                      <textarea
                        value={userReview}
                        onChange={(e) => setUserReview(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50/50 hover:bg-white transition-all duration-200"
                        placeholder="Share your experience with this part..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={submitReview}
                        disabled={submittingReview || !userRating || !userReview.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {submittingReview ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowReviewForm(false);
                          setUserRating(0);
                          setUserReview('');
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquareQuote size={48} className="text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">No reviews yet</h4>
                  <p className="text-gray-500">Be the first to review this part!</p>
                  {user && user.role === 'BUYER' && !showReviewForm && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-300 font-medium"
                    >
                      Write First Review
                    </button>
                  )}
                  {!user && (
                    <p className="mt-4 text-sm text-gray-500">
                      <a href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                        Login
                      </a> to write a review
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
            <h3 className="text-xl font-bold text-black mb-4">Specifications</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Part Number:</span>
                <span className="font-medium">{part.part_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Condition:</span>
                <span className="font-medium">{getConditionLabel(part.condition)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{part.category_name || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity Available:</span>
                <span className="font-medium">{part.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-medium">{part.total_sales || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Added:</span>
                <span className="font-medium">
                  {part.created_at ? new Date(part.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {part.updated_at ? new Date(part.updated_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Compatible Vehicles */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
            <h3 className="text-xl font-bold text-black mb-4">Compatible Vehicles</h3>
            {part.compatible_vehicles_info && part.compatible_vehicles_info.length > 0 ? (
              <div className="space-y-3">
                {part.compatible_vehicles_info.map((vehicle, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                    <Car size={20} className="text-orange-500" />
                    <div>
                      <div className="font-medium">
                        {vehicle.brand_name} {vehicle.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {vehicle.year_from} - {vehicle.year_to || 'Present'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No compatibility information available</p>
            )}
          </div>

          {/* Shop Information */}
          {(shop || part.shop_name) && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30">
              <h3 className="text-xl font-bold text-black mb-4">Sold By</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl flex items-center justify-center">
                    {shop?.logo ? (
                      <img 
                        src={shop.logo.startsWith('http') ? shop.logo : `http://localhost:8000${shop.logo}`} 
                        alt={shop.name} 
                        className="w-10 h-10 object-cover rounded-xl" 
                      />
                    ) : (
                      <Package size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-black">{shop?.name || part.shop_name || 'Shop'}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Star size={14} className="text-yellow-400 fill-current" />
                      <span>{parseFloat(shop?.average_rating || 0).toFixed(1)}</span>
                      <span>({shop?.total_ratings || 0} reviews)</span>
                    </div>
                  </div>
                </div>

                {shop?.is_verified && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Shield size={16} />
                    <span className="text-sm font-medium">Verified Shop</span>
                  </div>
                )}

                {shop && (
                  <button
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-full hover:bg-gray-200 transition-colors font-medium"
                  >
                    View Shop
                  </button>
                )}

                {shop && (
                  <div className="space-y-2 text-sm">
                    {shop.address && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <MapPin size={14} />
                        <span>{shop.address}</span>
                      </div>
                    )}
                    {shop.phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone size={14} />
                        <span>{shop.phone}</span>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail size={14} />
                        <span>{shop.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartDetailPage;
