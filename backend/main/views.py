from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .ai_utils import generate_text_from_prompt

from .models import (
    User, Shop, VehicleCategory, VehicleBrand, VehicleModel,
    SparePartCategory, SparePart, SparePartImage, Rating, Review,
    Order, OrderItem, ChatConversation, ChatMessage,
    MechanicProfile, MechanicService, MechanicHireRequest, MechanicAvailability,
    CarModel3D
)
from .serializers import (
    UserSerializer, ShopSerializer, VehicleCategorySerializer,
    VehicleBrandSerializer, VehicleModelSerializer, SparePartCategorySerializer,
    SparePartSerializer, RatingSerializer, ReviewSerializer,
    OrderSerializer, PopularSparePartSerializer, ChatConversationSerializer,
    ChatMessageSerializer, ChatConversationCreateSerializer,
    MechanicProfileSerializer, MechanicServiceSerializer, MechanicHireRequestSerializer,
    MechanicHireRequestCreateSerializer, MechanicAvailabilitySerializer,
    CarModel3DSerializer
)

# !User views


class UserCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)


# TODO: To send user credentials to the frontend
class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)


# Shop views
class UserShopsView(APIView):
    """Get all shops for the current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        shops = Shop.objects.filter(seller=request.user)
        serializer = ShopSerializer(shops, many=True, context={'request': request})
        return Response(serializer.data)


class UserShopView(APIView):
    """Get the current user's primary shop (for backward compatibility)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the first shop (most recent)
            shop = Shop.objects.filter(seller=request.user).first()
            if shop:
                serializer = ShopSerializer(shop, context={'request': request})
                return Response(serializer.data)
            else:
                return Response({"detail": "User has no shops"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ShopListCreateView(generics.ListCreateAPIView):
    """List all shops or create a new shop (for sellers only)"""
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['name', 'average_rating', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        """Allow anyone to list shops, but require authentication to create"""
        if self.request.method == 'POST':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Custom filtering for province and district"""
        queryset = super().get_queryset()
        
        # Province filter - use dedicated province field
        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(province__icontains=province)
        
        # District filter - use dedicated district field
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(district__icontains=district)
            
        # Rating filter
        rating_min = self.request.query_params.get('rating_min')
        if rating_min:
            try:
                rating_min = float(rating_min)
                queryset = queryset.filter(average_rating__gte=rating_min)
            except ValueError:
                pass
                
        # Verified only filter
        verified_only = self.request.query_params.get('verified_only')
        if verified_only and verified_only.lower() == 'true':
            queryset = queryset.filter(is_verified=True)
            
        return queryset

    def perform_create(self, serializer):
        # Only sellers can create shops
        if self.request.user.role != 'SELLER':
            raise PermissionDenied("Only sellers can create shops")
            
        # Debug logging
        print(f"Creating shop for user: {self.request.user.id} ({self.request.user.username})")
        print(f"Shop data received: {serializer.validated_data}")
        
        serializer.save(seller=self.request.user)


class ShopDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a shop"""
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer

    def get_permissions(self):
        """Allow anyone to view shops, but require authentication to modify"""
        if self.request.method == 'GET':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_object(self):
        shop = super().get_object()
        # Only shop owner can update/delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if shop.seller != self.request.user:
                raise PermissionDenied("You can only modify your own shop")
        return shop


# Security enhancement: Ensure users can only access their own shops
# Add check in get_queryset to prevent users from seeing other users' shops
class ShopUserAccessControl(generics.RetrieveUpdateDestroyAPIView):
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
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if shop.seller != self.request.user:
                raise PermissionDenied("You can only modify your own shop")
        return shop


# Vehicle Category views
class VehicleCategoryListView(generics.ListAPIView):
    """List all vehicle categories"""
    queryset = VehicleCategory.objects.all()
    serializer_class = VehicleCategorySerializer
    permission_classes = [AllowAny]


# Vehicle Brand views
class VehicleBrandListView(generics.ListAPIView):
    """List all vehicle brands"""
    queryset = VehicleBrand.objects.all()
    serializer_class = VehicleBrandSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset


# Vehicle Model views
class VehicleModelListView(generics.ListAPIView):
    """List all vehicle models"""
    queryset = VehicleModel.objects.all()
    serializer_class = VehicleModelSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()
        brand = self.request.query_params.get('brand', None)
        if brand:
            queryset = queryset.filter(brand=brand)
        return queryset


# Spare Part Category views
class SparePartCategoryListView(generics.ListAPIView):
    """List all spare part categories"""
    queryset = SparePartCategory.objects.all()
    serializer_class = SparePartCategorySerializer
    permission_classes = [AllowAny]


# Spare Part views
class SparePartListCreateView(generics.ListCreateAPIView):
    """List all spare parts or create a new spare part"""
    queryset = SparePart.objects.filter(is_active=True)
    serializer_class = SparePartSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'part_number']
    ordering_fields = ['name', 'price', 'average_rating', 'total_sales', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        """Allow anyone to list parts, but require authentication to create"""
        if self.request.method == 'POST':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by condition
        condition = self.request.query_params.get('condition', None)
        if condition:
            queryset = queryset.filter(condition=condition)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by vehicle compatibility
        vehicle_model = self.request.query_params.get('vehicle_model', None)
        if vehicle_model:
            queryset = queryset.filter(compatible_vehicles=vehicle_model)
        
        # Filter by vehicle brand - NEW
        vehicle_brand = self.request.query_params.get('vehicle_brand', None)
        if vehicle_brand:
            queryset = queryset.filter(compatible_vehicles__brand=vehicle_brand)
        
        # Filter by year range - NEW
        year_from = self.request.query_params.get('year_from', None)
        year_to = self.request.query_params.get('year_to', None)
        if year_from or year_to:
            # Filter parts compatible with vehicles in the specified year range
            year_filter = Q()
            if year_from and year_to:
                # Parts compatible with vehicles that overlap with the specified range
                year_filter = Q(
                    compatible_vehicles__year_from__lte=year_to,
                    compatible_vehicles__year_to__gte=year_from
                ) | Q(
                    compatible_vehicles__year_from__lte=year_to,
                    compatible_vehicles__year_to__isnull=True
                )
            elif year_from:
                # Parts compatible with vehicles from year_from onwards
                year_filter = Q(
                    compatible_vehicles__year_to__gte=year_from
                ) | Q(
                    compatible_vehicles__year_to__isnull=True
                )
            elif year_to:
                # Parts compatible with vehicles up to year_to
                year_filter = Q(compatible_vehicles__year_from__lte=year_to)
            
            queryset = queryset.filter(year_filter)
        
        # Filter by seller
        seller = self.request.query_params.get('seller', None)
        if seller:
            queryset = queryset.filter(seller=seller)
            
        # Filter by shop
        shop = self.request.query_params.get('shop', None)
        if shop:
            queryset = queryset.filter(shop=shop)
            
        # Province filter - check part province first, then shop province
        province = self.request.query_params.get('province')
        if province:
            queryset = queryset.filter(
                Q(province__icontains=province) | 
                Q(shop__province__icontains=province)
            )
        
        # District filter - check part district first, then shop district
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(
                Q(district__icontains=district) |
                Q(shop__district__icontains=district)
            )
        
        # Remove duplicates when filtering by vehicle relationships
        return queryset.distinct()

    def perform_create(self, serializer):
        # Set the seller to current user
        if self.request.user.role != 'SELLER':
            raise PermissionDenied("Only sellers can add spare parts")
        
        # Get the shop from request data if provided
        shop_id = self.request.data.get('shop')
        shop = None
        
        if shop_id:
            try:
                # Ensure the shop belongs to the current user
                shop = Shop.objects.get(id=shop_id, seller=self.request.user)
            except Shop.DoesNotExist:
                raise ValidationError("Shop not found or you don't have permission to add parts to this shop")
        
        serializer.save(seller=self.request.user, shop=shop)


class SparePartDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a spare part"""
    queryset = SparePart.objects.all()
    serializer_class = SparePartSerializer

    def get_permissions(self):
        """Allow anyone to view parts, but require authentication to modify"""
        if self.request.method == 'GET':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_object(self):
        spare_part = super().get_object()
        # Only part owner can update/delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if spare_part.seller != self.request.user:
                raise PermissionDenied("You can only modify your own spare parts")
        return spare_part


class PopularSparePartsView(generics.ListAPIView):
    """List most selling spare parts"""
    serializer_class = PopularSparePartSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return SparePart.objects.filter(is_active=True).order_by('-total_sales')[:20]


# Rating views
class RatingListCreateView(generics.ListCreateAPIView):
    """List ratings or create a new rating"""
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by rating type
        rating_type = self.request.query_params.get('rating_type', None)
        if rating_type:
            queryset = queryset.filter(rating_type=rating_type)
        
        # Filter by target
        rated_user = self.request.query_params.get('rated_user', None)
        if rated_user:
            queryset = queryset.filter(rated_user=rated_user)
        
        rated_shop = self.request.query_params.get('rated_shop', None)
        if rated_shop:
            queryset = queryset.filter(rated_shop=rated_shop)
        
        rated_spare_part = self.request.query_params.get('rated_spare_part', None)
        if rated_spare_part:
            queryset = queryset.filter(rated_spare_part=rated_spare_part)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(rater=self.request.user)


# Review views
class ReviewListCreateView(generics.ListCreateAPIView):
    """List reviews or create a new review"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Allow anyone to view reviews (GET), but require authentication to create reviews (POST)
        """
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by review type
        review_type = self.request.query_params.get('review_type', None)
        if review_type:
            queryset = queryset.filter(review_type=review_type)
        
        # Filter by target
        reviewed_user = self.request.query_params.get('reviewed_user', None)
        if reviewed_user:
            queryset = queryset.filter(reviewed_user=reviewed_user)
        
        reviewed_shop = self.request.query_params.get('reviewed_shop', None)
        if reviewed_shop:
            queryset = queryset.filter(reviewed_shop=reviewed_shop)
        
        reviewed_spare_part = self.request.query_params.get('reviewed_spare_part', None)
        if reviewed_spare_part:
            queryset = queryset.filter(reviewed_spare_part=reviewed_spare_part)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a review"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer

    def get_permissions(self):
        """
        Allow anyone to view reviews (GET), but require authentication to modify reviews (PUT/PATCH/DELETE)
        """
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_object(self):
        review = super().get_object()
        # Only review author can update/delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if review.reviewer != self.request.user:
                raise PermissionDenied("You can only modify your own reviews")
        return review


# Order views
class OrderListCreateView(generics.ListCreateAPIView):
    """List orders or create a new order"""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    search_fields = ['order_number', 'status']

    def get_queryset(self):
        # Users can only see their own orders (as buyers)
        return Order.objects.filter(buyer=self.request.user)

    def perform_create(self, serializer):
        # Generate order number
        import uuid
        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(buyer=self.request.user, order_number=order_number)


class OrderDetailView(generics.RetrieveUpdateAPIView):
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


class BuyerOrdersView(generics.ListAPIView):
    """List orders for buyers"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    search_fields = ['order_number', 'status']

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user)


class SellerOrdersView(generics.ListAPIView):
    """List orders for sellers - orders containing their spare parts"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    search_fields = ['order_number', 'status']

    def get_queryset(self):
        # Get orders that contain spare parts sold by this seller
        return Order.objects.filter(
            items__spare_part__seller=self.request.user
        ).distinct()


# API views for specific functionality
@api_view(['GET'])
@permission_classes([AllowAny])
def search_spare_parts(request):
    """Advanced search for spare parts"""
    query = request.GET.get('q', '')
    category = request.GET.get('category', '')
    min_price = request.GET.get('min_price', '')
    max_price = request.GET.get('max_price', '')
    condition = request.GET.get('condition', '')
    vehicle_model = request.GET.get('vehicle_model', '')
    
    spare_parts = SparePart.objects.filter(is_active=True)
    
    if query:
        spare_parts = spare_parts.filter(
            Q(name__icontains=query) | 
            Q(description__icontains=query) |
            Q(part_number__icontains=query)
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
    
    spare_parts = spare_parts.order_by('-total_sales', '-average_rating')
    
    serializer = SparePartSerializer(spare_parts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def trending_spare_parts(request):
    """Get trending spare parts based on recent sales and ratings"""
    from django.utils import timezone
    from datetime import timedelta
    
    # Get parts with recent activity (last 30 days)
    recent_date = timezone.now() - timedelta(days=30)
    
    trending_parts = SparePart.objects.filter(
        is_active=True,
        created_at__gte=recent_date
    ).order_by('-total_sales', '-average_rating')[:10]
    
    serializer = PopularSparePartSerializer(trending_parts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_item(request):
    """Rate a user, shop, or spare part"""
    # Debug: Print incoming request data
    print(f"Rate item request data: {request.data}")
    print(f"User: {request.user}")
    
    rating_type = request.data.get('rating_type')
    rating_value = request.data.get('rating')
    target_id = request.data.get('target_id')
    
    if not all([rating_type, rating_value, target_id]):
        return Response(
            {'error': 'rating_type, rating, and target_id are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if rating_value not in [1, 2, 3, 4, 5]:
        return Response(
            {'error': 'Rating must be between 1 and 5'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if rating already exists and update it instead of creating new one
    existing_rating = None
    if rating_type == 'USER':
        existing_rating = Rating.objects.filter(
            rater=request.user, 
            rated_user_id=target_id
        ).first()
    elif rating_type == 'SHOP':
        existing_rating = Rating.objects.filter(
            rater=request.user, 
            rated_shop_id=target_id
        ).first()
    elif rating_type == 'SPARE_PART':
        existing_rating = Rating.objects.filter(
            rater=request.user, 
            rated_spare_part_id=target_id
        ).first()
    else:
        return Response(
            {'error': 'Invalid rating_type'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_value
        existing_rating.save()
        serializer = RatingSerializer(existing_rating)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # Create new rating
    rating_data = {
        'rating_type': rating_type,
        'rating': rating_value
    }
    
    if rating_type == 'USER':
        rating_data['rated_user'] = target_id
    elif rating_type == 'SHOP':
        rating_data['rated_shop'] = target_id
    elif rating_type == 'SPARE_PART':
        rating_data['rated_spare_part'] = target_id
    
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_shops(request):
    """Get only the current authenticated user's shops"""
    try:
        if request.user.role != 'SELLER':
            return Response(
                {'detail': 'Only sellers can have shops'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get only the current user's shops
        user_shops = Shop.objects.filter(seller=request.user, is_active=True)
        serializer = ShopSerializer(user_shops, many=True)
        
        return Response({
            'results': serializer.data,
            'count': user_shops.count()
        })
    except Exception as e:
        return Response(
            {'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Fixed SparePartListCreateView for multiple shops support
class SparePartListCreateViewFixed(generics.ListCreateAPIView):
    """List all spare parts or create a new spare part - Fixed for multiple shops"""
    serializer_class = SparePartSerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Create a spare part with proper shop handling for multiple shops"""
        if self.request.user.role != 'SELLER':
            raise PermissionDenied("Only sellers can add spare parts")
        
        # Get the shop from request data if provided
        shop_id = self.request.data.get('shop')
        shop = None
        
        if shop_id:
            try:
                # Ensure the shop belongs to the current user
                shop = Shop.objects.get(id=shop_id, seller=self.request.user)
            except Shop.DoesNotExist:
                raise ValidationError("Shop not found or you don't have permission to add parts to this shop")
        
        serializer.save(seller=self.request.user, shop=shop)

# Override the perform_create method to fix multiple shops issue
def fixed_perform_create(self, serializer):
    """Fixed perform_create method for multiple shops"""
    if self.request.user.role != 'SELLER':
        raise PermissionDenied("Only sellers can add spare parts")
    
    # Get the shop from request data if provided
    shop_id = self.request.data.get('shop')
    shop = None
    
    if shop_id:
        try:
            # Ensure the shop belongs to the current user
            shop = Shop.objects.get(id=shop_id, seller=self.request.user)
        except Shop.DoesNotExist:
            raise ValidationError("Shop not found or you don't have permission to add parts to this shop")
    
    serializer.save(seller=self.request.user, shop=shop)

# Monkey patch the existing view
SparePartListCreateView.perform_create = fixed_perform_create

# Test Django syntax with a simple import
print("Django views file loaded successfully")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_buyer_orders(request):
    """Get orders for the current buyer"""
    try:
        orders = Order.objects.filter(buyer=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({'results': serializer.data})
    except Exception as e:
        return Response(
            {'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_seller_orders(request):
    """Get orders for the current seller"""
    try:
        orders = Order.objects.filter(seller=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response({'results': serializer.data})
    except Exception as e:
        return Response(
            {'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class BuyerOrdersView(generics.ListAPIView):
    """List orders for buyers (orders they placed)"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']
    search_fields = ['order_number', 'status']

    def get_queryset(self):
        queryset = Order.objects.filter(buyer=self.request.user)
        
        # Filter by status if provided
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_part_description(request):
    """
    Generates a product description for a spare part using AI.
    """
    part_name = request.data.get('name', '')
    part_number = request.data.get('part_number', '')
    condition = request.data.get('condition', '')
    # You could also pass in compatible vehicle info for a better description

    if not part_name:
        return Response(
            {'error': 'Part name is required to generate a description.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    prompt = (
        f"Generate a professional and appealing product description for a vehicle spare part. "
        f"The product is a '{part_name}' (Part Number: {part_number if part_number else 'N/A'}) "
        f"in '{condition}' condition. "
        f"The description should be helpful for a car owner or mechanic looking to buy this part. "
        f"Highlight its benefits, quality, and typical use case. Format it with a short introduction, "
        f"a bulleted list of key features, and a concluding sentence. Do not use markdown."
    )

    generated_description = generate_text_from_prompt(prompt)

    if generated_description:
        return Response({'description': generated_description})
    else:
        return Response(
            {'error': 'Could not generate description at this time.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([AllowAny]) # Anyone can view a summary
def summarize_reviews(request, part_id):
    """
    Summarizes all reviews for a given spare part.
    """
    try:
        part = SparePart.objects.get(pk=part_id)
        reviews = Review.objects.filter(reviewed_spare_part=part)

        if reviews.count() < 3: # Only summarize if there are enough reviews
            return Response(
                {'summary': 'Not enough reviews to generate a summary.'},
                status=status.HTTP_200_OK
            )

        review_texts = "\n".join([f"- {r.content}" for r in reviews])

        prompt = (
            f"You are a helpful assistant for an auto parts website. "
            f"Summarize the following customer reviews for the product '{part.name}'. "
            f"Based on all the reviews, provide an overall summary in one paragraph. "
            f"Then, list the top 3 common 'Pros' and top 3 common 'Cons' in bullet points. "
            f"If you cannot find 3 pros or cons, list as many as you can find. "
            f"If there are no clear cons, state that. The response should be in JSON format with keys 'overall_summary', 'pros', and 'cons'.\n\n"
            f"Here are the reviews:\n{review_texts}"
        )

        summary_json_str = generate_text_from_prompt(prompt)
        # Clean up the response from Gemini to ensure it's valid JSON
        summary_json_str = summary_json_str.strip().replace('```json', '').replace('```', '')
        
        import json
        summary_data = json.loads(summary_json_str)
        
        return Response(summary_data)

    except SparePart.DoesNotExist:
        return Response({'error': 'Part not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {'error': f'Could not generate summary: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analyze_seller_reputation(request, seller_id):
    """
    AI-powered seller reputation analysis for admin use.
    Analyzes reviews, part descriptions, order history, and behavior patterns.
    """
    # Check if user is admin/staff
    if not request.user.is_staff:
        return Response(
            {'error': 'Only admin users can access seller reputation analysis.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        seller = User.objects.get(id=seller_id, role='SELLER')
        
        # Gather seller data
        shops = Shop.objects.filter(seller=seller)
        spare_parts = SparePart.objects.filter(seller=seller)
        reviews_received = Review.objects.filter(reviewed_shop__in=shops)
        ratings_received = Rating.objects.filter(rated_shop__in=shops)
        orders_involving_seller = Order.objects.filter(items__spare_part__seller=seller).distinct()
        
        # Prepare data for AI analysis
        analysis_data = {
            'seller_info': {
                'username': seller.username,
                'name': seller.name,
                'join_date': seller.date_joined.strftime('%Y-%m-%d'),
                'average_rating': seller.average_rating,
                'total_ratings': seller.total_ratings,
            },
            'business_metrics': {
                'total_shops': shops.count(),
                'total_spare_parts': spare_parts.count(),
                'total_orders': orders_involving_seller.count(),
                'active_parts': spare_parts.filter(is_active=True).count(),
            },
            'reviews_sample': [
                {
                    'content': review.content,
                    'rating': getattr(review.rating, 'rating', 0) if review.rating else 0,
                    'date': review.created_at.strftime('%Y-%m-%d')
                } for review in reviews_received.order_by('-created_at')[:10]
            ],
            'part_descriptions_sample': [
                {
                    'name': part.name,
                    'description': part.description[:200] + '...' if len(part.description) > 200 else part.description,
                    'price': float(part.price),
                    'condition': part.condition
                } for part in spare_parts.order_by('-created_at')[:5]
            ]
        }
        
        # Create AI prompt for comprehensive analysis
        prompt = f"""
        You are an AI assistant for an auto parts marketplace analyzing seller reputation. 
        Analyze the following seller data and provide a comprehensive reputation assessment:

        SELLER PROFILE:
        - Username: {analysis_data['seller_info']['username']}
        - Member since: {analysis_data['seller_info']['join_date']}
        - Average rating: {analysis_data['seller_info']['average_rating']}/5
        - Total ratings: {analysis_data['seller_info']['total_ratings']}

        BUSINESS METRICS:
        - Shops: {analysis_data['business_metrics']['total_shops']}
        - Total parts listed: {analysis_data['business_metrics']['total_spare_parts']}
        - Active parts: {analysis_data['business_metrics']['active_parts']}
        - Orders processed: {analysis_data['business_metrics']['total_orders']}

        RECENT REVIEWS:
        {chr(10).join([f"- Rating: {r['rating']}/5, Review: {r['content']}" for r in analysis_data['reviews_sample'][:5]])}

        PART DESCRIPTIONS SAMPLE:
        {chr(10).join([f"- {p['name']} ({p['condition']}): {p['description']}" for p in analysis_data['part_descriptions_sample'][:3]])}

        Please provide analysis in JSON format with these keys:
        1. "overall_reputation_score": A score from 1-10 (10 being excellent)
        2. "trust_level": "HIGH", "MEDIUM", or "LOW"
        3. "strengths": List of positive aspects
        4. "concerns": List of potential issues or red flags
        5. "recommendations": Suggested actions for admin
        6. "business_health": Assessment of seller's business activity
        7. "customer_satisfaction": Analysis based on reviews and ratings
        8. "detailed_analysis": Comprehensive narrative assessment

        Focus on: Review sentiment, business activity patterns, part description quality, pricing fairness, customer service quality, and any red flags.
        """
        
        # Get AI analysis
        ai_response = generate_text_from_prompt(prompt)
        
        if ai_response:
            # Clean and parse AI response
            ai_response = ai_response.strip().replace('```json', '').replace('```', '')
            
            try:
                import json
                analysis_result = json.loads(ai_response)
                
                # Add metadata
                analysis_result['analysis_date'] = timezone.now().isoformat()
                analysis_result['seller_id'] = seller_id
                analysis_result['data_points_analyzed'] = {
                    'reviews_count': reviews_received.count(),
                    'ratings_count': ratings_received.count(),
                    'parts_count': spare_parts.count(),
                    'orders_count': orders_involving_seller.count()
                }
                
                return Response(analysis_result)
                
            except json.JSONDecodeError:
                # If JSON parsing fails, return raw analysis
                return Response({
                    'analysis_date': timezone.now().isoformat(),
                    'seller_id': seller_id,
                    'raw_analysis': ai_response,
                    'error': 'Could not parse AI response as JSON'
                })
        else:
            return Response(
                {'error': 'Could not generate seller analysis at this time.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except User.DoesNotExist:
        return Response(
            {'error': 'Seller not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bulk_seller_analysis(request):
    """
    Bulk analysis of multiple sellers for admin dashboard.
    Returns summary insights across all sellers.
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Only admin users can access bulk seller analysis.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get all sellers with basic metrics
        sellers = User.objects.filter(role='SELLER').annotate(
            shop_count=Count('shops'),
            part_count=Count('spare_parts'),
            order_count=Count('spare_parts__order_items__order', distinct=True)
        ).order_by('-average_rating')
        
        # Identify top performers and potential issues
        top_performers = sellers.filter(average_rating__gte=4.5, total_ratings__gte=10)[:5]
        concerning_sellers = sellers.filter(
            Q(average_rating__lt=3.0) | 
            Q(total_ratings__gte=20, average_rating__lt=3.5)
        )[:5]
        new_sellers = sellers.filter(date_joined__gte=timezone.now() - timedelta(days=30))
        inactive_sellers = sellers.filter(
            spare_parts__isnull=True,
            date_joined__lt=timezone.now() - timedelta(days=60)
        )
        
        # Create summary prompt
        summary_data = {
            'total_sellers': sellers.count(),
            'top_performers': [
                {
                    'username': s.username,
                    'rating': s.average_rating,
                    'total_ratings': s.total_ratings,
                    'shops': s.shop_count,
                    'parts': s.part_count
                } for s in top_performers
            ],
            'concerning_sellers': [
                {
                    'username': s.username,
                    'rating': s.average_rating,
                    'total_ratings': s.total_ratings,
                    'shops': s.shop_count,
                    'parts': s.part_count
                } for s in concerning_sellers
            ],
            'new_sellers_count': new_sellers.count(),
            'inactive_sellers_count': inactive_sellers.count()
        }
        
        prompt = f"""
        Analyze this seller ecosystem summary for an auto parts marketplace:

        OVERVIEW:
        - Total sellers: {summary_data['total_sellers']}
        - New sellers (last 30 days): {summary_data['new_sellers_count']}
        - Inactive sellers: {summary_data['inactive_sellers_count']}

        TOP PERFORMERS:
        {chr(10).join([f"- {s['username']}: {s['rating']}/5 ({s['total_ratings']} ratings), {s['shops']} shops, {s['parts']} parts" for s in summary_data['top_performers']])}

        CONCERNING SELLERS:
        {chr(10).join([f"- {s['username']}: {s['rating']}/5 ({s['total_ratings']} ratings), {s['shops']} shops, {s['parts']} parts" for s in summary_data['concerning_sellers']])}

        Provide analysis in JSON format:
        1. "ecosystem_health": Overall health score (1-10)
        2. "key_insights": Main observations about the seller community
        3. "recommended_actions": Actions for marketplace admins
        4. "growth_opportunities": Ways to improve seller performance
        5. "risk_factors": Potential issues to monitor
        """
        
        ai_response = generate_text_from_prompt(prompt)
        
        if ai_response:
            ai_response = ai_response.strip().replace('```json', '').replace('```', '')
            try:
                import json
                analysis = json.loads(ai_response)
                analysis.update(summary_data)
                analysis['analysis_date'] = timezone.now().isoformat()
                return Response(analysis)
            except:
                return Response({
                    **summary_data,
                    'raw_analysis': ai_response,
                    'analysis_date': timezone.now().isoformat()
                })
        
        return Response(summary_data)
        
    except Exception as e:
        return Response(
            {'error': f'Bulk analysis failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def compatibility_chatbot(request, part_id):
    """
    AI chatbot to answer compatibility questions about spare parts.
    Answers questions like "Will this fit my 2019 Honda Civic?"
    """
    try:
        part = SparePart.objects.get(id=part_id)
        user_question = request.data.get('question', '').strip()
        
        if not user_question:
            return Response(
                {'error': 'Question is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get compatible vehicles for this part
        compatible_vehicles = part.compatible_vehicles.all()
        
        # Prepare vehicle compatibility data
        compatibility_data = []
        for vehicle in compatible_vehicles:
            compatibility_data.append({
                'brand': vehicle.brand.name,
                'model': vehicle.name,
                'year_from': vehicle.year_from,
                'year_to': vehicle.year_to,
                'category': vehicle.brand.category.name
            })
        
        # Create AI prompt for compatibility assistant
        prompt = f"""
        You are a helpful automotive compatibility assistant for an auto parts website. 
        A customer is asking about a spare part's compatibility with their vehicle.

        SPARE PART DETAILS:
        - Name: {part.name}
        - Part Number: {part.part_number or 'Not specified'}
        - Category: {part.category.name if part.category else 'Unknown'}
        - Condition: {part.condition}
        - Description: {part.description[:300]}...

        COMPATIBLE VEHICLES:
        {chr(10).join([f"- {v['brand']} {v['model']} ({v['year_from']}-{v['year_to'] or 'present'})" for v in compatibility_data[:20]])}

        CUSTOMER QUESTION: "{user_question}"

        Please provide a helpful, accurate response about compatibility. Include:
        1. Direct answer (Yes/No/Maybe with explanation)
        2. Specific vehicle information if mentioned
        3. Additional compatibility notes or warnings
        4. Suggestion to verify with seller if uncertain

        Respond in a friendly, helpful tone as if you're a knowledgeable parts specialist.
        Keep response concise but informative (maximum 200 words).
        """
        
        # Get AI response
        ai_response = generate_text_from_prompt(prompt)
        
        if ai_response:
            # Log the interaction for analytics
            interaction_data = {
                'part_id': part_id,
                'question': user_question,
                'response': ai_response,
                'timestamp': timezone.now().isoformat(),
                'compatible_vehicles_count': len(compatibility_data)
            }
            
            return Response({
                'response': ai_response.strip(),
                'part_name': part.name,
                'compatible_vehicles_count': len(compatibility_data),
                'interaction_id': f"chat_{part_id}_{timezone.now().timestamp()}"
            })
        else:
            return Response(
                {'error': 'Sorry, I could not process your question at this time. Please contact the seller directly.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except SparePart.DoesNotExist:
        return Response(
            {'error': 'Spare part not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Chatbot error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def semantic_search_parts(request):
    """
    AI-powered semantic search for spare parts.
    Understands intent behind search queries like "my car makes grinding noise when I stop"
    """
    query = request.data.get('query', '').strip()
    
    if not query:
        return Response(
            {'error': 'Search query is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # First, let AI interpret the search intent
        intent_prompt = f"""
        You are an automotive parts specialist AI. A customer searched: "{query}"
        
        Analyze this search query and provide PRECISE automotive part identification in JSON format:
        
        1. "search_intent": Specific automotive system/issue (e.g., "brake system maintenance", "engine starting problem")
        2. "suggested_categories": ONLY directly related part categories (max 2-3)
        3. "suggested_keywords": SPECIFIC part names/terms (max 4-5 most relevant)
        4. "vehicle_type_hints": Any vehicle details mentioned
        5. "urgency_level": "high", "medium", or "low"
        6. "problem_description": Technical issue description
        
        IMPORTANT RULES:
        - Be VERY SPECIFIC - only suggest directly related parts
        - For "grinding noise when braking" → ONLY brake system parts (brake pads, rotors, calipers)
        - For "headlight issues" → ONLY lighting parts (bulbs, assemblies, switches)
        - For "engine won't start" → ONLY starting system parts (battery, starter, ignition)
        - DO NOT mix unrelated automotive systems
        - Focus on the PRIMARY issue mentioned
        
        Examples of GOOD specific responses:
        "grinding noise when braking" → keywords: ["brake pad", "brake rotor", "brake disc"], categories: ["Brake System"]
        "headlight too dim" → keywords: ["headlight bulb", "headlight assembly"], categories: ["Lighting"]
        "car won't start" → keywords: ["battery", "starter motor", "ignition switch"], categories: ["Electrical", "Engine"]
        """
        
        # Pattern-based search for common automotive issues (more reliable than AI)
        query_lower = query.lower()
        
        # Brake-related searches
        if any(brake_word in query_lower for brake_word in ['brake', 'braking', 'stop', 'grinding']):
            parts = SparePart.objects.filter(
                Q(name__icontains='brake') | 
                Q(description__icontains='brake') |
                Q(name__icontains='pad') | 
                Q(description__icontains='pad') |
                Q(category__name__icontains='brake'),
                is_active=True
            ).order_by('-average_rating', '-total_sales')[:10]
            
            from .serializers import SparePartSerializer
            serializer = SparePartSerializer(parts, many=True)
            
            return Response({
                'results': serializer.data,
                'search_query': query,
                'results_count': parts.count(),
                'search_type': 'brake_specific'
            })
        
        # Engine/starting issues
        elif any(engine_word in query_lower for engine_word in ['start', 'starting', 'engine', 'motor', 'ignition']):
            parts = SparePart.objects.filter(
                Q(name__icontains='engine') | Q(description__icontains='engine') |
                Q(name__icontains='motor') | Q(description__icontains='motor') |
                Q(name__icontains='starter') | Q(description__icontains='starter') |
                Q(name__icontains='battery') | Q(description__icontains='battery') |
                Q(name__icontains='ignition') | Q(description__icontains='ignition') |
                Q(category__name__icontains='engine') | Q(category__name__icontains='electrical'),
                is_active=True
            ).order_by('-average_rating', '-total_sales')[:10]
            
            from .serializers import SparePartSerializer
            serializer = SparePartSerializer(parts, many=True)
            
            return Response({
                'results': serializer.data,
                'search_query': query,
                'results_count': parts.count(),
                'search_type': 'engine_specific'
            })
        
        # Lighting issues
        elif any(light_word in query_lower for light_word in ['light', 'headlight', 'bulb', 'lamp', 'dim', 'bright']):
            parts = SparePart.objects.filter(
                Q(name__icontains='light') | Q(description__icontains='light') |
                Q(name__icontains='bulb') | Q(description__icontains='bulb') |
                Q(name__icontains='lamp') | Q(description__icontains='lamp') |
                Q(category__name__icontains='light') | Q(category__name__icontains='lighting'),
                is_active=True
            ).order_by('-average_rating', '-total_sales')[:10]
            
            from .serializers import SparePartSerializer
            serializer = SparePartSerializer(parts, many=True)
            
            return Response({
                'results': serializer.data,
                'search_query': query,
                'results_count': parts.count(),
                'search_type': 'lighting_specific'
            })
        
        # Suspension issues
        elif any(suspension_word in query_lower for suspension_word in ['suspension', 'shock', 'spring', 'steering', 'vibrat']):
            parts = SparePart.objects.filter(
                Q(name__icontains='suspension') | Q(description__icontains='suspension') |
                Q(name__icontains='shock') | Q(description__icontains='shock') |
                Q(name__icontains='spring') | Q(description__icontains='spring') |
                Q(name__icontains='steering') | Q(description__icontains='steering') |
                Q(category__name__icontains='suspension') | Q(category__name__icontains='steering'),
                is_active=True
            ).order_by('-average_rating', '-total_sales')[:10]
            
            from .serializers import SparePartSerializer
            serializer = SparePartSerializer(parts, many=True)
            
            return Response({
                'results': serializer.data,
                'search_query': query,
                'results_count': parts.count(),
                'search_type': 'suspension_specific'
            })
        
        # Try AI interpretation for other queries (fallback to AI if patterns don't match)
        ai_intent = generate_text_from_prompt(intent_prompt)
        
        if not ai_intent:
            # Fallback to regular search
            return regular_search_fallback(query)
        
        try:
            # Parse AI intent response
            ai_intent = ai_intent.strip().replace('```json', '').replace('```', '')
            import json
            intent_data = json.loads(ai_intent)
            
            # Build smart search based on AI interpretation
            suggested_keywords = intent_data.get('suggested_keywords', [])
            suggested_categories = intent_data.get('suggested_categories', [])
            search_intent = intent_data.get('search_intent', '')
            
            # Start with empty queryset for precise search
            parts = SparePart.objects.none()
            
            # PRIORITIZED SEARCH STRATEGY:
            # 1. First try AI-suggested keywords (most specific)
            ai_keyword_parts = SparePart.objects.none()
            if suggested_keywords:
                ai_search_q = Q()
                
                for keyword_phrase in suggested_keywords:
                    # Use the full keyword phrase for more precise matching
                    keyword_phrase = keyword_phrase.lower().strip()
                    if len(keyword_phrase) > 2:
                        ai_search_q |= (
                            Q(name__icontains=keyword_phrase) |
                            Q(description__icontains=keyword_phrase) |
                            Q(category__name__icontains=keyword_phrase)
                        )
                        
                        # Also search individual meaningful words in the phrase
                        words = [w for w in keyword_phrase.split() if len(w) > 3 and w not in ['part', 'parts', 'system', 'auto', 'vehicle']]
                        for word in words:
                            ai_search_q |= (
                                Q(name__icontains=word) |
                                Q(description__icontains=word) |
                                Q(category__name__icontains=word)
                            )
                
                ai_keyword_parts = SparePart.objects.filter(ai_search_q, is_active=True)
            
            # 2. Category-based search (medium specificity)
            category_parts = SparePart.objects.none()
            if suggested_categories:
                category_q = Q()
                for category in suggested_categories:
                    category = category.lower().strip()
                    if len(category) > 2:
                        category_q |= Q(category__name__icontains=category)
                        
                        # Search category words individually
                        words = [w for w in category.split() if len(w) > 3]
                        for word in words:
                            category_q |= Q(category__name__icontains=word)
                
                category_parts = SparePart.objects.filter(category_q, is_active=True)
            
            # 3. Only combine results if AI keyword search found relevant parts
            if ai_keyword_parts.exists():
                parts = ai_keyword_parts
                # Add category parts only if they're related
                if category_parts.exists():
                    parts = (parts | category_parts).distinct()
            elif category_parts.exists():
                # Use category search if no keyword matches
                parts = category_parts
            else:
                # Last resort: search meaningful words from original query BUT be very restrictive
                query_words = query.lower().split()
                meaningful_words = [w for w in query_words if len(w) > 4 and w not in ['my', 'the', 'and', 'for', 'with', 'have', 'are', 'too', 'when', 'makes', 'noise', 'sound', 'grinding', 'loud']]
                
                if meaningful_words:
                    fallback_q = Q()
                    for word in meaningful_words[:2]:  # Limit to 2 most meaningful words only
                        fallback_q |= (
                            Q(name__icontains=word) |
                            Q(description__icontains=word) |
                            Q(category__name__icontains=word)
                        )
                    parts = SparePart.objects.filter(fallback_q, is_active=True)
            
            # Filter out clearly unrelated results based on search intent - MORE AGGRESSIVE
            if parts.exists() and search_intent:
                intent_lower = search_intent.lower()
                original_count = parts.count()
                
                # If search is about brakes, ONLY keep brake-related parts
                if any(brake_term in intent_lower for brake_term in ['brake', 'braking', 'stop']):
                    brake_filter = Q(
                        Q(name__icontains='brake') | Q(description__icontains='brake') |
                        Q(name__icontains='pad') | Q(description__icontains='pad') |
                        Q(name__icontains='rotor') | Q(description__icontains='rotor') |
                        Q(name__icontains='disc') | Q(description__icontains='disc') |
                        Q(name__icontains='caliper') | Q(description__icontains='caliper') |
                        Q(category__name__icontains='brake')
                    )
                    brake_parts = parts.filter(brake_filter)
                    if brake_parts.exists():
                        parts = brake_parts
                
                # Engine/starting issues
                elif any(engine_term in intent_lower for engine_term in ['engine', 'motor', 'start', 'starting']):
                    engine_filter = Q(
                        Q(name__icontains='engine') | Q(description__icontains='engine') |
                        Q(name__icontains='motor') | Q(description__icontains='motor') |
                        Q(name__icontains='starter') | Q(description__icontains='starter') |
                        Q(name__icontains='battery') | Q(description__icontains='battery') |
                        Q(name__icontains='ignition') | Q(description__icontains='ignition') |
                        Q(category__name__icontains='engine') | Q(category__name__icontains='electrical')
                    )
                    engine_parts = parts.filter(engine_filter)
                    if engine_parts.exists():
                        parts = engine_parts
                
                # Lighting issues
                elif any(light_term in intent_lower for light_term in ['light', 'lighting', 'headlight', 'bulb']):
                    light_filter = Q(
                        Q(name__icontains='light') | Q(description__icontains='light') |
                        Q(name__icontains='bulb') | Q(description__icontains='bulb') |
                        Q(name__icontains='lamp') | Q(description__icontains='lamp') |
                        Q(category__name__icontains='light') | Q(category__name__icontains='lighting')
                    )
                    light_parts = parts.filter(light_filter)
                    if light_parts.exists():
                        parts = light_parts
            
            # Get count and limit results
            total_count = parts.count()
            final_parts = parts.order_by('-average_rating', '-total_sales')[:15]
            
            # Serialize results
            from .serializers import SparePartSerializer
            serializer = SparePartSerializer(final_parts, many=True)
            
            return Response({
                'results': serializer.data,
                'search_query': query,
                'ai_interpretation': intent_data,
                'results_count': total_count,
                'search_type': 'semantic'
            })
            
        except json.JSONDecodeError:
            # If AI response parsing fails, fall back to regular search
            return regular_search_fallback(query)
            
    except Exception as e:
        # If anything fails, fall back to regular search
        return regular_search_fallback(query)

def regular_search_fallback(query):
    """Fallback search function when AI search fails"""
    try:
        # First try the full query
        full_query_parts = SparePart.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(part_number__icontains=query),
            is_active=True
        )
        
        # Also break down query into individual words for broader search
        query_words = query.lower().split()
        meaningful_words = [w for w in query_words if len(w) > 2 and w not in ['my', 'the', 'and', 'for', 'with', 'have', 'are', 'too', 'is', 'low', 'high']]
        
        word_search_q = Q()
        for word in meaningful_words:
            word_search_q |= (
                Q(name__icontains=word) |
                Q(description__icontains=word) |
                Q(part_number__icontains=word) |
                Q(category__name__icontains=word)
            )
        
        word_parts = SparePart.objects.filter(word_search_q, is_active=True)
        
        # Combine both search approaches
        combined_parts = (full_query_parts | word_parts).distinct().order_by('-average_rating', '-total_sales')
        
        # Get count before slicing
        total_count = combined_parts.count()
        parts_limited = combined_parts[:20]
        
        from .serializers import SparePartSerializer
        serializer = SparePartSerializer(parts_limited, many=True)
        
        return Response({
            'results': serializer.data,
            'search_query': query,
            'results_count': total_count,
            'search_type': 'keyword_fallback',
            'fallback_keywords': meaningful_words
        })
    except Exception as e:
        return Response(
            {'error': f'Search failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# !Chat views

class ChatConversationListCreateView(generics.ListCreateAPIView):
    """List conversations for current user or create a new conversation"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChatConversationCreateSerializer
        return ChatConversationSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Return conversations where user is either participant1 or participant2
        return ChatConversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).select_related('participant1', 'participant2', 'related_spare_part', 'related_hire_request')
    
    def perform_create(self, serializer):
        # For now, allow any authenticated user to create conversations
        # We'll handle conversation type logic in the serializer
        serializer.save()


class ChatConversationDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a specific conversation"""
    queryset = ChatConversation.objects.all()
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check if user is part of this conversation
        if user != obj.buyer and user != obj.seller:
            raise PermissionDenied("You are not part of this conversation")
        
        return obj


class ChatMessageListCreateView(generics.ListCreateAPIView):
    """List messages in a conversation or create a new message"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(ChatConversation, id=conversation_id)
        
        # Check if user is part of this conversation
        if self.request.user not in [conversation.participant1, conversation.participant2]:
            raise PermissionDenied("You are not part of this conversation")
        
        return ChatMessage.objects.filter(
            conversation=conversation,
            is_deleted=False
        ).select_related('sender')
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(ChatConversation, id=conversation_id)
        
        # Check if user is part of this conversation
        if self.request.user not in [conversation.participant1, conversation.participant2]:
            raise PermissionDenied("You are not part of this conversation")
        
        # Check if conversation is active
        if conversation.status != 'ACTIVE':
            raise ValidationError("Cannot send messages to inactive conversations")
        
        serializer.save(
            conversation=conversation,
            sender=self.request.user
        )


class MarkMessagesAsReadView(APIView):
    """Mark messages as read for the current user in a conversation"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(ChatConversation, id=conversation_id)
        user = request.user
        
        # Check if user is part of this conversation
        if user not in [conversation.buyer, conversation.seller]:
            raise PermissionDenied("You are not part of this conversation")
        
        # Update last read timestamp
        now = timezone.now()
        if user == conversation.buyer:
            conversation.buyer_last_read_at = now
            # Mark all seller's messages as read by buyer
            ChatMessage.objects.filter(
                conversation=conversation,
                sender=conversation.seller,
                read_by_buyer=False
            ).update(read_by_buyer=True)
        else:
            conversation.seller_last_read_at = now
            # Mark all buyer's messages as read by seller
            ChatMessage.objects.filter(
                conversation=conversation,
                sender=conversation.buyer,
                read_by_seller=False
            ).update(read_by_seller=True)
        
        conversation.save(update_fields=['buyer_last_read_at', 'seller_last_read_at'])
        
        return Response({'status': 'Messages marked as read'})


class ChatMessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific message"""
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatMessage.objects.select_related('sender', 'conversation')
    
    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        
        # Check if user is part of this conversation
        if user not in [obj.conversation.buyer, obj.conversation.seller]:
            raise PermissionDenied("You are not part of this conversation")
        
        return obj
    
    def perform_update(self, serializer):
        # Only message sender can edit their own messages
        if self.get_object().sender != self.request.user:
            raise PermissionDenied("You can only edit your own messages")
        
        serializer.save(is_edited=True)
    
    def perform_destroy(self, instance):
        # Only message sender can delete their own messages
        if instance.sender != self.request.user:
            raise PermissionDenied("You can only delete your own messages")
        
        # Soft delete - mark as deleted instead of actually deleting
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


# Mechanic Views

class MechanicProfileListCreateView(generics.ListCreateAPIView):
    """List all mechanics or create a new mechanic profile"""
    serializer_class = MechanicProfileSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'user__name', 'business_name', 'service_area']
    ordering_fields = ['service_rating', 'years_of_experience', 'created_at']
    ordering = ['-service_rating', '-years_of_experience']
    
    def get_permissions(self):
        """
        Allow anyone to view the list of mechanics,
        but require authentication to create a new mechanic profile.
        """
        if self.request.method == 'GET':
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = MechanicProfile.objects.select_related('user').prefetch_related('specializations')
        
        # Filter parameters
        province = self.request.query_params.get('province')
        district = self.request.query_params.get('district')
        is_mobile = self.request.query_params.get('is_mobile')
        is_available = self.request.query_params.get('is_available')
        specialization = self.request.query_params.get('specialization')
        
        if province:
            queryset = queryset.filter(province__icontains=province)
        if district:
            queryset = queryset.filter(district__icontains=district)
        if is_mobile is not None:
            queryset = queryset.filter(is_mobile=is_mobile.lower() == 'true')
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        if specialization:
            queryset = queryset.filter(specializations__name__icontains=specialization)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        # Only allow mechanics to create their profile
        if self.request.user.role != 'MECHANIC':
            raise PermissionDenied("Only mechanics can create mechanic profiles")
        
        # Check if user already has a mechanic profile
        if hasattr(self.request.user, 'mechanic_profile'):
            raise ValidationError("User already has a mechanic profile")
        
        serializer.save(user=self.request.user)


class MechanicProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a mechanic profile"""
    queryset = MechanicProfile.objects.select_related('user').prefetch_related('specializations')
    serializer_class = MechanicProfileSerializer
    
    def get_permissions(self):
        """
        Allow anyone to view a mechanic profile,
        but require authentication and ownership for updates/deletes.
        """
        if self.request.method == 'GET':
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_object(self):
        obj = super().get_object()
        
        # Only the mechanic themselves can update/delete their profile
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.user != self.request.user:
                raise PermissionDenied("You can only modify your own profile")
        
        return obj


class MechanicServiceListCreateView(generics.ListCreateAPIView):
    """List mechanic services or create a new service"""
    serializer_class = MechanicServiceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'service_type']
    ordering_fields = ['base_price', 'created_at']
    ordering = ['base_price']
    
    def get_permissions(self):
        """
        Allow anyone to view mechanic services,
        but require authentication to create new services.
        """
        if self.request.method == 'GET':
            permission_classes = []
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = MechanicService.objects.select_related('mechanic__user').prefetch_related('compatible_vehicles')
        
        # Filter by mechanic
        mechanic_id = self.request.query_params.get('mechanic')
        if mechanic_id:
            queryset = queryset.filter(mechanic_id=mechanic_id)
        
        # Filter by service type
        service_type = self.request.query_params.get('service_type')
        if service_type:
            queryset = queryset.filter(service_type=service_type)
        
        # Filter by vehicle compatibility
        vehicle_category = self.request.query_params.get('vehicle_category')
        if vehicle_category:
            queryset = queryset.filter(compatible_vehicles__id=vehicle_category)
        
        # Only show active services for non-owners
        if not self.request.query_params.get('include_inactive'):
            queryset = queryset.filter(is_active=True)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        # Get or create mechanic profile for the user
        try:
            mechanic_profile = self.request.user.mechanic_profile
        except MechanicProfile.DoesNotExist:
            raise ValidationError("You must have a mechanic profile to create services")
        
        serializer.save(mechanic=mechanic_profile)


class MechanicServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a mechanic service"""
    queryset = MechanicService.objects.select_related('mechanic__user').prefetch_related('compatible_vehicles')
    serializer_class = MechanicServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        obj = super().get_object()
        
        # Only the service owner can update/delete
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            if obj.mechanic.user != self.request.user:
                raise PermissionDenied("You can only modify your own services")
        
        return obj


class MechanicHireRequestListCreateView(generics.ListCreateAPIView):
    """List hire requests or create a new one"""
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'preferred_date', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MechanicHireRequestCreateSerializer
        return MechanicHireRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = MechanicHireRequest.objects.select_related(
            'customer', 'mechanic__user', 'service'
        )
        
        # Filter based on user role
        if user.role == 'MECHANIC':
            # Mechanics see requests for their services
            queryset = queryset.filter(mechanic__user=user)
        else:
            # Customers see their own requests
            queryset = queryset.filter(customer=user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def perform_create(self, serializer):
        # Ensure customer is not trying to hire themselves
        mechanic = serializer.validated_data['mechanic']
        if mechanic.user == self.request.user:
            raise ValidationError("You cannot hire yourself")
        
        serializer.save(customer=self.request.user)


class MechanicHireRequestDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a hire request"""
    queryset = MechanicHireRequest.objects.select_related(
        'customer', 'mechanic__user', 'service'
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
            allowed_fields = ['customer_notes', 'status']
            if serializer.validated_data.get('status') not in [None, 'CANCELLED']:
                if obj.status != 'PENDING':
                    raise ValidationError("You can only cancel pending requests")
        elif user == obj.mechanic.user:
            # Mechanics can update most fields
            allowed_fields = [
                'status', 'mechanic_notes', 'scheduled_date', 'scheduled_time',
                'estimated_cost', 'final_cost', 'work_completed', 'parts_used'
            ]
            
            # Handle status transitions
            new_status = serializer.validated_data.get('status')
            if new_status == 'COMPLETED' and obj.status != 'IN_PROGRESS':
                raise ValidationError("Can only complete jobs that are in progress")
            elif new_status == 'COMPLETED':
                serializer.validated_data['completed_at'] = timezone.now()
        else:
            raise PermissionDenied("Access denied")
        
        # Filter out fields not allowed for this user
        validated_data = {k: v for k, v in serializer.validated_data.items() 
                         if k in allowed_fields}
        
        serializer.save(**validated_data)


class MechanicAvailabilityListCreateView(generics.ListCreateAPIView):
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
            raise ValidationError("You must have a mechanic profile to set availability")
        
        serializer.save(mechanic=mechanic_profile)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rate_mechanic(request, hire_request_id):
    """Rate a mechanic after job completion"""
    hire_request = get_object_or_404(MechanicHireRequest, id=hire_request_id)
    
    # Only the customer can rate the mechanic
    if request.user != hire_request.customer:
        raise PermissionDenied("Only the customer can rate the mechanic")
    
    # Job must be completed
    if hire_request.status != 'COMPLETED':
        raise ValidationError("You can only rate completed jobs")
    
    # Check if already rated
    if Rating.objects.filter(
        rater=request.user,
        rated_hire_request=hire_request
    ).exists():
        raise ValidationError("You have already rated this job")
    
    rating_value = request.data.get('rating')
    if not rating_value or not (1 <= int(rating_value) <= 5):
        raise ValidationError("Rating must be between 1 and 5")
    
    # Create the rating
    rating = Rating.objects.create(
        rater=request.user,
        rating_type='MECHANIC_SERVICE',
        rating=int(rating_value),
        rated_hire_request=hire_request,
        rated_mechanic=hire_request.mechanic
    )
    
    # Update mechanic's average rating
    mechanic = hire_request.mechanic
    all_ratings = Rating.objects.filter(rated_mechanic=mechanic)
    mechanic.service_rating = all_ratings.aggregate(Avg('rating'))['rating__avg'] or 0
    mechanic.total_service_ratings = all_ratings.count()
    mechanic.save(update_fields=['service_rating', 'total_service_ratings'])
    
    return Response({
        'message': 'Rating submitted successfully',
        'rating': RatingSerializer(rating).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def review_mechanic(request, hire_request_id):
    """Review a mechanic after job completion"""
    hire_request = get_object_or_404(MechanicHireRequest, id=hire_request_id)
    
    # Only the customer can review the mechanic
    if request.user != hire_request.customer:
        raise PermissionDenied("Only the customer can review the mechanic")
    
    # Job must be completed
    if hire_request.status != 'COMPLETED':
        raise ValidationError("You can only review completed jobs")
    
    # Check if already reviewed
    if Review.objects.filter(
        reviewer=request.user,
        reviewed_hire_request=hire_request
    ).exists():
        raise ValidationError("You have already reviewed this job")
    
    title = request.data.get('title')
    content = request.data.get('content')
    
    if not title or not content:
        raise ValidationError("Title and content are required")
    
    # Get associated rating if it exists
    rating = Rating.objects.filter(
        rater=request.user,
        rated_hire_request=hire_request
    ).first()
    
    # Create the review
    review = Review.objects.create(
        reviewer=request.user,
        review_type='MECHANIC_SERVICE',
        title=title,
        content=content,
        reviewed_hire_request=hire_request,
        reviewed_mechanic=hire_request.mechanic,
        rating=rating
    )
    
    return Response({
        'message': 'Review submitted successfully',
        'review': ReviewSerializer(review).data
    }, status=status.HTTP_201_CREATED)


# !3D Car Models views

class CarModel3DListView(generics.ListAPIView):
    """List all active 3D car models"""
    queryset = CarModel3D.objects.filter(is_active=True)
    serializer_class = CarModel3DSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'description']
    ordering_fields = ['name', 'brand', 'created_at']
    ordering = ['brand', 'name']


class CarModel3DDetailView(generics.RetrieveAPIView):
    """Get details of a specific 3D car model"""
    queryset = CarModel3D.objects.filter(is_active=True)
    serializer_class = CarModel3DSerializer
    permission_classes = [AllowAny]