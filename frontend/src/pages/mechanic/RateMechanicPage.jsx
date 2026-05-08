import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Star, User, Wrench, ArrowLeft } from 'lucide-react';

const RateMechanicPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [request, setRequest] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  useEffect(() => {
    if (user && requestId) {
      fetchRequestDetails();
      checkExistingReview();
    }
  }, [user, requestId]);

  const fetchRequestDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/hire-requests/${requestId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      } else {
        navigate('/my-hire-requests');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      navigate('/my-hire-requests');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingReview = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/ratings/?hire_request=${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const existingData = data.results[0];
          setExistingReview(existingData);
          setRating(existingData.rating);
          setReview(existingData.review || '');
        }
      }
    } catch (error) {
      console.error('Error checking existing review:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      const data = {
        rated_user: request.mechanic.user.id,
        rating: rating,
        review: review.trim(),
        hire_request: parseInt(requestId)
      };

      let url = 'http://localhost:8000/api/ratings/';
      let method = 'POST';

      if (existingReview) {
        url = `http://localhost:8000/api/ratings/${existingReview.id}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
        navigate('/my-hire-requests');
      } else {
        const errorData = await response.json();
        console.error('Error submitting review:', errorData);
        alert('Error submitting review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-colors"
          >
            <Star
              size={32}
              className={`${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              } hover:text-yellow-400 transition-colors`}
            />
          </button>
        ))}
        <span className="ml-3 text-lg font-medium text-gray-700">
          {rating === 0 ? 'Select rating' : `${rating} star${rating !== 1 ? 's' : ''}`}
        </span>
      </div>
    );
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
              Login to rate and review
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!request || request.status !== 'COMPLETED') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <Wrench size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Request Not Found</h3>
            <p className="text-gray-600 mb-4">
              This request is not available for rating or hasn't been completed yet.
            </p>
            <button
              onClick={() => navigate('/my-hire-requests')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/my-hire-requests')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to My Requests
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {existingReview ? 'Update Your Review' : 'Rate & Review Mechanic'}
            </h1>
            <p className="text-gray-600">Share your experience with this mechanic service</p>
          </div>

          {/* Mechanic Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                {request.mechanic.user.profile_picture ? (
                  <img
                    src={request.mechanic.user.profile_picture}
                    alt={request.mechanic.user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {request.mechanic.business_name || request.mechanic.user.name}
                </h3>
                <p className="text-gray-600">{request.mechanic.user.name}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p><span className="font-medium">Service:</span> {request.job_type.replace('_', ' ')}</p>
                  <p><span className="font-medium">Completed:</span> {new Date(request.updated_at).toLocaleDateString()}</p>
                  {request.final_cost && (
                    <p><span className="font-medium">Cost:</span> ${request.final_cost}</p>
                  )}
                </div>
              </div>
            </div>

            {request.work_completed && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Work Completed</h4>
                <p className="text-gray-700 text-sm">{request.work_completed}</p>
                {request.parts_used && (
                  <p className="text-gray-700 text-sm mt-1">
                    <span className="font-medium">Parts Used:</span> {request.parts_used}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Rating Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                How would you rate this service?
              </label>
              {renderStars()}
            </div>

            <div>
              <label htmlFor="review" className="block text-lg font-medium text-gray-900 mb-2">
                Write a review (optional)
              </label>
              <textarea
                id="review"
                rows={6}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Share your experience with this mechanic's service. What did you like? Any areas for improvement?"
              />
              <p className="text-sm text-gray-500 mt-2">
                Your review will help other customers make informed decisions.
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/my-hire-requests')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>

          {existingReview && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <span className="font-medium">Note:</span> You've already reviewed this service. 
                Submitting this form will update your existing review.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateMechanicPage;
