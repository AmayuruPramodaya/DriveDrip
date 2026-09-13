from django.utils.translation import gettext_lazy as _
from vehicle.models import VehicleModel
from main.models import User
from shop.models import Shop
from decimal import Decimal

from django.db.models import (
    PositiveIntegerField,
    ManyToManyField,
    DateTimeField,
    BooleanField,
    DecimalField,
    TextChoices,
    ForeignKey,
    ImageField,
    CharField,
    TextField,
    FileField,
    JSONField,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class SparePartCategory(Model):
    "Categories for spare parts (e.g., Engine Parts, Brake System, Electrical)"

    name = CharField(_("category name"), max_length=100, unique=True)
    description = TextField(_("description"), blank=True)
    parent = ForeignKey(
        "self",
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="subcategories",
    )

    class Meta:
        verbose_name = _("spare part category")
        verbose_name_plural = _("spare part categories")
        indexes = [Index(fields=["name"], name="unique_spare_part_category")]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name


class SparePart(Model):
    "Model for spare parts"

    class Condition(TextChoices):
        NEW = "NEW", _("New")
        USED = "USED", _("Used")
        REFURBISHED = "REFURBISHED", _("Refurbished")

    # Basic information
    name = CharField(_("part name"), max_length=255)
    description = TextField(_("description"))
    part_number = CharField(_("part number"), max_length=100, blank=True)
    category = ForeignKey(SparePartCategory, on_delete=CASCADE, related_name="parts")

    # Seller information
    seller = ForeignKey(User, on_delete=CASCADE, related_name="spare_parts")
    shop = ForeignKey(
        Shop, on_delete=CASCADE, null=True, blank=True, related_name="parts"
    )

    # Location fields (for non-shop sellers or overriding shop location)
    province = CharField(_("province"), max_length=100, blank=True)
    district = CharField(_("district"), max_length=100, blank=True)
    location_address = TextField(_("location address"), blank=True)

    # Vehicle compatibility
    compatible_vehicles = ManyToManyField(VehicleModel, related_name="compatible_parts")

    # Product details
    condition = CharField(
        _("condition"), max_length=15, choices=Condition.choices, default=Condition.NEW
    )
    price = DecimalField(_("price"), max_digits=10, decimal_places=2)
    quantity = PositiveIntegerField(_("quantity"), default=1)

    # Images
    main_image = ImageField(
        _("main image"), upload_to="spare_parts/", null=True, blank=True
    )

    # Ratings and reviews
    average_rating = DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    total_ratings = PositiveIntegerField(_("total ratings"), default=0)
    total_sales = PositiveIntegerField(_("total sales"), default=0)

    # Status
    is_active = BooleanField(_("active"), default=True)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    @property
    def effective_province(self):
        "Get the effective province (part location or shop location)"
        return self.province or (self.shop.province if self.shop else "")

    @property
    def effective_district(self):
        "Get the effective district (part location or shop location)"
        return self.district or (self.shop.district if self.shop else "")

    @property
    def effective_location_address(self):
        "Get the effective location address"
        return self.location_address or (self.shop.address if self.shop else "")

    class Meta:
        verbose_name = _("spare part")
        verbose_name_plural = _("spare parts")
        ordering = ["-created_at"]
        indexes = [Index(fields=["name", "category"], name="spare_part_name_category")]

    def __str__(self):
        return self.name


class SparePartImage(Model):
    "Additional images for spare parts"

    spare_part = ForeignKey(SparePart, on_delete=CASCADE, related_name="images")
    image = ImageField(_("image"), upload_to="spare_parts/")
    caption = CharField(_("caption"), max_length=255, blank=True)

    class Meta:
        verbose_name = _("spare part image")
        verbose_name_plural = _("spare part images")
        indexes = [Index(fields=["spare_part"], name="spare_part_image_index")]

class Part3dmodels(Model):
    "3D models for spare parts"

    name = CharField(_("3D model name"), max_length=255)
    part = ForeignKey(SparePart, on_delete=CASCADE, related_name="parts_models")
    description = TextField(_("description"), blank=True)

    # 3D Model files
    model_file = FileField(_("3D model file (OBJ/GLB)"), upload_to="3d_models/parts/")
    thumbnail = ImageField(
        _("thumbnail image"), upload_to="3d_models/thumbnails/", null=True, blank=True
    )

    # Default colors (JSON field to store hex color codes)
    default_colors = JSONField(
        _("default colors"),
        default=dict,
        blank=True,
        help_text="JSON object with color names and hex codes",
    )

    # Status
    is_active = BooleanField(_("active"), default=True)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("3D Part Model")
        verbose_name_plural = _("3D Part Models")
        ordering = ["part", "name"]
        indexes = [Index(fields=["part", "name"], name="part_3d_model_part_name")]