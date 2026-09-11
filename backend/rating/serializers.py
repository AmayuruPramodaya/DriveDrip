from .models import Rating, Review

from rest_framework.serializers import (
    ModelSerializer,
    ValidationError,
    IntegerField,
    CharField,
)

# app seriazers


class RatingSerializer(ModelSerializer):
    "Serializer for Rating model"

    rater_username = CharField(source="rater.username", read_only=True)

    class Meta:
        model = Rating
        fields = [
            "id",
            "rater",
            "rater_username",
            "rating_type",
            "rating",
            "rated_user",
            "rated_shop",
            "rated_spare_part",
            "created_at",
        ]
        extra_kwargs = {
            "created_at": {"read_only": True},
            "rater": {"read_only": True},  # rater is set in the view
            "rated_user": {"required": False, "allow_null": True},
            "rated_shop": {"required": False, "allow_null": True},
            "rated_spare_part": {"required": False, "allow_null": True},
        }

    def validate(self, data):
        "Ensure only one target is set"
        targets = [
            data.get("rated_user"),
            data.get("rated_shop"),
            data.get("rated_spare_part"),
        ]
        filled_targets = [target for target in targets if target is not None]

        if len(filled_targets) != 1:
            raise ValidationError("Exactly one rating target must be specified.")

        return data


class ReviewSerializer(ModelSerializer):
    "Serializer for Review model"

    reviewer_username = CharField(source="reviewer.username", read_only=True)
    rating_value = IntegerField(source="rating.rating", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "reviewer",
            "reviewer_username",
            "review_type",
            "title",
            "content",
            "reviewed_user",
            "reviewed_shop",
            "reviewed_spare_part",
            "rating",
            "rating_value",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "is_verified": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
            "reviewer": {"read_only": True},  # reviewer is set in the view
            "reviewed_user": {"required": False, "allow_null": True},
            "reviewed_shop": {"required": False, "allow_null": True},
            "reviewed_spare_part": {"required": False, "allow_null": True},
        }

    def validate(self, data):
        "Ensure only one target is set"
        targets = [
            data.get("reviewed_user"),
            data.get("reviewed_shop"),
            data.get("reviewed_spare_part"),
        ]
        filled_targets = [target for target in targets if target is not None]

        if len(filled_targets) != 1:
            raise ValidationError("Exactly one review target must be specified.")

        return data
