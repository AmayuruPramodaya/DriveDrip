from django.contrib import admin
from .models import Shop, _

# Register your models here.


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    """Admin configuration for Shop model"""

    list_display = ("name", "seller", "is_verified", "average_rating", "created_at")
    list_filter = ("is_verified", "created_at")
    search_fields = ("name", "seller__username", "address")
    readonly_fields = ("average_rating", "total_ratings", "created_at", "updated_at")

    fieldsets = (
        (_("Basic Information"), {"fields": ("seller", "name", "description", "logo")}),
        (_("Contact Information"), {"fields": ("address", "phone", "email")}),
        (
            _("Business Details"),
            {"fields": ("business_license", "tax_id", "is_verified")},
        ),
        (_("Ratings"), {"fields": ("average_rating", "total_ratings")}),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )
