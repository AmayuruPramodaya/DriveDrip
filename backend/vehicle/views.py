from .models import VehicleModel, VehicleCategory, VehicleBrand, CarModel3D
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework import filters

from .serializers import (
    VehicleCategorySerializer,
    VehicleBrandSerializer,
    VehicleModelSerializer,
    CarModel3DSerializer,
)

# Create your views here.


class VehicleCategoryListView(ListAPIView):
    """List all vehicle categories"""

    queryset = VehicleCategory.objects.all()
    serializer_class = VehicleCategorySerializer
    permission_classes = [AllowAny]


# Vehicle Brand views
class VehicleBrandListView(ListAPIView):
    """List all vehicle brands"""

    queryset = VehicleBrand.objects.all()
    serializer_class = VehicleBrandSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class VehicleModelListView(ListAPIView):
    """List all vehicle models"""

    queryset = VehicleModel.objects.all()
    serializer_class = VehicleModelSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        brand = self.request.query_params.get("brand", None)
        if brand:
            queryset = queryset.filter(brand=brand)
        return queryset


class CarModel3DListView(ListAPIView):
    """List all active 3D car models"""

    queryset = CarModel3D.objects.filter(is_active=True).select_related("modified_part")
    serializer_class = CarModel3DSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "brand", "description", "modified_part__name"]
    ordering_fields = ["name", "brand", "created_at", "modified_part__name"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        modified_part = self.request.query_params.get("modified_part")
        if modified_part:
            queryset = queryset.filter(modified_part=modified_part)
        return queryset


class CarModel3DDetailView(RetrieveAPIView):
    """Get details of a specific 3D car model"""

    queryset = CarModel3D.objects.filter(is_active=True).select_related("modified_part")
    serializer_class = CarModel3DSerializer
    permission_classes = [AllowAny]
