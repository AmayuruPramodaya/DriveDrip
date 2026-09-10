from .models import Order, OrderItem, _
from django.contrib import admin

# Register your models here.


class OrderItemInline(admin.TabularInline):
    """Inline admin for order items"""

    model = OrderItem
    extra = 0
    readonly_fields = ("total_price",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin configuration for Order model"""

    list_display = ("order_number", "buyer", "status", "total_amount", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("order_number", "buyer__username")
    readonly_fields = ("order_number", "created_at", "updated_at")
    inlines = [OrderItemInline]

    fieldsets = (
        (
            _("Order Information"),
            {"fields": ("order_number", "buyer", "status", "total_amount")},
        ),
        (_("Delivery Information"), {"fields": ("delivery_address", "delivery_phone")}),
        (_("Metadata"), {"fields": ("created_at", "updated_at")}),
    )
