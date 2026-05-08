from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.db import models
from decimal import Decimal

# TODO: Declare field validators

phone_validator = RegexValidator(
    regex=r"^\d{10}$", message=_("Mobile number must be 10 digits")
)

nic_validator = RegexValidator(
    regex=r"^[0-9]{10}$", message=_("NIC must be in valid format")
)

# TODO: Create authentication backend for custom user model


class UserManager(BaseUserManager):
    "Custom user manager"

    def create_user(self, email, username, password=None, **args):
        "Create and return a user"
        if not email:
            raise ValueError(_("The email must be set"))
        if not username:
            raise ValueError(_("The username must be set"))
        if ("role" in args) and (args["role"] not in ["SELLER", "BUYER", "ADMIN", "MECHANIC"]):
            raise ValueError(_("The role must be valid"))

        email = self.normalize_email(email)
        
        # Set default values and merge with args
        defaults = {
            'email': email,
            'username': username,
            'is_active': True,
        }
        defaults.update(args)
        
        # Only set is_staff=True for admin users
        if defaults.get("role") == "ADMIN":
            defaults['is_staff'] = True
            
        user = self.model(**defaults)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, **args):
        "Create and return a superuser"
        args.update(
            {
                "is_staff": True,
                "is_active": True,
                "is_superuser": True,
                "role": "ADMIN",
            }
        )

        if not args["is_staff"]:
            raise ValueError(_("Superuser must have is_staff=True."))
        if not args["is_superuser"]:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if args["role"] != "ADMIN":
            raise ValueError(_("Superuser must have role of Admin."))

        return self.create_user(email, username, password, **args)


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        SELLER = "SELLER", _("Seller") 
        BUYER = "BUYER", _("Buyer")
        MECHANIC = "MECHANIC", _("Mechanic")

    # Core personal information
    name = models.CharField(_("name"), max_length=255)
    email = models.EmailField(_("email"), unique=True)
    username = models.CharField(max_length=150, unique=True)
    dob = models.DateField(_("birthday"), null=True, blank=True)
    nic = models.CharField(
        _("NIC"), max_length=10, unique=True, validators=[nic_validator]
    )
    mobile_no = models.CharField(
        _("mobile"), max_length=10, unique=True, validators=[phone_validator]
    )

    # Profile information
    profile_picture = models.ImageField(
        _("profile picture"), upload_to="profile_pics/", null=True, blank=True
    )
    
    # Role and status
    role = models.CharField(
        _("role"), max_length=10, choices=Role.choices, default=Role.BUYER
    )
    
    # Rating as seller/buyer
    average_rating = models.DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal('0.00')
    )
    total_ratings = models.PositiveIntegerField(_("total ratings"), default=0)
   
    # Metadata
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)

    # Remove unused fields from AbstractUser
    groups = None
    last_name = None
    first_name = None
    user_permissions = None

    # Authentication Config
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["name", "email"]

    class Meta:
        ordering = ["username"]
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.username


class Shop(models.Model):
    """Model for seller shops"""
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shops')
    name = models.CharField(_("shop name"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    
    # Location fields
    province = models.CharField(_("province"), max_length=100, blank=True)
    district = models.CharField(_("district"), max_length=100, blank=True) 
    address = models.TextField(_("address"))
    
    phone = models.CharField(_("phone"), max_length=15)
    email = models.EmailField(_("email"), blank=True)
    
    # Shop verification
    is_verified = models.BooleanField(_("verified"), default=False)
    
    # Business details
    business_license = models.CharField(_("business license"), max_length=100, blank=True)
    tax_id = models.CharField(_("tax ID"), max_length=50, blank=True)
    
    # Shop image
    logo = models.ImageField(_("shop logo"), upload_to="shop_logos/", null=True, blank=True)
    
    # Ratings
    average_rating = models.DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal('0.00')
    )
    total_ratings = models.PositiveIntegerField(_("total ratings"), default=0)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("shop")
        verbose_name_plural = _("shops")
        # Allow multiple shops per seller but ensure unique shop names per seller
        unique_together = ['seller', 'name']
        
    def __str__(self):
        return f"{self.name} (by {self.seller.username})"


class VehicleCategory(models.Model):
    """Categories for vehicles (e.g., Car, Motorcycle, Truck)"""
    name = models.CharField(_("category name"), max_length=100, unique=True)
    description = models.TextField(_("description"), blank=True)
    
    class Meta:
        verbose_name = _("vehicle category")
        verbose_name_plural = _("vehicle categories")
        
    def __str__(self):
        return self.name


class VehicleBrand(models.Model):
    """Vehicle brands (e.g., Toyota, Honda, BMW)"""
    name = models.CharField(_("brand name"), max_length=100, unique=True)
    category = models.ForeignKey(VehicleCategory, on_delete=models.CASCADE, related_name='brands')
    
    class Meta:
        verbose_name = _("vehicle brand")
        verbose_name_plural = _("vehicle brands")
        
    def __str__(self):
        return f"{self.name} ({self.category.name})"


class VehicleModel(models.Model):
    """Vehicle models"""
    name = models.CharField(_("model name"), max_length=100)
    brand = models.ForeignKey(VehicleBrand, on_delete=models.CASCADE, related_name='models')
    year_from = models.PositiveIntegerField(_("year from"))
    year_to = models.PositiveIntegerField(_("year to"), null=True, blank=True)
    
    class Meta:
        verbose_name = _("vehicle model")
        verbose_name_plural = _("vehicle models")
        unique_together = ['name', 'brand']
        
    def __str__(self):
        return f"{self.brand.name} {self.name}"


class SparePartCategory(models.Model):
    """Categories for spare parts (e.g., Engine Parts, Brake System, Electrical)"""
    name = models.CharField(_("category name"), max_length=100, unique=True)
    description = models.TextField(_("description"), blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    
    class Meta:
        verbose_name = _("spare part category")
        verbose_name_plural = _("spare part categories")
        
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class SparePart(models.Model):
    """Model for spare parts"""
    class Condition(models.TextChoices):
        NEW = "NEW", _("New")
        USED = "USED", _("Used")
        REFURBISHED = "REFURBISHED", _("Refurbished")
    
    # Basic information
    name = models.CharField(_("part name"), max_length=255)
    description = models.TextField(_("description"))
    part_number = models.CharField(_("part number"), max_length=100, blank=True)
    category = models.ForeignKey(SparePartCategory, on_delete=models.CASCADE, related_name='parts')
    
    # Seller information
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='spare_parts')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, null=True, blank=True, related_name='parts')
    
    # Location fields (for non-shop sellers or overriding shop location)
    province = models.CharField(_("province"), max_length=100, blank=True)
    district = models.CharField(_("district"), max_length=100, blank=True)
    location_address = models.TextField(_("location address"), blank=True)
    
    # Vehicle compatibility
    compatible_vehicles = models.ManyToManyField(VehicleModel, related_name='compatible_parts')
    
    # Product details
    condition = models.CharField(_("condition"), max_length=15, choices=Condition.choices, default=Condition.NEW)
    price = models.DecimalField(_("price"), max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(_("quantity"), default=1)
    
    # Images
    main_image = models.ImageField(_("main image"), upload_to="spare_parts/", null=True, blank=True)
    
    # Ratings and reviews
    average_rating = models.DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal('0.00')
    )
    total_ratings = models.PositiveIntegerField(_("total ratings"), default=0)
    total_sales = models.PositiveIntegerField(_("total sales"), default=0)
    
    # Status
    is_active = models.BooleanField(_("active"), default=True)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    @property
    def effective_province(self):
        """Get the effective province (part location or shop location)"""
        return self.province or (self.shop.province if self.shop else '')
    
    @property 
    def effective_district(self):
        """Get the effective district (part location or shop location)"""
        return self.district or (self.shop.district if self.shop else '')
    
    @property
    def effective_location_address(self):
        """Get the effective location address"""
        return self.location_address or (self.shop.address if self.shop else '')
    
    class Meta:
        verbose_name = _("spare part")
        verbose_name_plural = _("spare parts")
        ordering = ['-created_at']
        
    def __str__(self):
        return self.name


class SparePartImage(models.Model):
    """Additional images for spare parts"""
    spare_part = models.ForeignKey(SparePart, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_("image"), upload_to="spare_parts/")
    caption = models.CharField(_("caption"), max_length=255, blank=True)
    
    class Meta:
        verbose_name = _("spare part image")
        verbose_name_plural = _("spare part images")


class Rating(models.Model):
    """Model for ratings"""
    class RatingType(models.TextChoices):
        USER = "USER", _("User Rating")
        SHOP = "SHOP", _("Shop Rating")
        SPARE_PART = "SPARE_PART", _("Spare Part Rating")
        MECHANIC = "MECHANIC", _("Mechanic Rating")
        MECHANIC_SERVICE = "MECHANIC_SERVICE", _("Mechanic Service Rating")
    
    # Rating details
    rater = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_ratings')
    rating_type = models.CharField(_("rating type"), max_length=20, choices=RatingType.choices)
    rating = models.PositiveIntegerField(
        _("rating"), 
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    
    # Rating targets (only one should be filled)
    rated_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='received_ratings')
    rated_shop = models.ForeignKey(Shop, on_delete=models.CASCADE, null=True, blank=True, related_name='ratings')
    rated_spare_part = models.ForeignKey(SparePart, on_delete=models.CASCADE, null=True, blank=True, related_name='ratings')
    rated_mechanic = models.ForeignKey('MechanicProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='ratings')
    rated_hire_request = models.ForeignKey('MechanicHireRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='ratings')
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    
    class Meta:
        verbose_name = _("rating")
        verbose_name_plural = _("ratings")
        # Ensure one user can rate each target only once
        unique_together = [
            ['rater', 'rated_user'],
            ['rater', 'rated_shop'],
            ['rater', 'rated_spare_part'],
            ['rater', 'rated_mechanic'],
            ['rater', 'rated_hire_request']
        ]
        
    def __str__(self):
        if self.rated_user:
            return f"{self.rater.username} rated {self.rated_user.username}: {self.rating}/5"
        elif self.rated_shop:
            return f"{self.rater.username} rated {self.rated_shop.name}: {self.rating}/5"
        elif self.rated_spare_part:
            return f"{self.rater.username} rated {self.rated_spare_part.name}: {self.rating}/5"
        elif self.rated_mechanic:
            return f"{self.rater.username} rated mechanic {self.rated_mechanic.user.username}: {self.rating}/5"
        elif self.rated_hire_request:
            return f"{self.rater.username} rated job #{self.rated_hire_request.id}: {self.rating}/5"


class Review(models.Model):
    """Model for reviews"""
    class ReviewType(models.TextChoices):
        USER = "USER", _("User Review")
        SHOP = "SHOP", _("Shop Review")
        SPARE_PART = "SPARE_PART", _("Spare Part Review")
        MECHANIC = "MECHANIC", _("Mechanic Review")
        MECHANIC_SERVICE = "MECHANIC_SERVICE", _("Mechanic Service Review")
    
    # Review details
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')
    review_type = models.CharField(_("review type"), max_length=20, choices=ReviewType.choices)
    title = models.CharField(_("title"), max_length=255)
    content = models.TextField(_("review content"))
    
    # Review targets (only one should be filled)
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='received_reviews')
    reviewed_shop = models.ForeignKey(Shop, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    reviewed_spare_part = models.ForeignKey(SparePart, on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    reviewed_mechanic = models.ForeignKey('MechanicProfile', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    reviewed_hire_request = models.ForeignKey('MechanicHireRequest', on_delete=models.CASCADE, null=True, blank=True, related_name='reviews')
    
    # Associated rating (optional)
    rating = models.ForeignKey(Rating, on_delete=models.CASCADE, null=True, blank=True, related_name='review')
    
    # Status
    is_verified = models.BooleanField(_("verified"), default=False)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("review")
        verbose_name_plural = _("reviews")
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Review by {self.reviewer.username}: {self.title}"


class Order(models.Model):
    """Model for orders"""
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        CONFIRMED = "CONFIRMED", _("Confirmed")
        PROCESSING = "PROCESSING", _("Processing")
        SHIPPED = "SHIPPED", _("Shipped")
        DELIVERED = "DELIVERED", _("Delivered")
        CANCELLED = "CANCELLED", _("Cancelled")
    
    # Order details
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(_("order number"), max_length=50, unique=True)
    status = models.CharField(_("status"), max_length=15, choices=Status.choices, default=Status.PENDING)
    
    # Pricing
    total_amount = models.DecimalField(_("total amount"), max_digits=10, decimal_places=2)
    
    # Delivery information
    delivery_address = models.TextField(_("delivery address"))
    delivery_phone = models.CharField(_("delivery phone"), max_length=15)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("order")
        verbose_name_plural = _("orders")
        ordering = ['-created_at']
    
    @property
    def seller(self):
        """Get the seller from the first order item"""
        first_item = self.items.first()
        return first_item.spare_part.seller if first_item else None
    
    @property
    def seller_username(self):
        """Get seller username"""
        seller = self.seller
        return seller.username if seller else ""
    
    @property
    def seller_email(self):
        """Get seller email"""
        seller = self.seller
        return seller.email if seller else ""
    
    @property
    def buyer_username(self):
        """Get buyer username"""
        return self.buyer.username if self.buyer else ""
    
    @property
    def buyer_email(self):
        """Get buyer email"""
        return self.buyer.email if self.buyer else ""
        
    def __str__(self):
        return f"Order {self.order_number} by {self.buyer.username}"


class OrderItem(models.Model):
    """Individual items in an order"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    spare_part = models.ForeignKey(SparePart, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField(_("quantity"))
    price = models.DecimalField(_("price per item"), max_digits=10, decimal_places=2)
    
    class Meta:
        verbose_name = _("order item")
        verbose_name_plural = _("order items")
        
    def __str__(self):
        return f"{self.spare_part.name} x {self.quantity}"
    
    @property
    def total_price(self):
        return self.price * self.quantity


class ChatConversation(models.Model):
    """Model for chat conversations between any two users (buyers, sellers, mechanics)"""
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        ARCHIVED = "ARCHIVED", _("Archived")
        BLOCKED = "BLOCKED", _("Blocked")
    
    class ConversationType(models.TextChoices):
        BUYER_SELLER = "BUYER_SELLER", _("Buyer-Seller")
        CUSTOMER_MECHANIC = "CUSTOMER_MECHANIC", _("Customer-Mechanic")
        GENERAL = "GENERAL", _("General")
    
    # Participants (flexible for any user types)
    participant1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_participant1', null=True)
    participant2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_participant2', null=True)
    
    # Conversation type
    conversation_type = models.CharField(_("conversation type"), max_length=20, choices=ConversationType.choices, default=ConversationType.GENERAL)
    
    # Related objects (optional)
    related_spare_part = models.ForeignKey(SparePart, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    related_hire_request = models.ForeignKey('MechanicHireRequest', on_delete=models.SET_NULL, null=True, blank=True, related_name='conversations')
    
    # Conversation status
    status = models.CharField(_("status"), max_length=10, choices=Status.choices, default=Status.ACTIVE)
    
    # Last activity tracking
    last_message_at = models.DateTimeField(_("last message at"), null=True, blank=True)
    
    # Read status for participants
    participant1_last_read_at = models.DateTimeField(_("participant1 last read at"), null=True, blank=True)
    participant2_last_read_at = models.DateTimeField(_("participant2 last read at"), null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("chat conversation")
        verbose_name_plural = _("chat conversations")
        # Prevent duplicate conversations for same participants with same related objects
        unique_together = ['participant1', 'participant2', 'related_spare_part', 'related_hire_request']
        ordering = ['-last_message_at', '-created_at']
    
    def __str__(self):
        related_info = ""
        if self.related_spare_part:
            related_info = f" about {self.related_spare_part.name}"
        elif self.related_hire_request:
            related_info = f" about Job #{self.related_hire_request.id}"
        return f"Conversation between {self.participant1.username} and {self.participant2.username}{related_info}"
    
    def get_other_participant(self, user):
        """Get the other participant in the conversation"""
        if self.participant1 == user:
            return self.participant2
        elif self.participant2 == user:
            return self.participant1
        return None
    
    def get_unread_count_for_user(self, user):
        """Get unread message count for a specific user"""
        if user == self.participant1:
            if not self.participant1_last_read_at:
                return self.messages.count()
            return self.messages.filter(
                created_at__gt=self.participant1_last_read_at,
                sender=self.participant2
            ).count()
        elif user == self.participant2:
            if not self.participant2_last_read_at:
                return self.messages.count()
            return self.messages.filter(
                created_at__gt=self.participant2_last_read_at,
                sender=self.participant1
            ).count()
        return 0
    
    # Backward compatibility properties
    @property
    def buyer(self):
        """Get buyer if this is a buyer-seller conversation"""
        if self.conversation_type == self.ConversationType.BUYER_SELLER:
            if self.participant1.role == 'BUYER':
                return self.participant1
            elif self.participant2.role == 'BUYER':
                return self.participant2
        return None
    
    @property
    def seller(self):
        """Get seller if this is a buyer-seller conversation"""
        if self.conversation_type == self.ConversationType.BUYER_SELLER:
            if self.participant1.role == 'SELLER':
                return self.participant1
            elif self.participant2.role == 'SELLER':
                return self.participant2
        return None
    
    @property
    def customer(self):
        """Get customer if this is a customer-mechanic conversation"""
        if self.conversation_type == self.ConversationType.CUSTOMER_MECHANIC:
            if self.participant1.role in ['BUYER', 'SELLER']:
                return self.participant1
            elif self.participant2.role in ['BUYER', 'SELLER']:
                return self.participant2
        return None
    
    @property
    def mechanic(self):
        """Get mechanic if this is a customer-mechanic conversation"""
        if self.conversation_type == self.ConversationType.CUSTOMER_MECHANIC:
            if self.participant1.role == 'MECHANIC':
                return self.participant1
            elif self.participant2.role == 'MECHANIC':
                return self.participant2
        return None
    
    # Backward compatibility properties for old field names
    @property
    def buyer_last_read_at(self):
        """Backward compatibility"""
        buyer = self.buyer
        if buyer == self.participant1:
            return self.participant1_last_read_at
        elif buyer == self.participant2:
            return self.participant2_last_read_at
        return None
    
    @property
    def seller_last_read_at(self):
        """Backward compatibility"""
        seller = self.seller
        if seller == self.participant1:
            return self.participant1_last_read_at
        elif seller == self.participant2:
            return self.participant2_last_read_at
        return None
    
    @property
    def unread_count_for_buyer(self):
        """Backward compatibility"""
        buyer = self.buyer
        return self.get_unread_count_for_user(buyer) if buyer else 0
    
    @property
    def unread_count_for_seller(self):
        """Backward compatibility"""
        seller = self.seller
        return self.get_unread_count_for_user(seller) if seller else 0


class ChatMessage(models.Model):
    """Model for individual chat messages"""
    class MessageType(models.TextChoices):
        TEXT = "TEXT", _("Text Message")
        IMAGE = "IMAGE", _("Image Message")
        FILE = "FILE", _("File Message")
        SYSTEM = "SYSTEM", _("System Message")
    
    # Message details
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(_("message type"), max_length=10, choices=MessageType.choices, default=MessageType.TEXT)
    
    # Message content
    content = models.TextField(_("message content"))
    
    # File attachments (optional)
    image = models.ImageField(_("image"), upload_to="chat_images/", null=True, blank=True)
    file = models.FileField(_("file"), upload_to="chat_files/", null=True, blank=True)
    
    # Message status
    is_edited = models.BooleanField(_("edited"), default=False)
    is_deleted = models.BooleanField(_("deleted"), default=False)
    
    # Read receipts (flexible for any user types)
    read_by_participant1 = models.BooleanField(_("read by participant1"), default=False)
    read_by_participant2 = models.BooleanField(_("read by participant2"), default=False)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("chat message")
        verbose_name_plural = _("chat messages")
        ordering = ['created_at']
    
    def __str__(self):
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"Message from {self.sender.username}: {content_preview}"
    
    def is_read_by_user(self, user):
        """Check if message is read by a specific user"""
        if user == self.conversation.participant1:
            return self.read_by_participant1
        elif user == self.conversation.participant2:
            return self.read_by_participant2
        return False
    
    def mark_read_by_user(self, user):
        """Mark message as read by a specific user"""
        if user == self.conversation.participant1:
            self.read_by_participant1 = True
        elif user == self.conversation.participant2:
            self.read_by_participant2 = True
        self.save(update_fields=['read_by_participant1', 'read_by_participant2'])
    
    # Backward compatibility properties
    @property
    def read_by_buyer(self):
        """Backward compatibility"""
        buyer = self.conversation.buyer
        if buyer:
            return self.is_read_by_user(buyer)
        return False
    
    @property
    def read_by_seller(self):
        """Backward compatibility"""
        seller = self.conversation.seller
        if seller:
            return self.is_read_by_user(seller)
        return False
    
    def save(self, *args, **kwargs):
        # Update conversation's last_message_at when a new message is created
        is_new = not self.pk
        
        # Save the message first to get the created_at timestamp
        super().save(*args, **kwargs)
        
        # Update conversation's last_message_at only for new messages
        if is_new:
            from django.utils import timezone
            self.conversation.last_message_at = self.created_at
            self.conversation.save(update_fields=['last_message_at'])
    
    @property
    def is_read_by_recipient(self):
        """Check if message is read by the recipient"""
        other_participant = self.conversation.get_other_participant(self.sender)
        if other_participant:
            return self.is_read_by_user(other_participant)
        return False


class MechanicProfile(models.Model):
    """Extended profile for mechanics"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mechanic_profile', limit_choices_to={'role': 'MECHANIC'})
    
    # Professional details
    license_number = models.CharField(_("license number"), max_length=100, blank=True)
    years_of_experience = models.PositiveIntegerField(_("years of experience"), default=0)
    specializations = models.ManyToManyField(VehicleCategory, related_name='specialist_mechanics', blank=True)
    description = models.TextField(_("professional description"), blank=True)
    certifications = models.TextField(_("certifications and qualifications"), blank=True)
    
    # Location and availability
    province = models.CharField(_("province"), max_length=100, blank=True)
    district = models.CharField(_("district"), max_length=100, blank=True)
    service_area = models.TextField(_("service area description"), blank=True)
    is_mobile = models.BooleanField(_("mobile mechanic"), default=False)  # Can travel to customer location
    
    # Business details
    hourly_rate = models.DecimalField(_("hourly rate"), max_digits=8, decimal_places=2, null=True, blank=True)
    business_name = models.CharField(_("business name"), max_length=255, blank=True)
    business_address = models.TextField(_("business address"), blank=True)
    
    # Verification
    is_verified = models.BooleanField(_("verified"), default=False)
    is_available = models.BooleanField(_("available for hire"), default=True)
    
    # Ratings specific to mechanic services
    service_rating = models.DecimalField(
        _("service rating"), max_digits=3, decimal_places=2, default=Decimal('0.00')
    )
    total_service_ratings = models.PositiveIntegerField(_("total service ratings"), default=0)
    total_jobs_completed = models.PositiveIntegerField(_("total jobs completed"), default=0)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("mechanic profile")
        verbose_name_plural = _("mechanic profiles")
        
    def __str__(self):
        return f"Mechanic: {self.user.username}"


class MechanicService(models.Model):
    """Services offered by mechanics"""
    class ServiceType(models.TextChoices):
        ENGINE_REPAIR = "ENGINE_REPAIR", _("Engine Repair")
        BRAKE_SERVICE = "BRAKE_SERVICE", _("Brake Service")
        TRANSMISSION = "TRANSMISSION", _("Transmission Repair")
        ELECTRICAL = "ELECTRICAL", _("Electrical Systems")
        AC_SERVICE = "AC_SERVICE", _("AC Service")
        BODY_WORK = "BODY_WORK", _("Body Work & Painting")
        TIRE_SERVICE = "TIRE_SERVICE", _("Tire Service")
        OIL_CHANGE = "OIL_CHANGE", _("Oil Change")
        INSPECTION = "INSPECTION", _("Vehicle Inspection")
        TOWING = "TOWING", _("Towing Service")
        EMERGENCY = "EMERGENCY", _("Emergency Repair")
        OTHER = "OTHER", _("Other Service")
    
    mechanic = models.ForeignKey(MechanicProfile, on_delete=models.CASCADE, related_name='services')
    service_type = models.CharField(_("service type"), max_length=20, choices=ServiceType.choices)
    name = models.CharField(_("service name"), max_length=255)
    description = models.TextField(_("service description"))
    
    # Pricing
    base_price = models.DecimalField(_("base price"), max_digits=8, decimal_places=2)
    price_per_hour = models.DecimalField(_("price per hour"), max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Service details
    estimated_duration = models.PositiveIntegerField(_("estimated duration (minutes)"), null=True, blank=True)
    compatible_vehicles = models.ManyToManyField(VehicleCategory, related_name='available_services', blank=True)
    
    # Status
    is_active = models.BooleanField(_("active"), default=True)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("mechanic service")
        verbose_name_plural = _("mechanic services")
        
    def __str__(self):
        return f"{self.mechanic.user.username} - {self.name}"


class MechanicHireRequest(models.Model):
    """Model for hiring mechanic requests"""
    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        ACCEPTED = "ACCEPTED", _("Accepted")
        REJECTED = "REJECTED", _("Rejected")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETED = "COMPLETED", _("Completed")
        CANCELLED = "CANCELLED", _("Cancelled")
    
    class JobType(models.TextChoices):
        ON_SITE = "ON_SITE", _("On-Site (Customer Location)")
        SHOP = "SHOP", _("At Mechanic Shop")
        ROADSIDE = "ROADSIDE", _("Roadside Assistance")
    
    # Participants
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='hire_requests')
    mechanic = models.ForeignKey(MechanicProfile, on_delete=models.CASCADE, related_name='hire_requests')
    
    # Job details
    service = models.ForeignKey(MechanicService, on_delete=models.CASCADE, related_name='hire_requests', null=True, blank=True)
    job_type = models.CharField(_("job type"), max_length=15, choices=JobType.choices, default=JobType.SHOP)
    
    # Problem description
    problem_description = models.TextField(_("problem description"))
    vehicle_info = models.TextField(_("vehicle information"))  # Make, model, year, etc.
    
    # Location details
    service_location = models.TextField(_("service location"), blank=True)  # For on-site/roadside
    
    # Scheduling
    preferred_date = models.DateField(_("preferred date"), null=True, blank=True)
    preferred_time = models.TimeField(_("preferred time"), null=True, blank=True)
    scheduled_date = models.DateField(_("scheduled date"), null=True, blank=True)
    scheduled_time = models.TimeField(_("scheduled time"), null=True, blank=True)
    
    # Pricing
    estimated_cost = models.DecimalField(_("estimated cost"), max_digits=10, decimal_places=2, null=True, blank=True)
    final_cost = models.DecimalField(_("final cost"), max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Status and notes
    status = models.CharField(_("status"), max_length=15, choices=Status.choices, default=Status.PENDING)
    mechanic_notes = models.TextField(_("mechanic notes"), blank=True)
    customer_notes = models.TextField(_("customer notes"), blank=True)
    
    # Job completion
    work_completed = models.TextField(_("work completed"), blank=True)
    parts_used = models.TextField(_("parts used"), blank=True)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    completed_at = models.DateTimeField(_("completed at"), null=True, blank=True)
    
    class Meta:
        verbose_name = _("mechanic hire request")
        verbose_name_plural = _("mechanic hire requests")
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Job #{self.id} - {self.customer.username} → {self.mechanic.user.username}"


class MechanicAvailability(models.Model):
    """Model for mechanic availability schedule"""
    class DayChoices(models.TextChoices):
        MONDAY = "MONDAY", _("Monday")
        TUESDAY = "TUESDAY", _("Tuesday")
        WEDNESDAY = "WEDNESDAY", _("Wednesday")
        THURSDAY = "THURSDAY", _("Thursday")
        FRIDAY = "FRIDAY", _("Friday")
        SATURDAY = "SATURDAY", _("Saturday")
        SUNDAY = "SUNDAY", _("Sunday")
    
    mechanic = models.ForeignKey(MechanicProfile, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.CharField(_("day of week"), max_length=10, choices=DayChoices.choices)
    start_time = models.TimeField(_("start time"))
    end_time = models.TimeField(_("end time"))
    is_available = models.BooleanField(_("available"), default=True)
    
    class Meta:
        verbose_name = _("mechanic availability")
        verbose_name_plural = _("mechanic availability")
        unique_together = ['mechanic', 'day_of_week']
        
    def __str__(self):
        return f"{self.mechanic.user.username} - {self.day_of_week}: {self.start_time}-{self.end_time}"


class CarModel3D(models.Model):
    """Model for 3D car models"""
    name = models.CharField(_("car model name"), max_length=255)
    brand = models.CharField(_("car brand"), max_length=100)
    description = models.TextField(_("description"), blank=True)
    
    # 3D Model files
    model_file = models.FileField(_("3D model file (OBJ/GLB)"), upload_to="3d_models/cars/")
    thumbnail = models.ImageField(_("thumbnail image"), upload_to="3d_models/thumbnails/", null=True, blank=True)
    
    # Default colors (JSON field to store hex color codes)
    default_colors = models.JSONField(_("default colors"), default=dict, blank=True, help_text="JSON object with color names and hex codes")
    
    # Status
    is_active = models.BooleanField(_("active"), default=True)
    
    # Metadata
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    
    class Meta:
        verbose_name = _("3D Car Model")
        verbose_name_plural = _("3D Car Models")
        ordering = ['brand', 'name']
        
    def __str__(self):
        return f"{self.brand} {self.name}"



