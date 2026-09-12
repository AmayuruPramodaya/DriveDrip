from .models import Order, OrderItem

from rest_framework.serializers import (
    SerializerMethodField,
    ModelSerializer,
    IntegerField,
    ImageField,
    ListField,
    CharField,
)

# app serializers


class OrderItemSerializer(ModelSerializer):
    "Serializer for OrderItem model"

    spare_part_name = CharField(source="spare_part.name", read_only=True)
    spare_part_image = ImageField(source="spare_part.main_image", read_only=True)
    spare_part_part_number = CharField(source="spare_part.part_number", read_only=True)
    spare_part_seller_id = IntegerField(source="spare_part.seller.id", read_only=True)
    spare_part_seller_username = CharField(
        source="spare_part.seller.username", read_only=True
    )
    total_price = SerializerMethodField()

    def get_total_price(self, obj):
        return obj.quantity * obj.price

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "spare_part",
            "spare_part_name",
            "spare_part_image",
            "spare_part_part_number",
            "spare_part_seller_id",
            "spare_part_seller_username",
            "quantity",
            "price",
            "total_price",
        ]


class OrderSerializer(ModelSerializer):
    "Serializer for Order model"

    buyer_username = CharField(source="buyer.username", read_only=True)
    buyer_email = CharField(source="buyer.email", read_only=True)
    seller_username = SerializerMethodField()
    seller_email = SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    order_items = ListField(write_only=True, required=False)

    def get_seller_username(self, obj):
        "Get seller username from first order item"
        first_item = obj.items.first()
        return first_item.spare_part.seller.username if first_item else None

    def get_seller_email(self, obj):
        "Get seller email from first order item"
        first_item = obj.items.first()
        return first_item.spare_part.seller.email if first_item else None

    class Meta:
        model = Order
        fields = [
            "id",
            "buyer",
            "buyer_username",
            "buyer_email",
            "seller_username",
            "seller_email",
            "order_number",
            "status",
            "total_amount",
            "delivery_address",
            "delivery_phone",
            "items",
            "order_items",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "buyer": {"read_only": True},
            "order_number": {"read_only": True},
            "created_at": {"read_only": True},
            "updated_at": {"read_only": True},
        }

    def create(self, validated_data):
        order_items_data = validated_data.pop("order_items", [])
        order = Order.objects.create(**validated_data)

        # Create order items
        for item_data in order_items_data:
            OrderItem.objects.create(
                order=order,
                spare_part_id=item_data["spare_part"],
                quantity=item_data["quantity"],
                price=item_data["price"],
            )

        return order
