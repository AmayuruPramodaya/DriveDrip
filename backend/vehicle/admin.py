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


@admin.register(CarModel3D)
class CarModel3DAdmin(admin.ModelAdmin):
    """Admin configuration for 3D Car Models"""

    list_display = ("name", "brand", "is_active", "created_at")
    list_filter = ("brand", "is_active", "created_at")
    search_fields = ("name", "brand", "description")
    ordering = ("brand", "name")

    fieldsets = (
        (_("Basic Information"), {"fields": ("name", "brand", "description")}),
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
