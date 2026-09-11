from django.utils.translation import gettext_lazy as _
from parts.models import SparePart
from main.models import User

from django.db.models import (
    PositiveIntegerField,
    DateTimeField,
    DecimalField,
    TextChoices,
    ForeignKey,
    CharField,
    TextField,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class Order(Model):
    "Model for orders"

    class Status(TextChoices):
        PENDING = "PENDING", _("Pending")
        CONFIRMED = "CONFIRMED", _("Confirmed")
        PROCESSING = "PROCESSING", _("Processing")
        SHIPPED = "SHIPPED", _("Shipped")
        DELIVERED = "DELIVERED", _("Delivered")
        CANCELLED = "CANCELLED", _("Cancelled")

    # Order details
    buyer = ForeignKey(User, on_delete=CASCADE, related_name="orders")
    order_number = CharField(_("order number"), max_length=50, unique=True)
    status = CharField(
        _("status"), max_length=15, choices=Status.choices, default=Status.PENDING
    )

    # Pricing
    total_amount = DecimalField(_("total amount"), max_digits=10, decimal_places=2)

    # Delivery information
    delivery_address = TextField(_("delivery address"))
    delivery_phone = CharField(_("delivery phone"), max_length=15)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("order")
        verbose_name_plural = _("orders")
        ordering = ["-created_at"]
        indexes = [Index(fields=["order_number"], name="unique_order_number")]

    @property
    def seller(self):
        "Get the seller from the first order item"
        first_item = self.items.first()
        return first_item.spare_part.seller if first_item else None

    @property
    def seller_username(self):
        "Get seller username"
        seller = self.seller
        return seller.username if seller else ""

    @property
    def seller_email(self):
        "Get seller email"
        seller = self.seller
        return seller.email if seller else ""

    @property
    def buyer_username(self):
        "Get buyer username"
        return self.buyer.username if self.buyer else ""

    @property
    def buyer_email(self):
        "Get buyer email"
        return self.buyer.email if self.buyer else ""

    def __str__(self):
        return f"Order {self.order_number} by {self.buyer.username}"


class OrderItem(Model):
    "Individual items in an order"

    order = ForeignKey(Order, on_delete=CASCADE, related_name="items")
    spare_part = ForeignKey(SparePart, on_delete=CASCADE, related_name="order_items")
    quantity = PositiveIntegerField(_("quantity"))
    price = DecimalField(_("price per item"), max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("order item")
        verbose_name_plural = _("order items")

    def __str__(self):
        return f"{self.spare_part.name} x {self.quantity}"

    @property
    def total_price(self):
        return self.price * self.quantity
