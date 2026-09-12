from rest_framework.permissions import IsAuthenticated
from rest_framework import filters
from .seriazers import OrderSerializer
from .models import Order

from rest_framework.generics import (
    RetrieveUpdateAPIView,
    ListCreateAPIView,
    ListAPIView,
)

# Create your views here.


class OrderListCreateView(ListCreateAPIView):
    """List orders or create a new order"""

    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["created_at", "total_amount"]
    ordering = ["-created_at"]
    search_fields = ["order_number", "status"]

    def get_queryset(self):
        # Users can only see their own orders (as buyers)
        return Order.objects.filter(buyer=self.request.user)

    def perform_create(self, serializer):
        # Generate order number
        import uuid

        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(buyer=self.request.user, order_number=order_number)


class OrderDetailView(RetrieveUpdateAPIView):
    """Retrieve or update an order"""

    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        order = super().get_object()
        user = self.request.user

        # Check if user is buyer or seller
        is_buyer = order.buyer == user
        is_seller = order.items.filter(spare_part__seller=user).exists()

        if not (is_buyer or is_seller):
            raise PermissionDenied("You can only access orders you're involved in")
        return order

    def perform_update(self, serializer):
        order = self.get_object()
        user = self.request.user

        # Only sellers can update order status
        is_seller = order.items.filter(spare_part__seller=user).exists()
        if not is_seller:
            raise PermissionDenied("Only sellers can update order status")

        serializer.save()


class BuyerOrdersView(ListAPIView):
    """List orders for buyers"""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["created_at", "total_amount", "status"]
    ordering = ["-created_at"]
    search_fields = ["order_number", "status"]

    def get_queryset(self):
        queryset = Order.objects.filter(buyer=self.request.user)

        # Filter by status if provided
        status = self.request.query_params.get("status", None)
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class SellerOrdersView(ListAPIView):
    """List orders for sellers - orders containing their spare parts"""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ["created_at", "total_amount", "status"]
    ordering = ["-created_at"]
    search_fields = ["order_number", "status"]

    def get_queryset(self):
        # Get orders that contain spare parts sold by this seller
        return Order.objects.filter(
            items__spare_part__seller=self.request.user
        ).distinct()
