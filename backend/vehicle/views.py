from django.shortcuts import get_object_or_404

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound
from rest_framework import filters

from .models import VehicleModel, VehicleCategory, VehicleBrand, CarModel3D
from .serializers import (
    VehicleCategorySerializer,
    VehicleBrandSerializer,
    VehicleModelSerializer,
    CarModel3DBaseSerializer,
    CarModel3DDetailSerializer,
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
    """
    List all active base 3D car models (parent=None).

    Query params:
        search  — filter by name / brand / description
        ordering — order results
    """

    serializer_class = CarModel3DBaseSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "brand", "description"]
    ordering_fields = ["name", "brand", "created_at"]
    ordering = ["brand", "name"]

    def get_queryset(self):
        # Only return top-level / base models (no parent)
        return CarModel3D.objects.filter(is_active=True, parent__isnull=True)


class CarModel3DDetailView(RetrieveAPIView):
    """
    Retrieve a 3D car model by its pk.

    Behaviour:
        - No `part_id` query param → returns the base model itself.
        - `?part_id=<id>`          → looks for a child model of this base model
                                     whose `modified_part_id` matches `part_id`.
                                     Returns 404 if no such child exists.

    Example:
        GET /3d-cars/5/              → base model #5
        GET /3d-cars/5/?part_id=12  → child of model #5 that modifies part #12
    """

    permission_classes = [AllowAny]
    serializer_class = CarModel3DDetailSerializer

    def get_object(self):
        # Always start from a base (parent=None) model
        base_model = get_object_or_404(
            CarModel3D,
            pk=self.kwargs["pk"],
            parent__isnull=True,
            is_active=True,
        )

        part_id = self.request.query_params.get("part_id")
        if part_id is None:
            # No part requested — return the base model itself
            return base_model

        # Find the child model that represents the base model with this part applied
        child = (
            CarModel3D.objects
            .filter(parent=base_model, modified_part_id=part_id, is_active=True)
            .select_related("modified_part")
            .first()
        )

        if child is None:
            raise NotFound(
                detail=f"No modified 3D model found for base model {base_model.pk} "
                       f"with part_id={part_id}."
            )

        return child
