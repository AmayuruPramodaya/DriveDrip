import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  DollarSign,
  MapPin,
  Phone,
  User,
  Truck,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  Star,
  MessageSquare,
  Send
} from 'lucide-react';
import { orderAPI, reviewAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [reviews, setReviews] = useState({});
  const [ratings, setRatings] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  useEffect(() => {
    if (order && order.status === 'DELIVERED' && user && !isSeller) {
      fetchExistingReviews();
    }
  }, [order, user]);

  const fetchExistingReviews = async () => {
    if (!order?.items) return;
    
    try {
      setReviewsLoading(true);
      const existingReviews = {};
      const existingRatings = {};
      
      for (const item of order.items) {
        if (item.spare_part?.id) {
          try {
            // Fetch existing reviews for this part by this user
            const reviewResponse = await reviewAPI.getReviews({
              reviewed_spare_part: parseInt(item.spare_part.id),
              reviewer: user.id
            });
            
            if (reviewResponse.data.results && reviewResponse.data.results.length > 0) {
              const userReview = reviewResponse.data.results[0];
              existingReviews[item.spare_part.id] = userReview.content;
              existingRatings[item.spare_part.id] = userReview.rating;
            }
          } catch (err) {
            console.log('No existing review for part:', item.spare_part.id);
          }
        }
      }
      
      setReviews(existingReviews);
      setRatings(existingRatings);
    } catch (err) {
      console.error('Error fetching existing reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrder(id);
      setOrder(response.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      setMessage({ type: '', text: '' });
      
      await orderAPI.updateOrder(id, { status: newStatus });
      
      // Update local order state
      setOrder(prev => ({ ...prev, status: newStatus }));
      
      setMessage({ 
        type: 'success', 
        text: `Order status updated to ${newStatus.toLowerCase()}` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update order status' 
      });
    } finally {
      setUpdating(false);
    }
  };

  const submitRatingAndReview = async (partId, rating, reviewText) => {
    try {
      setSubmittingReview(partId);
      
      // Submit rating
      const ratingData = {
        rating_type: 'SPARE_PART',
        target_id: parseInt(partId),
        rating: rating
      };
      await reviewAPI.rateItem(ratingData);
      
      // Submit review if provided
      if (reviewText.trim()) {
        const reviewData = {
          reviewed_spare_part: parseInt(partId),
          review_type: 'SPARE_PART',
          title: `Review for spare part`,
          content: reviewText.trim(),
          rating: rating
        };
        await reviewAPI.createReview(reviewData);
      }
      
      // Update local state
      setRatings(prev => ({ ...prev, [partId]: rating }));
      setReviews(prev => ({ ...prev, [partId]: reviewText }));
      
      setMessage({ 
        type: 'success', 
        text: 'Rating and review submitted successfully!' 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting rating/review:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to submit rating and review' 
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  // Star Rating Component
  const StarRating = ({ rating, onRatingChange, readonly = false, size = 'w-6 h-6' }) => {
    const [hoveredRating, setHoveredRating] = useState(0);

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${size} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-all duration-200`}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            onClick={() => !readonly && onRatingChange(star)}
          >
            <Star
              className={`w-full h-full ${
                star <= (hoveredRating || rating)
                  ? 'fill-orange-400 text-orange-400'
                  : 'text-gray-300'
              } transition-colors duration-200`}
            />
          </button>
        ))}
        {!readonly && (
          <span className="ml-2 text-sm text-gray-600">
            {(hoveredRating || rating) > 0 ? `${hoveredRating || rating} star${(hoveredRating || rating) > 1 ? 's' : ''}` : 'Click to rate'}
          </span>
        )}
      </div>
    );
  };

  // Item Review Form Component
  const ItemReviewForm = ({ item, existingRating, existingReview }) => {
    const [localRating, setLocalRating] = useState(existingRating || 0);
    const [localReview, setLocalReview] = useState(existingReview || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (localRating === 0) {
        setMessage({ type: 'error', text: 'Please select a rating' });
        return;
      }

      setIsSubmitting(true);
      try {
        await submitRatingAndReview(item.spare_part.id, localRating, localReview);
      } finally {
        setIsSubmitting(false);
      }
    };

    const hasExistingReview = existingRating > 0;

    return (
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-5 h-5 text-orange-600" />
          <h4 className="text-lg font-semibold text-gray-800">
            {hasExistingReview ? 'Your Review' : 'Rate & Review This Item'}
          </h4>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <StarRating
              rating={localRating}
              onRatingChange={setLocalRating}
              readonly={hasExistingReview}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={localReview}
              onChange={(e) => setLocalReview(e.target.value)}
              disabled={hasExistingReview}
              placeholder={hasExistingReview ? '' : "Share your experience with this part..."}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          {!hasExistingReview && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || localRating === 0}
                className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {hasExistingReview && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                ✅ Review submitted on {new Date().toLocaleDateString()}
              </span>
            </div>
          )}
        </form>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />;
      case 'PROCESSING':
        return <Package className="w-4 h-4" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <X className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  // Check if current user is the seller of this order
  const isSeller = user && order && order.items?.some(item => {
    // Check multiple possible ways the seller info might be stored
    const sellerId = item.spare_part_seller_id || item.spare_part?.seller?.id || item.spare_part?.seller;
    const sellerUsername = item.spare_part_seller_username || item.spare_part?.seller?.username || item.spare_part?.seller_username;
    
    return sellerId === user.id || sellerUsername === user.username;
  });

  // Debug logging to help troubleshoot (remove in production)
  if (order && user) {
    console.log('Current user:', { id: user.id, username: user.username, role: user.role });
    console.log('Order items:', order.items?.map(item => ({
      id: item.id,
      spare_part_seller_id: item.spare_part_seller_id,
      spare_part_seller_username: item.spare_part_seller_username,
      spare_part: item.spare_part
    })));
    console.log('Is seller:', isSeller);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Package className="w-24 h-24 mx-auto text-slate-400 mb-6" />
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Order not found</h2>
            <p className="text-slate-600 mb-8">{error || 'The order you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-full hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Order Details</h1>
            <p className="text-slate-600">Order #{order.order_number || order.id}</p>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Order Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">
                    ${parseFloat(order.total_amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600">Status:</span>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {order.delivery_phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">{order.delivery_phone}</span>
                  </div>
                )}
                {order.delivery_address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                    <span className="text-slate-600">{order.delivery_address}</span>
                  </div>
                )}
                {order.buyer_username && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Buyer: {order.buyer_username}</span>
                  </div>
                )}
                {order.seller_username && (
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600">Seller: {order.seller_username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seller Actions */}
        {isSeller && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Update Order Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Change Status To:
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      updateOrderStatus(e.target.value);
                      e.target.value = ""; // Reset dropdown
                    }
                  }}
                  disabled={updating}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  <option value="">Select new status...</option>
                  {order.status === 'PENDING' && (
                    <>
                      <option value="CONFIRMED">✅ Confirm Order</option>
                      <option value="CANCELLED">❌ Cancel Order</option>
                    </>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <option value="PROCESSING">📦 Start Processing</option>
                  )}
                  {order.status === 'PROCESSING' && (
                    <option value="SHIPPED">🚛 Mark as Shipped</option>
                  )}
                  {order.status === 'SHIPPED' && (
                    <option value="DELIVERED">✅ Mark as Delivered</option>
                  )}
                </select>
              </div>
              
              {updating && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Updating...</span>
                </div>
              )}
            </div>
            
            {/* Status Flow Indicator */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Order Status Flow:</h4>
              <div className="flex items-center space-x-2 text-xs">
                <span className={`px-2 py-1 rounded ${order.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                  PENDING
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${order.status === 'CONFIRMED' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>
                  CONFIRMED
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${order.status === 'PROCESSING' ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'}`}>
                  PROCESSING
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${order.status === 'SHIPPED' ? 'bg-purple-200 text-purple-800' : 'bg-gray-200 text-gray-600'}`}>
                  SHIPPED
                </span>
                <span className="text-slate-400">→</span>
                <span className={`px-2 py-1 rounded ${order.status === 'DELIVERED' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                  DELIVERED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Order Items</h3>
            <div className="space-y-6">
              {order.items.map((item, index) => (
                <div key={item.id || index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Item Image */}
                    <div className="flex-shrink-0">
                      {item.spare_part_image ? (
                        <img
                          src={item.spare_part_image}
                          alt={item.spare_part_name || item.name}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Item Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 text-lg">{item.spare_part_name || item.name}</h4>
                      {item.spare_part_part_number && (
                        <p className="text-sm text-slate-500 mt-1">Part #: {item.spare_part_part_number}</p>
                      )}
                      <p className="text-sm text-slate-500 mt-1">Quantity: {item.quantity}</p>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="font-semibold text-slate-800 text-lg">
                        ${(parseFloat(item.total_price || (item.price * item.quantity)) || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">
                        ${parseFloat(item.price || 0).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Review Section for Delivered Orders - Buyers Only */}
                  {order.status === 'DELIVERED' && user && !isSeller && item.spare_part?.id && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      {reviewsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          <span className="ml-2 text-gray-600">Loading reviews...</span>
                        </div>
                      ) : (
                        <ItemReviewForm
                          item={item}
                          existingRating={ratings[item.spare_part.id]}
                          existingReview={reviews[item.spare_part.id]}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;