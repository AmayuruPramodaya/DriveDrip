from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import api_view, permission_classes
from rating.serializers import RatingSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import filters, status
from rating.models import Rating, Review
from django.db.models import Avg

from rest_framework.generics import (
    RetrieveUpdateDestroyAPIView,
    RetrieveUpdateAPIView,
    ListCreateAPIView,
)

from .serializers import (
    MechanicHireRequestCreateSerializer,
    MechanicAvailabilitySerializer,
    MechanicHireRequestSerializer,
    MechanicServiceSerializer,
    MechanicProfileSerializer,
)
from .models import (
    MechanicAvailability,
    MechanicHireRequest,
    MechanicProfile,
    MechanicService,
)

# Create your views here.


class MechanicProfileListCreateView(ListCreateAPIView):
    """List all mechanics or create a new mechanic profile"""

    serializer_class = MechanicProfileSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["user__username", "user__name", "business_name", "service_area"]
    ordering_fields = ["service_rating", "years_of_experience", "created_at"]
    ordering = ["-service_rating", "-years_of_experience"]

    def get_permissions(self):
        """
        Allow anyone to view the list of mechanics,
        but require authentication to create a new mechanic profile.
        """
        if self.request.method == "GET":
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = MechanicProfile.objects.select_related("user").prefetch_related(
            "specializations"
        )

        # Filter parameters
        province = self.request.query_params.get("province")
        district = self.request.query_params.get("district")
        is_mobile = self.request.query_params.get("is_mobile")
        is_available = self.request.query_params.get("is_available")
        specialization = self.request.query_params.get("specialization")

        if province:
            queryset = queryset.filter(province__icontains=province)
        if district:
            queryset = queryset.filter(district__icontains=district)
        if is_mobile is not None:
            queryset = queryset.filter(is_mobile=is_mobile.lower() == "true")
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == "true")
        if specialization:
            queryset = queryset.filter(specializations__name__icontains=specialization)

        return queryset.distinct()

    def perform_create(self, serializer):
        # Only allow mechanics to create their profile
        if self.request.user.role != "MECHANIC":
            raise PermissionDenied("Only mechanics can create mechanic profiles")

        # Check if user already has a mechanic profile
        if hasattr(self.request.user, "mechanic_profile"):
            raise ValidationError("User already has a mechanic profile")

        serializer.save(user=self.request.user)


class MechanicProfileDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a mechanic profile"""

    queryset = MechanicProfile.objects.select_related("user").prefetch_related(
        "specializations"
    )
    serializer_class = MechanicProfileSerializer

    def get_permissions(self):
        """
        Allow anyone to view a mechanic profile,
        but require authentication and ownership for updates/deletes.
        """
        if self.request.method == "GET":
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_object(self):
        obj = super().get_object()

        # Only the mechanic themselves can update/delete their profile
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if obj.user != self.request.user:
                raise PermissionDenied("You can only modify your own profile")

        return obj


class MechanicServiceListCreateView(ListCreateAPIView):
    """List mechanic services or create a new service"""

    serializer_class = MechanicServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "service_type"]
    ordering_fields = ["base_price", "created_at"]
    ordering = ["base_price"]

    def get_permissions(self):
        """
        Allow anyone to view mechanic services,
        but require authentication to create new services.
        """
        if self.request.method == "GET":
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = MechanicService.objects.select_related(
            "mechanic__user"
        ).prefetch_related("compatible_vehicles")

        # Filter by mechanic
        mechanic_id = self.request.query_params.get("mechanic")
        if mechanic_id:
            queryset = queryset.filter(mechanic_id=mechanic_id)

        # Filter by service type
        service_type = self.request.query_params.get("service_type")
        if service_type:
            queryset = queryset.filter(service_type=service_type)

        # Filter by vehicle compatibility
        vehicle_category = self.request.query_params.get("vehicle_category")
        if vehicle_category:
            queryset = queryset.filter(compatible_vehicles__id=vehicle_category)

        # Only show active services for non-owners
        if not self.request.query_params.get("include_inactive"):
            queryset = queryset.filter(is_active=True)

        return queryset.distinct()

    def perform_create(self, serializer):
        # Get or create mechanic profile for the user
        try:
            mechanic_profile = self.request.user.mechanic_profile
        except MechanicProfile.DoesNotExist:
            raise ValidationError("You must have a mechanic profile to create services")

        serializer.save(mechanic=mechanic_profile)


class MechanicServiceDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a mechanic service"""

    queryset = MechanicService.objects.select_related(
        "mechanic__user"
    ).prefetch_related("compatible_vehicles")
    serializer_class = MechanicServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()

        # Only the service owner can update/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if obj.mechanic.user != self.request.user:
                raise PermissionDenied("You can only modify your own services")

        return obj


class MechanicHireRequestListCreateView(ListCreateAPIView):
    """List hire requests or create a new one"""

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "preferred_date", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MechanicHireRequestCreateSerializer
        return MechanicHireRequestSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = MechanicHireRequest.objects.select_related(
            "customer", "mechanic__user", "service"
        )

        # Filter based on user role
        if user.role == "MECHANIC":
            # Mechanics see requests for their services
            queryset = queryset.filter(mechanic__user=user)
        else:
            # Customers see their own requests
            queryset = queryset.filter(customer=user)

        # Filter by status
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        # Ensure customer is not trying to hire themselves
        mechanic = serializer.validated_data["mechanic"]
        if mechanic.user == self.request.user:
            raise ValidationError("You cannot hire yourself")

        serializer.save(customer=self.request.user)


class MechanicHireRequestDetailView(RetrieveUpdateAPIView):
    """Retrieve or update a hire request"""

    queryset = MechanicHireRequest.objects.select_related(
        "customer", "mechanic__user", "service"
    )
    serializer_class = MechanicHireRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user

        # Check permissions
        if user != obj.customer and user != obj.mechanic.user:
            raise PermissionDenied("You can only view your own hire requests")

        return obj

    def perform_update(self, serializer):
        obj = self.get_object()
        user = self.request.user

        # Define what each role can update
        if user == obj.customer:
            # Customers can update their notes and cancel
            allowed_fields = ["customer_notes", "status"]
            if serializer.validated_data.get("status") not in [None, "CANCELLED"]:
                if obj.status != "PENDING":
                    raise ValidationError("You can only cancel pending requests")
        elif user == obj.mechanic.user:
            # Mechanics can update most fields
            allowed_fields = [
                "status",
                "mechanic_notes",
                "scheduled_date",
                "scheduled_time",
                "estimated_cost",
                "final_cost",
                "work_completed",
                "parts_used",
            ]

            # Handle status transitions
            new_status = serializer.validated_data.get("status")
            if new_status == "COMPLETED" and obj.status != "IN_PROGRESS":
                raise ValidationError("Can only complete jobs that are in progress")
            elif new_status == "COMPLETED":
                serializer.validated_data["completed_at"] = timezone.now()
        else:
            raise PermissionDenied("Access denied")

        # Filter out fields not allowed for this user
        validated_data = {
            k: v for k, v in serializer.validated_data.items() if k in allowed_fields
        }

        serializer.save(**validated_data)


class MechanicAvailabilityListCreateView(ListCreateAPIView):
    """List or create mechanic availability"""

    serializer_class = MechanicAvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get availability for the requesting user's mechanic profile
        try:
            mechanic_profile = self.request.user.mechanic_profile
            return MechanicAvailability.objects.filter(mechanic=mechanic_profile)
        except MechanicProfile.DoesNotExist:
            return MechanicAvailability.objects.none()

    def perform_create(self, serializer):
        try:
            mechanic_profile = self.request.user.mechanic_profile
        except MechanicProfile.DoesNotExist:
            raise ValidationError(
                "You must have a mechanic profile to set availability"
            )

        serializer.save(mechanic=mechanic_profile)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rate_mechanic(request, hire_request_id):
    """Rate a mechanic after job completion"""
    hire_request = get_object_or_404(MechanicHireRequest, id=hire_request_id)

    # Only the customer can rate the mechanic
    if request.user != hire_request.customer:
        raise PermissionDenied("Only the customer can rate the mechanic")

    # Job must be completed
    if hire_request.status != "COMPLETED":
        raise ValidationError("You can only rate completed jobs")

    # Check if already rated
    if Rating.objects.filter(
        rater=request.user, rated_hire_request=hire_request
    ).exists():
        raise ValidationError("You have already rated this job")

    rating_value = request.data.get("rating")
    if not rating_value or not (1 <= int(rating_value) <= 5):
        raise ValidationError("Rating must be between 1 and 5")

    # Create the rating
    rating = Rating.objects.create(
        rater=request.user,
        rating_type="MECHANIC_SERVICE",
        rating=int(rating_value),
        rated_hire_request=hire_request,
        rated_mechanic=hire_request.mechanic,
    )

    # Update mechanic's average rating
    mechanic = hire_request.mechanic
    all_ratings = Rating.objects.filter(rated_mechanic=mechanic)
    mechanic.service_rating = all_ratings.aggregate(Avg("rating"))["rating__avg"] or 0
    mechanic.total_service_ratings = all_ratings.count()
    mechanic.save(update_fields=["service_rating", "total_service_ratings"])

    return Response(
        {
            "message": "Rating submitted successfully",
            "rating": RatingSerializer(rating).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def review_mechanic(request, hire_request_id):
    """Review a mechanic after job completion"""
    hire_request = get_object_or_404(MechanicHireRequest, id=hire_request_id)

    # Only the customer can review the mechanic
    if request.user != hire_request.customer:
        raise PermissionDenied("Only the customer can review the mechanic")

    # Job must be completed
    if hire_request.status != "COMPLETED":
        raise ValidationError("You can only review completed jobs")

    # Check if already reviewed
    if Review.objects.filter(
        reviewer=request.user, reviewed_hire_request=hire_request
    ).exists():
        raise ValidationError("You have already reviewed this job")

    title = request.data.get("title")
    content = request.data.get("content")

    if not title or not content:
        raise ValidationError("Title and content are required")

    # Get associated rating if it exists
    rating = Rating.objects.filter(
        rater=request.user, rated_hire_request=hire_request
    ).first()

    # Create the review
    review = Review.objects.create(
        reviewer=request.user,
        review_type="MECHANIC_SERVICE",
        title=title,
        content=content,
        reviewed_hire_request=hire_request,
        reviewed_mechanic=hire_request.mechanic,
        rating=rating,
    )

    return Response(
        {
            "message": "Review submitted successfully",
            "review": ReviewSerializer(review).data,
        },
        status=status.HTTP_201_CREATED,
    )
