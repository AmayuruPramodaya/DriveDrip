from main.views import (
    UserCreateView, UserDetailView, UserInfoView, UserShopView, UserShopsView,
    ShopListCreateView, ShopDetailView,
    VehicleCategoryListView, VehicleBrandListView, VehicleModelListView,
    SparePartCategoryListView, SparePartListCreateView, SparePartDetailView,
    PopularSparePartsView, RatingListCreateView, ReviewListCreateView,
    ReviewDetailView, OrderListCreateView, OrderDetailView,
    BuyerOrdersView, SellerOrdersView,
    search_spare_parts, trending_spare_parts, rate_item,
    generate_part_description, summarize_reviews,
    analyze_seller_reputation, bulk_seller_analysis,
    compatibility_chatbot, semantic_search_parts,
    ChatConversationListCreateView, ChatConversationDetailView,
    ChatMessageListCreateView, ChatMessageDetailView, MarkMessagesAsReadView,
    MechanicProfileListCreateView, MechanicProfileDetailView,
    MechanicServiceListCreateView, MechanicServiceDetailView,
    MechanicHireRequestListCreateView, MechanicHireRequestDetailView,
    MechanicAvailabilityListCreateView, rate_mechanic, review_mechanic,
    CarModel3DListView, CarModel3DDetailView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenBlacklistView,
    TokenRefreshView,
)
from django.urls import path, include
from django.contrib import admin
from django.conf import settings 
from django.conf.urls.static import static 

urlpatterns = [
    path("admin/", admin.site.urls),
    
    # User endpoints
    path("api/user/", UserInfoView.as_view(), name="user_info"),
    path("api/user/shop/", UserShopView.as_view(), name="user_shop"),
    path("api/user/shops/", UserShopsView.as_view(), name="user_shops"),
    path("api/user/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
    path("api/user/register/", UserCreateView.as_view(), name="register"),
    
    # Authentication endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="blacklist_token"),
    
    # Shop endpoints
    path("api/shops/", ShopListCreateView.as_view(), name="shop_list_create"),
    path("api/shops/<int:pk>/", ShopDetailView.as_view(), name="shop_detail"),
    
    # Vehicle endpoints
    path("api/vehicle-categories/", VehicleCategoryListView.as_view(), name="vehicle_category_list"),
    path("api/vehicle-brands/", VehicleBrandListView.as_view(), name="vehicle_brand_list"),
    path("api/vehicle-models/", VehicleModelListView.as_view(), name="vehicle_model_list"),
    
    # Spare part endpoints
    path("api/spare-part-categories/", SparePartCategoryListView.as_view(), name="spare_part_category_list"),
    path("api/spare-parts/", SparePartListCreateView.as_view(), name="spare_part_list_create"),
    path("api/spare-parts/<int:pk>/", SparePartDetailView.as_view(), name="spare_part_detail"),
    path("api/spare-parts/popular/", PopularSparePartsView.as_view(), name="popular_spare_parts"),
    path("api/spare-parts/trending/", trending_spare_parts, name="trending_spare_parts"),
    path("api/spare-parts/search/", search_spare_parts, name="search_spare_parts"),
    
    # Rating and Review endpoints
    path("api/ratings/", RatingListCreateView.as_view(), name="rating_list_create"),
    path("api/rate/", rate_item, name="rate_item"),
    path("api/reviews/", ReviewListCreateView.as_view(), name="review_list_create"),
    path("api/reviews/<int:pk>/", ReviewDetailView.as_view(), name="review_detail"),
    
    # Order endpoints
    path("api/orders/", OrderListCreateView.as_view(), name="order_list_create"),
    path("api/orders/<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
    path("api/buyer/orders/", BuyerOrdersView.as_view(), name="buyer_orders"),
    path("api/seller/orders/", SellerOrdersView.as_view(), name="seller_orders"),
    
    # Chat endpoints
    path("api/chat/conversations/", ChatConversationListCreateView.as_view(), name="chat_conversation_list_create"),
    path("api/chat/conversations/<int:pk>/", ChatConversationDetailView.as_view(), name="chat_conversation_detail"),
    path("api/chat/conversations/<int:conversation_id>/messages/", ChatMessageListCreateView.as_view(), name="chat_message_list_create"),
    path("api/chat/conversations/<int:conversation_id>/mark-read/", MarkMessagesAsReadView.as_view(), name="chat_mark_read"),
    path("api/chat/messages/<int:pk>/", ChatMessageDetailView.as_view(), name="chat_message_detail"),
    
    # Mechanic endpoints
    path("api/mechanics/", MechanicProfileListCreateView.as_view(), name="mechanic_profile_list_create"),
    path("api/mechanics/<int:pk>/", MechanicProfileDetailView.as_view(), name="mechanic_profile_detail"),
    path("api/mechanic-services/", MechanicServiceListCreateView.as_view(), name="mechanic_service_list_create"),
    path("api/mechanic-services/<int:pk>/", MechanicServiceDetailView.as_view(), name="mechanic_service_detail"),
    path("api/hire-requests/", MechanicHireRequestListCreateView.as_view(), name="hire_request_list_create"),
    path("api/hire-requests/<int:pk>/", MechanicHireRequestDetailView.as_view(), name="hire_request_detail"),
    path("api/hire-requests/<int:hire_request_id>/rate/", rate_mechanic, name="rate_mechanic"),
    path("api/hire-requests/<int:hire_request_id>/review/", review_mechanic, name="review_mechanic"),
    path("api/mechanic-availability/", MechanicAvailabilityListCreateView.as_view(), name="mechanic_availability"),
    
    # API auth
    path("api-auth/", include("rest_framework.urls")),

    # AI endpoints
    path("api/ai/generate-description/", generate_part_description, name="ai_generate_description"),
    path("api/ai/semantic-search/", semantic_search_parts, name="semantic_search"),
    path("api/spare-parts/<int:part_id>/compatibility-chat/", compatibility_chatbot, name="compatibility_chatbot"),
    path("api/spare-parts/<int:part_id>/summarize-reviews/", summarize_reviews, name="summarize_reviews"),
    
    # Admin AI analysis endpoints
    path("api/admin/seller-analysis/<int:seller_id>/", analyze_seller_reputation, name="seller_reputation_analysis"),
    path("api/admin/bulk-seller-analysis/", bulk_seller_analysis, name="bulk_seller_analysis"),
    
    # 3D Car Models endpoints
    path("api/3d-cars/", CarModel3DListView.as_view(), name="car_model_3d_list"),
    path("api/3d-cars/<int:pk>/", CarModel3DDetailView.as_view(), name="car_model_3d_detail"),
    
    # !App URLs
    # path("api/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
