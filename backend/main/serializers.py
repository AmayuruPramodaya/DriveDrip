from rest_framework import serializers
from .models import (
    User, Shop, VehicleCategory, VehicleBrand, VehicleModel,
    SparePartCategory, SparePart, SparePartImage, Rating, Review,
    Order, OrderItem, ChatConversation, ChatMessage,
    MechanicProfile, MechanicService, MechanicHireRequest, MechanicAvailability,
    CarModel3D
)


class UserSerializer(serializers.ModelSerializer):

    profile_picture = serializers.ImageField(
        max_length=None,
        use_url=True,
        required=False,
        allow_null=True
    )
    
    # Mechanic-specific fields for registration (write-only)
    business_name = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    experience_years = serializers.IntegerField(required=False, write_only=True)
    license_number = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, allow_null=True, write_only=True)
    district = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    province = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    business_address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    service_area = serializers.CharField(required=False, allow_blank=True, write_only=True)
    is_mobile = serializers.BooleanField(required=False, write_only=True)
    description = serializers.CharField(required=False, allow_blank=True, write_only=True)
    certifications = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = User
        # Explicitly define the fields you want included
        fields = [
            "id",
            "name",
            "email",
            "username",
            "password",
            "dob",
            "nic",
            "mobile_no",
            "role",
            "is_staff",
            "profile_picture",
            "average_rating",
            "total_ratings",
            "created_at",
            "updated_at",
            # Mechanic-specific fields
            "business_name",
            "experience_years",
            "license_number",
            "hourly_rate",
            "district",
            "province",
            "business_address",
            "service_area",
            "is_mobile",
            "description",
            "certifications",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "email": {"required": True},
            "username": {"required": True},
            "password": {"write_only": True, "required": True},
            "profile_picture": {"required": False, "allow_null": True},
            "is_staff": {"read_only": True},
            "average_rating": {"read_only": True},
            "total_ratings": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def create(self, validated_data):
        # Extract mechanic-specific data if present
        mechanic_data = {}
        if validated_data.get('role') == 'MECHANIC':
            # Map frontend field names to model field names
            field_mapping = {
                'experience_years': 'years_of_experience',
                'business_name': 'business_name',
                'license_number': 'license_number',
                'hourly_rate': 'hourly_rate',
                'district': 'district', 
                'province': 'province',
                'business_address': 'business_address',
                'service_area': 'service_area',
                'is_mobile': 'is_mobile',
                'description': 'description',
                'certifications': 'certifications'
            }
            
            for frontend_field, model_field in field_mapping.items():
                if frontend_field in validated_data:
                    mechanic_data[model_field] = validated_data.pop(frontend_field)
        
        # !Use create_user for proper password hashing
        user = User.objects.create_user(**validated_data)
        
        # Create mechanic profile if user is a mechanic
        if user.role == 'MECHANIC' and mechanic_data:
            from .models import MechanicProfile
            MechanicProfile.objects.create(user=user, **mechanic_data)
        
        return user

    def update(self, instance, validated_data):

        profile_picture = validated_data.pop("profile_picture", None)
       
        # If a new picture is uploaded (not None) or if explicitly set to null to remove
        if profile_picture is not None: # This means a file was uploaded
            instance.profile_picture = profile_picture
        elif 'profile_picture' in self.initial_data and self.initial_data['profile_picture'] is None:
            # If frontend explicitly sends null for profile_picture to clear it
            instance.profile_picture = None

        # !Secure password update
        password = validated_data.pop("password", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class ShopSerializer(serializers.ModelSerializer):
    """Serializer for Shop model"""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = Shop
        fields = [
            'id', 'seller', 'seller_username', 'name', 'description', 
            'province', 'district', 'address',
            'phone', 'email', 'is_verified', 'business_license', 'tax_id',
            'logo', 'average_rating', 'total_ratings', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'seller': {'read_only': True},  # Make seller read-only since it's set by the view
            'average_rating': {'read_only': True},
            'total_ratings': {'read_only': True},
            'is_verified': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }


class VehicleCategorySerializer(serializers.ModelSerializer):
    """Serializer for VehicleCategory model"""
    
    class Meta:
        model = VehicleCategory
        fields = ['id', 'name', 'description']


class VehicleBrandSerializer(serializers.ModelSerializer):
    """Serializer for VehicleBrand model"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = VehicleBrand
        fields = ['id', 'name', 'category', 'category_name']


class VehicleModelSerializer(serializers.ModelSerializer):
    """Serializer for VehicleModel model"""
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='brand.category.name', read_only=True)
    
    class Meta:
        model = VehicleModel
        fields = ['id', 'name', 'brand', 'brand_name', 'category_name', 'year_from', 'year_to']


class SparePartCategorySerializer(serializers.ModelSerializer):
    """Serializer for SparePartCategory model"""
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    
    class Meta:
        model = SparePartCategory
        fields = ['id', 'name', 'description', 'parent', 'parent_name']


class SparePartImageSerializer(serializers.ModelSerializer):
    """Serializer for SparePartImage model"""
    
    class Meta:
        model = SparePartImage
        fields = ['id', 'image', 'caption']


class SparePartSerializer(serializers.ModelSerializer):
    """Serializer for SparePart model"""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    images = SparePartImageSerializer(many=True, read_only=True)
    compatible_vehicles_info = VehicleModelSerializer(source='compatible_vehicles', many=True, read_only=True)
    
    # Add computed location fields
    effective_province = serializers.ReadOnlyField()
    effective_district = serializers.ReadOnlyField()
    effective_location_address = serializers.ReadOnlyField()
    
    class Meta:
        model = SparePart
        fields = [
            'id', 'name', 'description', 'part_number', 'category', 'category_name',
            'seller', 'seller_username', 'shop', 'shop_name', 
            'province', 'district', 'location_address',
            'effective_province', 'effective_district', 'effective_location_address',
            'compatible_vehicles', 'compatible_vehicles_info', 'condition', 'price', 
            'quantity', 'main_image', 'images', 'average_rating', 'total_ratings', 
            'total_sales', 'is_active', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'seller': {'read_only': True},
            'shop': {'read_only': True},
            'average_rating': {'read_only': True},
            'total_ratings': {'read_only': True},
            'total_sales': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }


class RatingSerializer(serializers.ModelSerializer):
    """Serializer for Rating model"""
    rater_username = serializers.CharField(source='rater.username', read_only=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'rater', 'rater_username', 'rating_type', 'rating',
            'rated_user', 'rated_shop', 'rated_spare_part', 'created_at'
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
            'rater': {'read_only': True},  # rater is set in the view
            'rated_user': {'required': False, 'allow_null': True},
            'rated_shop': {'required': False, 'allow_null': True},
            'rated_spare_part': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        """Ensure only one target is set"""
        targets = [data.get('rated_user'), data.get('rated_shop'), data.get('rated_spare_part')]
        filled_targets = [target for target in targets if target is not None]
        
        if len(filled_targets) != 1:
            raise serializers.ValidationError("Exactly one rating target must be specified.")
        
        return data


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model"""
    reviewer_username = serializers.CharField(source='reviewer.username', read_only=True)
    rating_value = serializers.IntegerField(source='rating.rating', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'reviewer', 'reviewer_username', 'review_type', 'title', 'content',
            'reviewed_user', 'reviewed_shop', 'reviewed_spare_part', 'rating',
            'rating_value', 'is_verified', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'is_verified': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
            'reviewer': {'read_only': True},  # reviewer is set in the view
            'reviewed_user': {'required': False, 'allow_null': True},
            'reviewed_shop': {'required': False, 'allow_null': True},
            'reviewed_spare_part': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        """Ensure only one target is set"""
        targets = [data.get('reviewed_user'), data.get('reviewed_shop'), data.get('reviewed_spare_part')]
        filled_targets = [target for target in targets if target is not None]
        
        if len(filled_targets) != 1:
            raise serializers.ValidationError("Exactly one review target must be specified.")
        
        return data


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model"""
    spare_part_name = serializers.CharField(source='spare_part.name', read_only=True)
    spare_part_image = serializers.ImageField(source='spare_part.main_image', read_only=True)
    spare_part_part_number = serializers.CharField(source='spare_part.part_number', read_only=True)
    spare_part_seller_id = serializers.IntegerField(source='spare_part.seller.id', read_only=True)
    spare_part_seller_username = serializers.CharField(source='spare_part.seller.username', read_only=True)
    total_price = serializers.SerializerMethodField()
    
    def get_total_price(self, obj):
        return obj.quantity * obj.price
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'spare_part', 'spare_part_name', 'spare_part_image', 'spare_part_part_number',
            'spare_part_seller_id', 'spare_part_seller_username', 'quantity', 'price', 'total_price'
        ]


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    buyer_email = serializers.CharField(source='buyer.email', read_only=True)
    seller_username = serializers.SerializerMethodField()
    seller_email = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = serializers.ListField(write_only=True, required=False)
    
    def get_seller_username(self, obj):
        """Get seller username from first order item"""
        first_item = obj.items.first()
        return first_item.spare_part.seller.username if first_item else None
    
    def get_seller_email(self, obj):
        """Get seller email from first order item"""
        first_item = obj.items.first()
        return first_item.spare_part.seller.email if first_item else None
    
    class Meta:
        model = Order
        fields = [
            'id', 'buyer', 'buyer_username', 'buyer_email',
            'seller_username', 'seller_email', 'order_number', 'status',
            'total_amount', 'delivery_address', 'delivery_phone',
            'items', 'order_items', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'buyer': {'read_only': True},
            'order_number': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items', [])
        order = Order.objects.create(**validated_data)
        
        # Create order items
        for item_data in order_items_data:
            OrderItem.objects.create(
                order=order,
                spare_part_id=item_data['spare_part'],
                quantity=item_data['quantity'],
                price=item_data['price']
            )
        
        return order


# Serializers for listing popular/top selling items
class PopularSparePartSerializer(serializers.ModelSerializer):
    """Serializer for popular spare parts (most selling items)"""
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = SparePart
        fields = [
            'id', 'name', 'category_name', 'seller_username', 'shop_name',
            'price', 'main_image', 'average_rating', 'total_ratings',
            'total_sales', 'created_at'
        ]


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    is_mine = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'conversation', 'sender', 'sender_username', 'sender_name',
            'message_type', 'content', 'image', 'file', 'is_edited', 'is_deleted',
            'read_by_buyer', 'read_by_seller', 'is_read_by_recipient', 'is_mine',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'sender': {'read_only': True},
            'conversation': {'read_only': True},
            'is_edited': {'read_only': True},
            'read_by_buyer': {'read_only': True},
            'read_by_seller': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def get_is_mine(self, obj):
        """Check if the message belongs to the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False


class ChatConversationSerializer(serializers.ModelSerializer):
    """Serializer for chat conversations"""
    participant1_details = serializers.SerializerMethodField()
    participant2_details = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    related_spare_part_name = serializers.CharField(source='related_spare_part.name', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'participant1_details', 'participant2_details', 'other_participant',
            'conversation_type', 'related_spare_part', 'related_spare_part_name',
            'related_hire_request', 'status', 'last_message_at', 'last_message', 
            'unread_count', 'participant1_last_read_at', 'participant2_last_read_at',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'last_message_at': {'read_only': True},
            'participant1_last_read_at': {'read_only': True},
            'participant2_last_read_at': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def get_participant1_details(self, obj):
        """Get participant1 details"""
        if obj.participant1:
            return {
                'id': obj.participant1.id,
                'username': obj.participant1.username,
                'name': obj.participant1.name,
                'role': obj.participant1.role
            }
        return None
    
    def get_participant2_details(self, obj):
        """Get participant2 details"""
        if obj.participant2:
            return {
                'id': obj.participant2.id,
                'username': obj.participant2.username,
                'name': obj.participant2.name,
                'role': obj.participant2.role
            }
        return None
    
    def get_other_participant(self, obj):
        """Get the other participant for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'username': other_user.username,
                    'name': other_user.name,
                    'role': other_user.role
                }
        return None
    
    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_message = obj.messages.filter(is_deleted=False).last()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content,
                'sender_username': last_message.sender.username,
                'message_type': last_message.message_type,
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count_for_user(request.user)
        return 0


class ChatConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new chat conversations"""
    
    seller = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ChatConversation
        fields = ['seller', 'related_spare_part', 'related_hire_request']
    
    def create(self, validated_data):
        # Get seller from validated data
        seller_id = validated_data.pop('seller')
        seller = User.objects.get(id=seller_id)
        
        # Set participants
        current_user = self.context['request'].user
        
        # Determine conversation type based on participants
        if current_user.role == 'BUYER' and seller.role == 'SELLER':
            conversation_type = ChatConversation.ConversationType.BUYER_SELLER
        elif current_user.role in ['BUYER', 'SELLER'] and seller.role == 'MECHANIC':
            conversation_type = ChatConversation.ConversationType.CUSTOMER_MECHANIC
        else:
            conversation_type = ChatConversation.ConversationType.GENERAL
        
        # Create conversation with participants
        conversation = ChatConversation.objects.create(
            participant1=current_user,
            participant2=seller,
            conversation_type=conversation_type,
            **validated_data
        )
        
        return conversation


# Mechanic-related Serializers

class VehicleCategorySerializer(serializers.ModelSerializer):
    """Serializer for vehicle categories (for mechanic specializations)"""
    class Meta:
        model = VehicleCategory
        fields = ['id', 'name', 'description']


class MechanicProfileSerializer(serializers.ModelSerializer):
    """Serializer for mechanic profiles"""
    user = UserSerializer(read_only=True)
    specializations = VehicleCategorySerializer(many=True, read_only=True)
    specialization_ids = serializers.PrimaryKeyRelatedField(
        queryset=VehicleCategory.objects.all(),
        many=True,
        write_only=True,
        source='specializations'
    )
    
    class Meta:
        model = MechanicProfile
        fields = [
            'id', 'user', 'license_number', 'years_of_experience',
            'specializations', 'specialization_ids', 'province', 'district',
            'service_area', 'is_mobile', 'hourly_rate', 'business_name',
            'business_address', 'is_verified', 'is_available',
            'service_rating', 'total_service_ratings', 'total_jobs_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'user', 'is_verified', 'service_rating', 'total_service_ratings',
            'total_jobs_completed', 'created_at', 'updated_at'
        ]


class MechanicServiceSerializer(serializers.ModelSerializer):
    """Serializer for mechanic services"""
    mechanic = MechanicProfileSerializer(read_only=True)
    compatible_vehicles = VehicleCategorySerializer(many=True, read_only=True)
    compatible_vehicle_ids = serializers.PrimaryKeyRelatedField(
        queryset=VehicleCategory.objects.all(),
        many=True,
        write_only=True,
        source='compatible_vehicles'
    )
    
    class Meta:
        model = MechanicService
        fields = [
            'id', 'mechanic', 'service_type', 'name', 'description',
            'base_price', 'price_per_hour', 'estimated_duration',
            'compatible_vehicles', 'compatible_vehicle_ids', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['mechanic', 'created_at', 'updated_at']


class MechanicHireRequestSerializer(serializers.ModelSerializer):
    """Serializer for mechanic hire requests"""
    customer = UserSerializer(read_only=True)
    mechanic = MechanicProfileSerializer(read_only=True)
    service = MechanicServiceSerializer(read_only=True)
    
    class Meta:
        model = MechanicHireRequest
        fields = [
            'id', 'customer', 'mechanic', 'service', 'job_type',
            'problem_description', 'vehicle_info', 'service_location',
            'preferred_date', 'preferred_time', 'scheduled_date', 'scheduled_time',
            'estimated_cost', 'final_cost', 'status', 'mechanic_notes',
            'customer_notes', 'work_completed', 'parts_used',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'customer', 'mechanic_notes', 'scheduled_date', 'scheduled_time',
            'estimated_cost', 'final_cost', 'status', 'work_completed',
            'parts_used', 'created_at', 'updated_at', 'completed_at'
        ]


class MechanicHireRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating mechanic hire requests"""
    
    class Meta:
        model = MechanicHireRequest
        fields = [
            'mechanic', 'service', 'job_type', 'problem_description',
            'vehicle_info', 'service_location', 'preferred_date',
            'preferred_time', 'customer_notes'
        ]
    
    def create(self, validated_data):
        validated_data['customer'] = self.context['request'].user
        return super().create(validated_data)


class MechanicAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for mechanic availability"""
    
    class Meta:
        model = MechanicAvailability
        fields = [
            'id', 'mechanic', 'day_of_week', 'start_time',
            'end_time', 'is_available'
        ]
        read_only_fields = ['mechanic']


# Updated Chat Serializers for Mechanic Support

class UniversalChatConversationSerializer(serializers.ModelSerializer):
    """Universal chat conversation serializer supporting all user types"""
    participant1 = UserSerializer(read_only=True)
    participant2 = UserSerializer(read_only=True)
    related_spare_part = SparePartSerializer(read_only=True)
    related_hire_request = MechanicHireRequestSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = [
            'id', 'participant1', 'participant2', 'conversation_type',
            'related_spare_part', 'related_hire_request', 'status',
            'last_message_at', 'last_message', 'unread_count',
            'other_participant', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'participant1', 'participant2', 'last_message_at',
            'created_at', 'updated_at'
        ]
    
    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_message = obj.messages.first()  # ordered by -created_at
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content,
                'sender': last_message.sender.username,
                'created_at': last_message.created_at,
                'message_type': last_message.message_type
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count_for_user(request.user)
        return 0
    
    def get_other_participant(self, obj):
        """Get the other participant for the current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return UserSerializer(other_user).data
        return None


class UniversalChatConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating universal chat conversations"""
    
    class Meta:
        model = ChatConversation
        fields = [
            'participant2', 'conversation_type', 'related_spare_part',
            'related_hire_request'
        ]
    
    def create(self, validated_data):
        validated_data['participant1'] = self.context['request'].user
        return super().create(validated_data)


class CarModel3DSerializer(serializers.ModelSerializer):
    """Serializer for 3D Car Models"""
    model_file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CarModel3D
        fields = [
            'id', 'name', 'brand', 'description', 'model_file', 'model_file_url',
            'thumbnail', 'thumbnail_url', 'default_colors', 'is_active',
            'created_at', 'updated_at'
        ]
        
    def get_model_file_url(self, obj):
        """Get absolute URL for model file"""
        if obj.model_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.model_file.url)
            return obj.model_file.url
        return None
        
    def get_thumbnail_url(self, obj):
        """Get absolute URL for thumbnail"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
