from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from django.contrib import admin
from .models import User

# Register your models here.


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model"""

    list_display = (
        "username",
        "email",
        "name",
        "role",
        "is_active",
        "average_rating",
        "created_at",
    )
    list_filter = ("role", "is_active", "is_staff", "created_at")
    search_fields = ("username", "email", "name", "mobile_no")
    ordering = ("-created_at",)
    filter_horizontal = ()

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {"fields": ("name", "email", "dob", "nic", "mobile_no", "profile_picture")},
        ),
        (_("Role & Rating"), {"fields": ("role", "average_rating", "total_ratings")}),
        (
            _("Permissions"),
            {
                "fields": ("is_active", "is_staff", "is_superuser"),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "name",
                    "role",
                    "nic",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "average_rating", "total_ratings")
