from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField
from vehicle.serializers import VehicleCategorySerializer
from main.serializers import UserSerializer
from vehicle.models import VehicleCategory

from .models import (
    MechanicAvailability,
    MechanicHireRequest,
    MechanicProfile,
    MechanicService,
)

# app serializers


class MechanicProfileSerializer(ModelSerializer):
    "Serializer for mechanic profiles"

    user = UserSerializer(read_only=True)
    specializations = VehicleCategorySerializer(many=True, read_only=True)
    specialization_ids = PrimaryKeyRelatedField(
        queryset=VehicleCategory.objects.all(),
        many=True,
        write_only=True,
        source="specializations",
    )

    class Meta:
        model = MechanicProfile
        fields = [
            "id",
            "user",
            "license_number",
            "years_of_experience",
            "specializations",
            "specialization_ids",
            "province",
            "district",
            "service_area",
            "is_mobile",
            "hourly_rate",
            "business_name",
            "business_address",
            "is_verified",
            "is_available",
            "service_rating",
            "total_service_ratings",
            "total_jobs_completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "user",
            "is_verified",
            "service_rating",
            "total_service_ratings",
            "total_jobs_completed",
            "created_at",
            "updated_at",
        ]


class MechanicServiceSerializer(ModelSerializer):
    "Serializer for mechanic services"

    mechanic = MechanicProfileSerializer(read_only=True)
    compatible_vehicles = VehicleCategorySerializer(many=True, read_only=True)
    compatible_vehicle_ids = PrimaryKeyRelatedField(
        queryset=VehicleCategory.objects.all(),
        many=True,
        write_only=True,
        source="compatible_vehicles",
    )

    class Meta:
        model = MechanicService
        fields = [
            "id",
            "mechanic",
            "service_type",
            "name",
            "description",
            "base_price",
            "price_per_hour",
            "estimated_duration",
            "compatible_vehicles",
            "compatible_vehicle_ids",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["mechanic", "created_at", "updated_at"]


class MechanicHireRequestSerializer(ModelSerializer):
    "Serializer for mechanic hire requests"

    customer = UserSerializer(read_only=True)
    mechanic = MechanicProfileSerializer(read_only=True)
    service = MechanicServiceSerializer(read_only=True)

    class Meta:
        model = MechanicHireRequest
        fields = [
            "id",
            "customer",
            "mechanic",
            "service",
            "job_type",
            "problem_description",
            "vehicle_info",
            "service_location",
            "preferred_date",
            "preferred_time",
            "scheduled_date",
            "scheduled_time",
            "estimated_cost",
            "final_cost",
            "status",
            "mechanic_notes",
            "customer_notes",
            "work_completed",
            "parts_used",
            "created_at",
            "updated_at",
            "completed_at",
        ]
        read_only_fields = [
            "customer",
            "mechanic_notes",
            "scheduled_date",
            "scheduled_time",
            "estimated_cost",
            "final_cost",
            "status",
            "work_completed",
            "parts_used",
            "created_at",
            "updated_at",
            "completed_at",
        ]


class MechanicHireRequestCreateSerializer(ModelSerializer):
    "Serializer for creating mechanic hire requests"

    class Meta:
        model = MechanicHireRequest
        fields = [
            "mechanic",
            "service",
            "job_type",
            "problem_description",
            "vehicle_info",
            "service_location",
            "preferred_date",
            "preferred_time",
            "customer_notes",
        ]

    def create(self, validated_data):
        validated_data["customer"] = self.context["request"].user
        return super().create(validated_data)


class MechanicAvailabilitySerializer(ModelSerializer):
    "Serializer for mechanic availability"

    class Meta:
        model = MechanicAvailability
        fields = [
            "id",
            "mechanic",
            "day_of_week",
            "start_time",
            "end_time",
            "is_available",
        ]
        read_only_fields = ["mechanic"]
