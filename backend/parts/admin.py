from .models import SparePartImage, SparePart, SparePartCategory, _, Part3dmodels
from django.contrib import admin

# Register your models here.


@admin.register(SparePartCategory)
class SparePartCategoryAdmin(admin.ModelAdmin):
    """Admin configuration for SparePartCategory model"""

    list_display = ("name", "parent")
    list_filter = ("parent",)
    search_fields = ("name",)


class SparePartImageInline(admin.TabularInline):
    """Inline admin for spare part images"""

    model = SparePartImage
    extra = 1


@admin.register(SparePart)
class SparePartAdmin(admin.ModelAdmin):
    """Admin configuration for SparePart model"""

    list_display = (
        "name",
        "seller",
        "shop",
        "category",
        "condition",
        "price",
        "quantity",
        "average_rating",
        "total_sales",
    )
    list_filter = ("category", "condition", "is_active", "created_at")
    search_fields = ("name", "part_number", "seller__username")
    readonly_fields = (
        "average_rating",
        "total_ratings",
        "total_sales",
        "created_at",
        "updated_at",
    )
    filter_horizontal = ("compatible_vehicles",)
    inlines = [SparePartImageInline]

    fieldsets = (
        (
            _("Basic Information"),
            {
                "fields": (
                    "name",
                    "description",
                    "part_number",
                    "category",
                    "main_image",
                )
            },
        ),
        (_("Seller Information"), {"fields": ("seller", "shop")}),
        (
            _("Product Details"),
            {"fields": ("condition", "price", "quantity", "compatible_vehicles")},
        ),
        (
            _("Statistics"),
            {"fields": ("average_rating", "total_ratings", "total_sales")},
        ),
        (_("Status"), {"fields": ("is_active",)}),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Part3dmodels)
class Part3DModelAdmin(admin.ModelAdmin):
    """Admin configuration for Part3DModel model"""

    list_display = ("name", "part", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name", "part__name")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Basic Information"),
            {
                "fields": (
                    "name",
                    "part",
                    "description",
                    "model_file",
                    "thumbnail",
                    "default_colors",
                )
            },
        ),
        (_("Status"), {"fields": ("is_active",)}),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )
