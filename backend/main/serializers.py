from .models import User
from rest_framework.serializers import (
    ModelSerializer,
    IntegerField,
    DecimalField,
    BooleanField,
    ImageField,
    CharField,
)

# app serializers


class UserSerializer(ModelSerializer):

    profile_picture = ImageField(
        max_length=None, use_url=True, required=False, allow_null=True
    )

    # Mechanic-specific fields for registration (write-only)
    business_name = CharField(
        max_length=255, required=False, allow_blank=True, write_only=True
    )
    experience_years = IntegerField(required=False, write_only=True)
    license_number = CharField(
        max_length=100, required=False, allow_blank=True, write_only=True
    )
    hourly_rate = DecimalField(
        max_digits=8, decimal_places=2, required=False, allow_null=True, write_only=True
    )
    district = CharField(
        max_length=100, required=False, allow_blank=True, write_only=True
    )
    province = CharField(
        max_length=100, required=False, allow_blank=True, write_only=True
    )
    business_address = CharField(required=False, allow_blank=True, write_only=True)
    service_area = CharField(required=False, allow_blank=True, write_only=True)
    is_mobile = BooleanField(required=False, write_only=True)
    description = CharField(required=False, allow_blank=True, write_only=True)
    certifications = CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        # Explicitly define the fields you want included
        fields = [
            "id",
            "name",
            "email",
            "username",
            "password",
            "dob",
            "nic",
            "mobile_no",
            "role",
            "is_staff",
            "profile_picture",
            "average_rating",
            "total_ratings",
            "created_at",
            "updated_at",
            # Mechanic-specific fields
            "business_name",
            "experience_years",
            "license_number",
            "hourly_rate",
            "district",
            "province",
            "business_address",
            "service_area",
            "is_mobile",
            "description",
            "certifications",
        ]
        extra_kwargs = {
            "name": {"required": True},
            "email": {"required": True},
            "username": {"required": True},
            "password": {"write_only": True, "required": True},
            "profile_picture": {"required": False, "allow_null": True},
            "is_staff": {"read_only": True},
            "average_rating": {"read_only": True},
            "total_ratings": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def create(self, validated_data):
        # Extract mechanic-specific data if present
        mechanic_data = {}
        if validated_data.get("role") == "MECHANIC":
            # Map frontend field names to model field names
            field_mapping = {
                "experience_years": "years_of_experience",
                "business_name": "business_name",
                "license_number": "license_number",
                "hourly_rate": "hourly_rate",
                "district": "district",
                "province": "province",
                "business_address": "business_address",
                "service_area": "service_area",
                "is_mobile": "is_mobile",
                "description": "description",
                "certifications": "certifications",
            }

            for frontend_field, model_field in field_mapping.items():
                if frontend_field in validated_data:
                    mechanic_data[model_field] = validated_data.pop(frontend_field)

        # !Use create_user for proper password hashing
        user = User.objects.create_user(**validated_data)

        # Create mechanic profile if user is a mechanic
        if user.role == "MECHANIC" and mechanic_data:
            from .models import MechanicProfile

            MechanicProfile.objects.create(user=user, **mechanic_data)

        return user

    def update(self, instance, validated_data):

        profile_picture = validated_data.pop("profile_picture", None)

        # If a new picture is uploaded (not None) or if explicitly set to null to remove
        if profile_picture is not None:  # This means a file was uploaded
            instance.profile_picture = profile_picture
        elif (
            "profile_picture" in self.initial_data
            and self.initial_data["profile_picture"] is None
        ):
            # If frontend explicitly sends null for profile_picture to clear it
            instance.profile_picture = None

        # !Secure password update
        password = validated_data.pop("password", None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance
