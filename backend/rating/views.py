from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ReviewSerializer, RatingSerializer
from rest_framework.response import Response
from rest_framework import filters, status
from .models import Rating, Review

# Create your views here.


class RatingListCreateView(ListCreateAPIView):
    """List ratings or create a new rating"""

    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by rating type
        rating_type = self.request.query_params.get("rating_type", None)
        if rating_type:
            queryset = queryset.filter(rating_type=rating_type)

        # Filter by target
        rated_user = self.request.query_params.get("rated_user", None)
        if rated_user:
            queryset = queryset.filter(rated_user=rated_user)

        rated_shop = self.request.query_params.get("rated_shop", None)
        if rated_shop:
            queryset = queryset.filter(rated_shop=rated_shop)

        rated_spare_part = self.request.query_params.get("rated_spare_part", None)
        if rated_spare_part:
            queryset = queryset.filter(rated_spare_part=rated_spare_part)

        return queryset

    def perform_create(self, serializer):
        serializer.save(rater=self.request.user)


# Review views
class ReviewListCreateView(ListCreateAPIView):
    """List reviews or create a new review"""

    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "content"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """
        Allow anyone to view reviews (GET), but require authentication to create reviews (POST)
        """
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by review type
        review_type = self.request.query_params.get("review_type", None)
        if review_type:
            queryset = queryset.filter(review_type=review_type)

        # Filter by target
        reviewed_user = self.request.query_params.get("reviewed_user", None)
        if reviewed_user:
            queryset = queryset.filter(reviewed_user=reviewed_user)

        reviewed_shop = self.request.query_params.get("reviewed_shop", None)
        if reviewed_shop:
            queryset = queryset.filter(reviewed_shop=reviewed_shop)

        reviewed_spare_part = self.request.query_params.get("reviewed_spare_part", None)
        if reviewed_spare_part:
            queryset = queryset.filter(reviewed_spare_part=reviewed_spare_part)

        return queryset

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class ReviewDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a review"""

    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        """
        Allow anyone to view reviews (GET), but require authentication to modify reviews (PUT/PATCH/DELETE)
        """
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_object(self):
        review = super().get_object()
        # Only review author can update/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if review.reviewer != self.request.user:
                raise PermissionDenied("You can only modify your own reviews")
        return review


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rate_item(request):
    """Rate a user, shop, or spare part"""
    # Debug: Print incoming request data
    print(f"Rate item request data: {request.data}")
    print(f"User: {request.user}")

    rating_type = request.data.get("rating_type")
    rating_value = request.data.get("rating")
    target_id = request.data.get("target_id")

    if not all([rating_type, rating_value, target_id]):
        return Response(
            {"error": "rating_type, rating, and target_id are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if rating_value not in [1, 2, 3, 4, 5]:
        return Response(
            {"error": "Rating must be between 1 and 5"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if rating already exists and update it instead of creating new one
    existing_rating = None
    if rating_type == "USER":
        existing_rating = Rating.objects.filter(
            rater=request.user, rated_user_id=target_id
        ).first()
    elif rating_type == "SHOP":
        existing_rating = Rating.objects.filter(
            rater=request.user, rated_shop_id=target_id
        ).first()
    elif rating_type == "SPARE_PART":
        existing_rating = Rating.objects.filter(
            rater=request.user, rated_spare_part_id=target_id
        ).first()
    else:
        return Response(
            {"error": "Invalid rating_type"}, status=status.HTTP_400_BAD_REQUEST
        )

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_value
        existing_rating.save()
        serializer = RatingSerializer(existing_rating)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Create new rating
    rating_data = {"rating_type": rating_type, "rating": rating_value}

    if rating_type == "USER":
        rating_data["rated_user"] = target_id
    elif rating_type == "SHOP":
        rating_data["rated_shop"] = target_id
    elif rating_type == "SPARE_PART":
        rating_data["rated_spare_part"] = target_id

    print(f"Creating new rating with data: {rating_data}")
    serializer = RatingSerializer(data=rating_data)
    if serializer.is_valid():
        # Set the rater during save instead of in data
        serializer.save(rater=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Debug: Print the validation errors
    print(f"Rating validation failed: {serializer.errors}")
    print(f"Rating data sent: {rating_data}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
