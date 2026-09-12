from django.urls import path

from .views import (
    OrderListCreateView,
    BuyerOrdersView,
    OrderDetailView,
    SellerOrdersView,
)

# app urls

urlpatterns = [
    path("buyer/orders/", BuyerOrdersView.as_view(), name="buyer_orders"),
    path("orders/", OrderListCreateView.as_view(), name="order_list_create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order_detail"),
    path("seller/orders/", SellerOrdersView.as_view(), name="seller_orders"),
]
