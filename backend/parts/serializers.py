from rest_framework.serializers import ModelSerializer, CharField, ReadOnlyField
from .models import SparePart, SparePartCategory, SparePartImage
from vehicle.serializers import VehicleModelSerializer

# app serializers


class SparePartCategorySerializer(ModelSerializer):
    "Serializer for SparePartCategory model"

    parent_name = CharField(source="parent.name", read_only=True)

    class Meta:
        model = SparePartCategory
        fields = ["id", "name", "description", "parent", "parent_name"]


class SparePartImageSerializer(ModelSerializer):
    "Serializer for SparePartImage model"

    class Meta:
        model = SparePartImage
        fields = ["id", "image", "caption"]


class SparePartSerializer(ModelSerializer):
    "Serializer for SparePart model"

    seller_username = CharField(source="seller.username", read_only=True)
    shop_name = CharField(source="shop.name", read_only=True)
    category_name = CharField(source="category.name", read_only=True)
    images = SparePartImageSerializer(many=True, read_only=True)
    compatible_vehicles_info = VehicleModelSerializer(
        source="compatible_vehicles", many=True, read_only=True
    )

    # Add computed location fields
    effective_province = ReadOnlyField()
    effective_district = ReadOnlyField()
    effective_location_address = ReadOnlyField()

    class Meta:
        model = SparePart
        fields = [
            "id",
            "name",
            "description",
            "part_number",
            "category",
            "category_name",
            "seller",
            "seller_username",
            "shop",
            "shop_name",
            "province",
            "district",
            "location_address",
            "effective_province",
            "effective_district",
            "effective_location_address",
            "compatible_vehicles",
            "compatible_vehicles_info",
            "condition",
            "price",
            "quantity",
            "main_image",
            "images",
            "average_rating",
            "total_ratings",
            "total_sales",
            "is_active",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "seller": {"read_only": True},
            "shop": {"read_only": True},
            "average_rating": {"read_only": True},
            "total_ratings": {"read_only": True},
            "total_sales": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }


class PopularSparePartSerializer(ModelSerializer):
    "Serializer for popular spare parts (most selling items)"

    seller_username = CharField(source="seller.username", read_only=True)
    shop_name = CharField(source="shop.name", read_only=True)
    category_name = CharField(source="category.name", read_only=True)

    class Meta:
        model = SparePart
        fields = [
            "id",
            "name",
            "category_name",
            "seller_username",
            "shop_name",
            "price",
            "main_image",
            "average_rating",
            "total_ratings",
            "total_sales",
            "created_at",
        ]
