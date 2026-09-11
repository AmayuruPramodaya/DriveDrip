from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from .models import SparePart, SparePartCategory
from rest_framework.response import Response
from rest_framework import filters
from django.db.models import Q
from shop.models import Shop

from .serializers import (
    SparePartCategorySerializer,
    PopularSparePartSerializer,
    SparePartSerializer,
)

from rest_framework.generics import (
    RetrieveUpdateDestroyAPIView,
    ListCreateAPIView,
    ListAPIView,
)

# Create your views here.


class SparePartCategoryListView(ListAPIView):
    """List all spare part categories"""

    queryset = SparePartCategory.objects.all()
    serializer_class = SparePartCategorySerializer
    permission_classes = [AllowAny]


# Spare Part views
class SparePartListCreateView(ListCreateAPIView):
    """List all spare parts or create a new spare part"""

    queryset = SparePart.objects.filter(is_active=True)
    serializer_class = SparePartSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "part_number"]
    ordering_fields = ["name", "price", "average_rating", "total_sales", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """Allow anyone to list parts, but require authentication to create"""
        if self.request.method == "POST":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(category=category)

        # Filter by condition
        condition = self.request.query_params.get("condition", None)
        if condition:
            queryset = queryset.filter(condition=condition)

        # Filter by price range
        min_price = self.request.query_params.get("min_price", None)
        max_price = self.request.query_params.get("max_price", None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Filter by vehicle compatibility
        vehicle_model = self.request.query_params.get("vehicle_model", None)
        if vehicle_model:
            queryset = queryset.filter(compatible_vehicles=vehicle_model)

        # Filter by vehicle brand - NEW
        vehicle_brand = self.request.query_params.get("vehicle_brand", None)
        if vehicle_brand:
            queryset = queryset.filter(compatible_vehicles__brand=vehicle_brand)

        # Filter by year range - NEW
        year_from = self.request.query_params.get("year_from", None)
        year_to = self.request.query_params.get("year_to", None)
        if year_from or year_to:
            # Filter parts compatible with vehicles in the specified year range
            year_filter = Q()
            if year_from and year_to:
                # Parts compatible with vehicles that overlap with the specified range
                year_filter = Q(
                    compatible_vehicles__year_from__lte=year_to,
                    compatible_vehicles__year_to__gte=year_from,
                ) | Q(
                    compatible_vehicles__year_from__lte=year_to,
                    compatible_vehicles__year_to__isnull=True,
                )
            elif year_from:
                # Parts compatible with vehicles from year_from onwards
                year_filter = Q(compatible_vehicles__year_to__gte=year_from) | Q(
                    compatible_vehicles__year_to__isnull=True
                )
            elif year_to:
                # Parts compatible with vehicles up to year_to
                year_filter = Q(compatible_vehicles__year_from__lte=year_to)

            queryset = queryset.filter(year_filter)

        # Filter by seller
        seller = self.request.query_params.get("seller", None)
        if seller:
            queryset = queryset.filter(seller=seller)

        # Filter by shop
        shop = self.request.query_params.get("shop", None)
        if shop:
            queryset = queryset.filter(shop=shop)

        # Province filter - check part province first, then shop province
        province = self.request.query_params.get("province")
        if province:
            queryset = queryset.filter(
                Q(province__icontains=province) | Q(shop__province__icontains=province)
            )

        # District filter - check part district first, then shop district
        district = self.request.query_params.get("district")
        if district:
            queryset = queryset.filter(
                Q(district__icontains=district) | Q(shop__district__icontains=district)
            )

        # Remove duplicates when filtering by vehicle relationships
        return queryset.distinct()

    def perform_create(self, serializer):
        # Set the seller to current user
        if self.request.user.role != "SELLER":
            raise PermissionDenied("Only sellers can add spare parts")

        # Get the shop from request data if provided
        shop_id = self.request.data.get("shop")
        shop = None

        if shop_id:
            try:
                # Ensure the shop belongs to the current user
                shop = Shop.objects.get(id=shop_id, seller=self.request.user)
            except Shop.DoesNotExist:
                raise ValidationError(
                    "Shop not found or you don't have permission to add parts to this shop"
                )

        serializer.save(seller=self.request.user, shop=shop)


class SparePartDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a spare part"""

    queryset = SparePart.objects.all()
    serializer_class = SparePartSerializer

    def get_permissions(self):
        """Allow anyone to view parts, but require authentication to modify"""
        if self.request.method == "GET":
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_object(self):
        spare_part = super().get_object()
        # Only part owner can update/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if spare_part.seller != self.request.user:
                raise PermissionDenied("You can only modify your own spare parts")
        return spare_part


class PopularSparePartsView(ListAPIView):
    """List most selling spare parts"""

    serializer_class = PopularSparePartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return SparePart.objects.filter(is_active=True).order_by("-total_sales")[:20]


@api_view(["GET"])
@permission_classes([AllowAny])
def search_spare_parts(request):
    """Advanced search for spare parts"""
    query = request.GET.get("q", "")
    category = request.GET.get("category", "")
    min_price = request.GET.get("min_price", "")
    max_price = request.GET.get("max_price", "")
    condition = request.GET.get("condition", "")
    vehicle_model = request.GET.get("vehicle_model", "")

    spare_parts = SparePart.objects.filter(is_active=True)

    if query:
        spare_parts = spare_parts.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(part_number__icontains=query)
        )

    if category:
        spare_parts = spare_parts.filter(category=category)

    if min_price:
        spare_parts = spare_parts.filter(price__gte=min_price)

    if max_price:
        spare_parts = spare_parts.filter(price__lte=max_price)

    if condition:
        spare_parts = spare_parts.filter(condition=condition)

    if vehicle_model:
        spare_parts = spare_parts.filter(compatible_vehicles=vehicle_model)

    spare_parts = spare_parts.order_by("-total_sales", "-average_rating")

    serializer = SparePartSerializer(spare_parts, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def trending_spare_parts(request):
    """Get trending spare parts based on recent sales and ratings"""
    from django.utils import timezone
    from datetime import timedelta

    # Get parts with recent activity (last 30 days)
    recent_date = timezone.now() - timedelta(days=30)

    trending_parts = SparePart.objects.filter(
        is_active=True, created_at__gte=recent_date
    ).order_by("-total_sales", "-average_rating")[:10]

    serializer = PopularSparePartSerializer(trending_parts, many=True)
    return Response(serializer.data)
