from django.urls import path
from .views import get_user_shops, get_buyer_orders, get_seller_orders

urlpatterns = [
    # User's shops endpoint
    path('user/shops/', get_user_shops, name='user-shops'),

    # Order endpoints
    path('api/buyer/orders/', get_buyer_orders, name='buyer-orders'),
    path('api/seller/orders/', get_seller_orders, name='seller-orders'),

    # ...existing URL patterns...
]