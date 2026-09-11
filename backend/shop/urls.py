from .views import UserShopsView, UserShopView, ShopDetailView, ShopListCreateView
from django.urls import path

# app urls

urlpatterns = [
    path("user/shop/", UserShopView.as_view(), name="user_shop"),
    path("user/shops/", UserShopsView.as_view(), name="user_shops"),
    path("shops/", ShopListCreateView.as_view(), name="shop_list_create"),
    path("shops/<int:pk>/", ShopDetailView.as_view(), name="shop_detail"),
]
