from django.utils.translation import gettext_lazy as _

from django.db.models import (
    PositiveIntegerField,
    DateTimeField,
    BooleanField,
    ForeignKey,
    ImageField,
    JSONField,
    CharField,
    TextField,
    FileField,
    DecimalField,
    CASCADE,
    Index,
    Model,
)


# Create your models here.
class VehicleCategory(Model):
    "Categories for vehicles (e.g., Car, Motorcycle, Truck)"

    name = CharField(_("category name"), max_length=100, unique=True)
    description = TextField(_("description"), blank=True)

    class Meta:
        verbose_name = _("vehicle category")
        verbose_name_plural = _("vehicle categories")
        indexes = [Index(fields=["name"], name="unique_vehicle_category")]

    def __str__(self):
        return self.name


class VehicleBrand(Model):
    "Vehicle brands (e.g., Toyota, Honda, BMW)"

    name = CharField(_("brand name"), max_length=100, unique=True)
    category = ForeignKey(VehicleCategory, on_delete=CASCADE, related_name="brands")

    class Meta:
        verbose_name = _("vehicle brand")
        verbose_name_plural = _("vehicle brands")
        indexes = [Index(fields=["name", "category"], name="unique_brand_per_category")]

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class VehicleModel(Model):
    "Vehicle models"

    name = CharField(_("model name"), max_length=100)
    brand = ForeignKey(VehicleBrand, on_delete=CASCADE, related_name="models")
    year_from = PositiveIntegerField(_("year from"))
    year_to = PositiveIntegerField(_("year to"), null=True, blank=True)

    class Meta:
        verbose_name = _("vehicle model")
        verbose_name_plural = _("vehicle models")
        unique_together = ["name", "brand"]
        indexes = [Index(fields=["name", "brand"], name="unique_model_per_brand")]

    def __str__(self):
        return f"{self.brand.name} {self.name}"

class CarModel3D(Model):
    "Model for 3D car models"

    name = CharField(_("car model name"), max_length=255)
    brand = CharField(_("car brand"), max_length=100)
    description = TextField(_("description"), blank=True)

    # 3D Model files
    model_file = FileField(_("3D model file (OBJ/GLB)"), upload_to="3d_models/cars/")
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

    # Configurator Pricing and Options
    base_price = DecimalField(
        _("base price"), max_digits=12, decimal_places=2, default=0.00
    )
    alloy_wheels = JSONField(
        _("alloy wheels options"),
        default=list,
        blank=True,
        help_text="List of wheel objects with name, price, description",
    )
    spoilers = JSONField(
        _("spoiler options"),
        default=list,
        blank=True,
        help_text="List of spoiler objects with name, price, description",
    )

    # Status
    is_active = BooleanField(_("active"), default=True)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("3D Car Model")
        verbose_name_plural = _("3D Car Models")
        ordering = ["brand", "name"]
        indexes = [Index(fields=["brand", "name"], name="car_model_3d_brand_name")]

    def __str__(self):
        return f"{self.brand} {self.name}"