from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, Shop, VehicleCategory, VehicleBrand, VehicleModel,
    SparePartCategory, SparePart, SparePartImage, Rating, Review,
    Order, OrderItem, ChatConversation, ChatMessage, CarModel3D
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""
    list_display = ('username', 'email', 'name', 'role', 'is_active', 'average_rating', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'email', 'name', 'mobile_no')
    ordering = ('-created_at',)
    filter_horizontal = ()
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {
            'fields': ('name', 'email', 'dob', 'nic', 'mobile_no', 'profile_picture')
        }),
        (_('Role & Rating'), {
            'fields': ('role', 'average_rating', 'total_ratings')
        }),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'average_rating', 'total_ratings')


class SparePartImageInline(admin.TabularInline):
    """Inline admin for spare part images"""
    model = SparePartImage
    extra = 1


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    """Admin configuration for Shop model"""
    list_display = ('name', 'seller', 'is_verified', 'average_rating', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('name', 'seller__username', 'address')
    readonly_fields = ('average_rating', 'total_ratings', 'created_at', 'updated_at')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('seller', 'name', 'description', 'logo')
        }),
        (_('Contact Information'), {
            'fields': ('address', 'phone', 'email')
        }),
        (_('Business Details'), {
            'fields': ('business_license', 'tax_id', 'is_verified')
        }),
        (_('Ratings'), {
            'fields': ('average_rating', 'total_ratings')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(VehicleCategory)
class VehicleCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleCategory model"""
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(VehicleBrand)
class VehicleBrandAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleBrand model"""
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleModel model"""
    list_display = ('name', 'brand', 'year_from', 'year_to')
    list_filter = ('brand__category', 'brand', 'year_from')
    search_fields = ('name', 'brand__name')


@admin.register(SparePartCategory)
class SparePartCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for SparePartCategory model"""
    list_display = ('name', 'parent')
    list_filter = ('parent',)
    search_fields = ('name',)


@admin.register(SparePart)
class SparePartAdmin(admin.ModelAdmin):
    """Admin configuration for SparePart model"""
    list_display = ('name', 'seller', 'shop', 'category', 'condition', 'price', 'quantity', 'average_rating', 'total_sales')
    list_filter = ('category', 'condition', 'is_active', 'created_at')
    search_fields = ('name', 'part_number', 'seller__username')
    readonly_fields = ('average_rating', 'total_ratings', 'total_sales', 'created_at', 'updated_at')
    filter_horizontal = ('compatible_vehicles',)
    inlines = [SparePartImageInline]
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('name', 'description', 'part_number', 'category', 'main_image')
        }),
        (_('Seller Information'), {
            'fields': ('seller', 'shop')
        }),
        (_('Product Details'), {
            'fields': ('condition', 'price', 'quantity', 'compatible_vehicles')
        }),
        (_('Statistics'), {
            'fields': ('average_rating', 'total_ratings', 'total_sales')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """Admin configuration for Rating model"""
    list_display = ('rater', 'rating_type', 'rating', 'get_rated_object', 'created_at')
    list_filter = ('rating_type', 'rating', 'created_at')
    search_fields = ('rater__username',)
    readonly_fields = ('created_at',)
    
    def get_rated_object(self, obj):
        if obj.rated_user:
            return f"User: {obj.rated_user.username}"
        elif obj.rated_shop:
            return f"Shop: {obj.rated_shop.name}"
        elif obj.rated_spare_part:
            return f"Part: {obj.rated_spare_part.name}"
        return "None"
    get_rated_object.short_description = 'Rated Object'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin configuration for Review model"""
    list_display = ('reviewer', 'review_type', 'title', 'get_reviewed_object', 'is_verified', 'created_at')
    list_filter = ('review_type', 'is_verified', 'created_at')
    search_fields = ('reviewer__username', 'title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_reviewed_object(self, obj):
        if obj.reviewed_user:
            return f"User: {obj.reviewed_user.username}"
        elif obj.reviewed_shop:
            return f"Shop: {obj.reviewed_shop.name}"
        elif obj.reviewed_spare_part:
            return f"Part: {obj.reviewed_spare_part.name}"
        return "None"
    get_reviewed_object.short_description = 'Reviewed Object'


class OrderItemInline(admin.TabularInline):
    """Inline admin for order items"""
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin configuration for Order model"""
    list_display = ('order_number', 'buyer', 'status', 'total_amount', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'buyer__username')
    readonly_fields = ('order_number', 'created_at', 'updated_at')
    inlines = [OrderItemInline]
    
    fieldsets = (
        (_('Order Information'), {
            'fields': ('order_number', 'buyer', 'status', 'total_amount')
        }),
        (_('Delivery Information'), {
            'fields': ('delivery_address', 'delivery_phone')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


class ChatMessageInline(admin.TabularInline):
    """Inline admin for chat messages"""
    model = ChatMessage
    extra = 0
    readonly_fields = ('created_at', 'updated_at', 'is_read_by_recipient')
    fields = ('sender', 'message_type', 'content', 'is_edited', 'is_deleted', 'created_at')


@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    """Admin configuration for ChatConversation model"""
    list_display = ('buyer', 'seller', 'related_spare_part', 'status', 'last_message_at', 'created_at')
    list_filter = ('status', 'created_at', 'last_message_at')
    search_fields = ('buyer__username', 'seller__username', 'related_spare_part__name')
    readonly_fields = ('created_at', 'updated_at', 'last_message_at', 'unread_count_for_buyer', 'unread_count_for_seller')
    inlines = [ChatMessageInline]
    
    fieldsets = (
        (_('Participants'), {
            'fields': ('buyer', 'seller', 'related_spare_part')
        }),
        (_('Status'), {
            'fields': ('status',)
        }),
        (_('Activity Tracking'), {
            'fields': ('last_message_at', 'buyer_last_read_at', 'seller_last_read_at')
        }),
        (_('Unread Counts'), {
            'fields': ('unread_count_for_buyer', 'unread_count_for_seller')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    """Admin configuration for ChatMessage model"""
    list_display = ('conversation', 'sender', 'message_type', 'content_preview', 'is_read_by_recipient', 'created_at')
    list_filter = ('message_type', 'is_edited', 'is_deleted', 'created_at')
    search_fields = ('sender__username', 'content')
    readonly_fields = ('created_at', 'updated_at', 'is_read_by_recipient')
    
    fieldsets = (
        (_('Message Details'), {
            'fields': ('conversation', 'sender', 'message_type', 'content')
        }),
        (_('Attachments'), {
            'fields': ('image', 'file')
        }),
        (_('Status'), {
            'fields': ('is_edited', 'is_deleted', 'read_by_buyer', 'read_by_seller')
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def content_preview(self, obj):
        """Show a preview of the message content"""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = _('Content Preview')


@admin.register(CarModel3D)
class CarModel3DAdmin(admin.ModelAdmin):
    """Admin configuration for 3D Car Models"""
    list_display = ('name', 'brand', 'is_active', 'created_at')
    list_filter = ('brand', 'is_active', 'created_at')
    search_fields = ('name', 'brand', 'description')
    ordering = ('brand', 'name')
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('name', 'brand', 'description')
        }),
        (_('3D Model Files'), {
            'fields': ('model_file', 'thumbnail')
        }),
        (_('Color Configuration'), {
            'fields': ('default_colors',),
            'description': 'Add default colors as JSON: {"Red": "#FF0000", "Blue": "#0000FF", "White": "#FFFFFF"}'
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Metadata'), {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def save_model(self, request, obj, form, change):
        # Ensure default_colors is a valid dict if empty
        if not obj.default_colors:
            obj.default_colors = {
                "Red": "#FF0000",
                "Blue": "#0000FF", 
                "White": "#FFFFFF",
                "Black": "#000000",
                "Silver": "#C0C0C0"
            }
        super().save_model(request, obj, form, change)
