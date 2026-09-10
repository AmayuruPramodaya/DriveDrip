from .models import Review, Rating
from django.contrib import admin

# Register your models here.


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    """Admin configuration for Rating model"""

    list_display = ("rater", "rating_type", "rating", "get_rated_object", "created_at")
    list_filter = ("rating_type", "rating", "created_at")
    search_fields = ("rater__username",)
    readonly_fields = ("created_at",)

    def get_rated_object(self, obj):
        if obj.rated_user:
            return f"User: {obj.rated_user.username}"
        elif obj.rated_shop:
            return f"Shop: {obj.rated_shop.name}"
        elif obj.rated_spare_part:
            return f"Part: {obj.rated_spare_part.name}"
        return "None"

    get_rated_object.short_description = "Rated Object"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin configuration for Review model"""

    list_display = (
        "reviewer",
        "review_type",
        "title",
        "get_reviewed_object",
        "is_verified",
        "created_at",
    )
    list_filter = ("review_type", "is_verified", "created_at")
    search_fields = ("reviewer__username", "title", "content")
    readonly_fields = ("created_at", "updated_at")

    def get_reviewed_object(self, obj):
        if obj.reviewed_user:
            return f"User: {obj.reviewed_user.username}"
        elif obj.reviewed_shop:
            return f"Shop: {obj.reviewed_shop.name}"
        elif obj.reviewed_spare_part:
            return f"Part: {obj.reviewed_spare_part.name}"
        return "None"

    get_reviewed_object.short_description = "Reviewed Object"
