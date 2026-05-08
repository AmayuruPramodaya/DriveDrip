import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; 

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.data && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (userData) => apiClient.post('/user/register/', userData),
  login: (credentials) => apiClient.post('/token/', credentials),
  refreshToken: (refreshToken) => apiClient.post('/token/refresh/', { refresh: refreshToken }),
  logout: (refreshToken) => apiClient.post('/token/blacklist/', { refresh: refreshToken }),
  getCurrentUser: () => apiClient.get('/user/'),
  updateProfile: (userId, userData) => apiClient.put(`/user/${userId}/`, userData),
};

// User endpoints
export const userAPI = {
  getProfile: () => apiClient.get('/user/'),
  updateProfile: (userData) => apiClient.put('/user/', userData),
  changePassword: (passwordData) => apiClient.post('/user/change-password/', passwordData),
};

// Shop endpoints
export const shopAPI = {
  getShops: (params) => apiClient.get('/shops/', { params }),
  getShop: (id) => apiClient.get(`/shops/${id}/`),
  getShopDetail: (id) => apiClient.get(`/shops/${id}/`),
  getUserShop: () => apiClient.get('/user/shop/'), // Get current user's shop
  createShop: (shopData) => apiClient.post('/shops/', shopData),
  updateShop: (id, shopData) => apiClient.put(`/shops/${id}/`, shopData),
  deleteShop: (id) => apiClient.delete(`/shops/${id}/`),
  getShopParts: (shopId, params) => apiClient.get(`/shops/${shopId}/parts/`, { params }),
  getShopOrders: (shopId, params) => apiClient.get(`/shops/${shopId}/orders/`, { params }),
  // Get current user's shops (secure endpoint)
  getUserShops: () => apiClient.get('/user/shops/'),
};

// Vehicle endpoints
export const vehicleAPI = {
  getCategories: () => apiClient.get('/vehicle-categories/'),
  getBrands: (params) => apiClient.get('/vehicle-brands/', { params }),
  getModels: (params) => apiClient.get('/vehicle-models/', { params }),
};

// Spare parts endpoints
export const sparePartsAPI = {
  getAll: (params) => apiClient.get('/spare-parts/', { params }),
  getSpareParts: (params) => apiClient.get('/spare-parts/', { params }),
  getDetail: (id) => apiClient.get(`/spare-parts/${id}/`),
  getSparePart: (id) => apiClient.get(`/spare-parts/${id}/`),
  create: (partData) => apiClient.post('/spare-parts/', partData),
  createSparePart: (partData) => apiClient.post('/spare-parts/', partData),
  update: (id, partData) => apiClient.put(`/spare-parts/${id}/`, partData),
  updateSparePart: (id, partData) => apiClient.put(`/spare-parts/${id}/`, partData),
  delete: (id) => apiClient.delete(`/spare-parts/${id}/`),
  deleteSparePart: (id) => apiClient.delete(`/spare-parts/${id}/`),
  getPopularParts: () => apiClient.get('/spare-parts/popular/'),
  getTrendingParts: () => apiClient.get('/spare-parts/trending/'),
  searchParts: (params) => apiClient.get('/spare-parts/search/', { params }),
  getCategories: () => apiClient.get('/spare-part-categories/'),
  generateDescription: (data) => apiClient.post('/ai/generate-description/', data),
  getReviewSummary: (partId) => apiClient.get(`/spare-parts/${partId}/summarize-reviews/`),
  askCompatibilityQuestion: (partId, question) => 
    apiClient.post(`/spare-parts/${partId}/compatibility-chat/`, { question }),
  semanticSearch: (query) => apiClient.post('/ai/semantic-search/', { query }),
};

// Rating and Review endpoints
export const reviewAPI = {
  getRatings: (params) => apiClient.get('/ratings/', { params }),
  rateItem: (ratingData) => apiClient.post('/rate/', ratingData),
  getReviews: (params) => apiClient.get('/reviews/', { params }),
  createReview: (reviewData) => apiClient.post('/reviews/', reviewData),
  updateReview: (id, reviewData) => apiClient.put(`/reviews/${id}/`, reviewData),
  deleteReview: (id) => apiClient.delete(`/reviews/${id}/`),
};

// Order endpoints
export const orderAPI = {
  // Get orders for current user
  getOrders: (params = {}) => apiClient.get('/orders/', { params }),
  
  // Create a new order
  createOrder: (data) => apiClient.post('/orders/', data),
  
  // Get specific order details
  getOrder: (id) => apiClient.get(`/orders/${id}/`),
  
  // Update order status
  updateOrderStatus: (id, data) => apiClient.patch(`/orders/${id}/`, data),
  updateOrder: (id, data) => apiClient.patch(`/orders/${id}/`, data),
  
  // Get buyer's orders (orders they placed)
  getBuyerOrders: (params = {}) => apiClient.get('/buyer/orders/', { params }),
  
  // Get seller's orders (orders for their parts)
  getSellerOrders: (params = {}) => apiClient.get('/seller/orders/', { params })
};

// Cart and Wishlist endpoints (for future backend integration)
export const cartAPI = {
  getCart: () => apiClient.get('/cart/'),
  addToCart: (itemData) => apiClient.post('/cart/items/', itemData),
  updateCartItem: (itemId, quantity) => apiClient.patch(`/cart/items/${itemId}/`, { quantity }),
  removeFromCart: (itemId) => apiClient.delete(`/cart/items/${itemId}/`),
  clearCart: () => apiClient.delete('/cart/'),
};

export const wishlistAPI = {
  getWishlist: () => apiClient.get('/wishlist/'),
  addToWishlist: (itemData) => apiClient.post('/wishlist/items/', itemData),
  removeFromWishlist: (itemId) => apiClient.delete(`/wishlist/items/${itemId}/`),
  clearWishlist: () => apiClient.delete('/wishlist/'),
};

// Admin AI Analysis endpoints
export const adminAPI = {
  analyzeSellerReputation: (sellerId) => apiClient.get(`/admin/seller-analysis/${sellerId}/`),
  bulkSellerAnalysis: () => apiClient.get('/admin/bulk-seller-analysis/'),
};

// Chat endpoints
export const chatAPI = {
  // Conversations
  getConversations: (params = {}) => apiClient.get('/chat/conversations/', { params }),
  createConversation: (data) => apiClient.post('/chat/conversations/', data),
  getConversation: (id) => apiClient.get(`/chat/conversations/${id}/`),
  updateConversation: (id, data) => apiClient.put(`/chat/conversations/${id}/`, data),
  
  // Messages
  getMessages: (conversationId, params = {}) => apiClient.get(`/chat/conversations/${conversationId}/messages/`, { params }),
  sendMessage: (conversationId, data) => apiClient.post(`/chat/conversations/${conversationId}/messages/`, data),
  getMessage: (messageId) => apiClient.get(`/chat/messages/${messageId}/`),
  updateMessage: (messageId, data) => apiClient.put(`/chat/messages/${messageId}/`, data),
  deleteMessage: (messageId) => apiClient.delete(`/chat/messages/${messageId}/`),
  
  // Mark messages as read
  markAsRead: (conversationId) => apiClient.post(`/chat/conversations/${conversationId}/mark-read/`),
};

// 3D Car Models endpoints
export const carModel3DAPI = {
  getAll: (params = {}) => apiClient.get('/3d-cars/', { params }),
  getById: (id) => apiClient.get(`/3d-cars/${id}/`),
};

export default apiClient;