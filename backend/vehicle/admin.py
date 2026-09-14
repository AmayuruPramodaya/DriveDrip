from .models import VehicleBrand, VehicleCategory, VehicleModel, CarModel3D, _
from django.contrib import admin

# Register your models here.


@admin.register(VehicleCategory)
class VehicleCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleCategory model"""

    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(VehicleBrand)
class VehicleBrandAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleBrand model"""

    list_display = ("name", "category")
    list_filter = ("category",)
    search_fields = ("name",)


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    """Admin configuration for VehicleModel model"""

    list_display = ("name", "brand", "year_from", "year_to")
    list_filter = ("brand__category", "brand", "year_from")
    search_fields = ("name", "brand__name")


class CarModel3DChildInline(admin.TabularInline):
    """Inline to manage child (modified-part) variants of a base 3D car model"""

    model = CarModel3D
    fk_name = "parent"
    extra = 1
    fields = ("name", "modified_part", "model_file", "thumbnail", "is_active")
    verbose_name = "Modified Variant"
    verbose_name_plural = "Modified Variants (by Part)"
    show_change_link = True


@admin.register(CarModel3D)
class CarModel3DAdmin(admin.ModelAdmin):
    """Admin configuration for 3D Car Models"""

    list_display = (
        "name",
        "brand",
        "parent",
        "modified_part",
        "is_base_model",
        "is_active",
        "created_at",
    )
    list_filter = ("brand", "is_active", "created_at")
    search_fields = ("name", "brand", "description", "modified_part__name")
    ordering = ("brand", "name")

    # Show child variants inline only for base models
    inlines = [CarModel3DChildInline]

    fieldsets = (
        (
            _("Basic Information"),
            {"fields": ("name", "brand", "description", "parent")},
        ),
        (
            _("Modified Part"),
            {
                "fields": ("modified_part",),
                "description": "Only set for child/variant models. Leave blank for base models.",
            },
        ),
        (_("3D Model Files"), {"fields": ("model_file", "thumbnail")}),
        (
            _("Color Configuration"),
            {
                "fields": ("default_colors",),
                "description": 'Add default colors as JSON: {"Red": "#FF0000", "Blue": "#0000FF", "White": "#FFFFFF"}',
            },
        ),
        (_("Status"), {"fields": ("is_active",)}),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )

    readonly_fields = ("created_at", "updated_at")

    @admin.display(boolean=True, description="Base Model?")
    def is_base_model(self, obj):
        """True if this model has no parent (i.e. it is a base model)"""
        return obj.parent is None

    def get_inline_instances(self, request, obj=None):
        """Only show child inline on existing base models, not on child models or new objects"""
        if obj is None or obj.parent is not None:
            return []
        return super().get_inline_instances(request, obj)

    def save_model(self, request, obj, form, change):
        # Ensure default_colors is a valid dict if empty
        if not obj.default_colors:
            obj.default_colors = {
                "Red": "#FF0000",
                "Blue": "#0000FF",
                "White": "#FFFFFF",
                "Black": "#000000",
                "Silver": "#C0C0C0",
            }
        super().save_model(request, obj, form, change)
