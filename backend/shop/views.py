from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework import status, filters
from rest_framework.views import APIView
from .serializers import ShopSerializer
from .models import Shop

# Create your views here.


class UserShopsView(APIView):
    """Get all shops for the current user"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        shops = Shop.objects.filter(seller=request.user)
        serializer = ShopSerializer(shops, many=True, context={"request": request})
        return Response(serializer.data)


class UserShopView(APIView):
    """Get the current user's primary shop (for backward compatibility)"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get the first shop (most recent)
            shop = Shop.objects.filter(seller=request.user).first()
            if shop:
                serializer = ShopSerializer(shop, context={"request": request})
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "User has no shops"}, status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShopListCreateView(ListCreateAPIView):
    """List all shops or create a new shop (for sellers only)"""

    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "address"]
    ordering_fields = ["name", "average_rating", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        """Allow anyone to list shops, but require authentication to create"""
        if self.request.method == "POST":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Custom filtering for province and district"""
        queryset = super().get_queryset()

        # Province filter - use dedicated province field
        province = self.request.query_params.get("province")
        if province:
            queryset = queryset.filter(province__icontains=province)

        # District filter - use dedicated district field
        district = self.request.query_params.get("district")
        if district:
            queryset = queryset.filter(district__icontains=district)

        # Rating filter
        rating_min = self.request.query_params.get("rating_min")
        if rating_min:
            try:
                rating_min = float(rating_min)
                queryset = queryset.filter(average_rating__gte=rating_min)
            except ValueError:
                pass

        # Verified only filter
        verified_only = self.request.query_params.get("verified_only")
        if verified_only and verified_only.lower() == "true":
            queryset = queryset.filter(is_verified=True)

        return queryset

    def perform_create(self, serializer):
        # Only sellers can create shops
        if self.request.user.role != "SELLER":
            raise PermissionDenied("Only sellers can create shops")

        # Debug logging
        print(
            f"Creating shop for user: {self.request.user.id} ({self.request.user.username})"
        )
        print(f"Shop data received: {serializer.validated_data}")

        serializer.save(seller=self.request.user)


class ShopDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a shop"""

    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

    def get_permissions(self):
        """Allow anyone to view shops, but require authentication to modify"""
        if self.request.method == "GET":
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_object(self):
        shop = super().get_object()
        # Only shop owner can update/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if shop.seller != self.request.user:
                raise PermissionDenied("You can only modify your own shop")
        return shop


# Security enhancement: Ensure users can only access their own shops
# Add check in get_queryset to prevent users from seeing other users' shops
class ShopUserAccessControl(RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a shop with access control"""

    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Limit queryset to the current user's shops"""
        user = self.request.user
        return super().get_queryset().filter(seller=user)

    def get_object(self):
        shop = super().get_object()
        # Only shop owner can update/delete
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if shop.seller != self.request.user:
                raise PermissionDenied("You can only modify your own shop")
        return shop
