from rest_framework.serializers import ModelSerializer, CharField
from .models import Shop

# app serializer


class ShopSerializer(ModelSerializer):
    "Serializer for Shop model"

    seller_username = CharField(source="seller.username", read_only=True)

    class Meta:
        model = Shop
        fields = [
            "id",
            "seller",
            "seller_username",
            "name",
            "description",
            "province",
            "district",
            "address",
            "phone",
            "email",
            "is_verified",
            "business_license",
            "tax_id",
            "logo",
            "average_rating",
            "total_ratings",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "seller": {
                "read_only": True
            },  # Make seller read-only since it's set by the view
            "average_rating": {"read_only": True},
            "total_ratings": {"read_only": True},
            "is_verified": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }
