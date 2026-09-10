from rest_framework.serializers import ModelSerializer, CharField, SerializerMethodField
from .models import VehicleBrand, VehicleCategory, VehicleModel, CarModel3D

# app serializers


class VehicleCategorySerializer(ModelSerializer):
    "Serializer for VehicleCategory model"

    class Meta:
        model = VehicleCategory
        fields = ["id", "name", "description"]


class VehicleBrandSerializer(ModelSerializer):
    "Serializer for VehicleBrand model"

    category_name = CharField(source="category.name", read_only=True)

    class Meta:
        model = VehicleBrand
        fields = ["id", "name", "category", "category_name"]


class VehicleModelSerializer(ModelSerializer):
    "Serializer for VehicleModel model"

    brand_name = CharField(source="brand.name", read_only=True)
    category_name = CharField(source="brand.category.name", read_only=True)

    class Meta:
        model = VehicleModel
        fields = [
            "id",
            "name",
            "brand",
            "brand_name",
            "category_name",
            "year_from",
            "year_to",
        ]


class CarModel3DSerializer(ModelSerializer):
    "Serializer for 3D Car Models"

    model_file_url = SerializerMethodField()
    thumbnail_url = SerializerMethodField()

    class Meta:
        model = CarModel3D
        fields = [
            "id",
            "name",
            "brand",
            "description",
            "model_file",
            "model_file_url",
            "thumbnail",
            "thumbnail_url",
            "default_colors",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_model_file_url(self, obj):
        "Get absolute URL for model file"
        if obj.model_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.model_file.url)
            return obj.model_file.url
        return None

    def get_thumbnail_url(self, obj):
        "Get absolute URL for thumbnail"
        if obj.thumbnail:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
