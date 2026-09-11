from django.utils.translation import gettext_lazy as _
from main.models import User
from decimal import Decimal

from django.db.models import (
    PositiveIntegerField,
    DateTimeField,
    DecimalField,
    BooleanField,
    EmailField,
    ImageField,
    ForeignKey,
    CharField,
    TextField,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class Shop(Model):
    "Model for seller shops"

    seller = ForeignKey(User, on_delete=CASCADE, related_name="shops")
    name = CharField(_("shop name"), max_length=255)
    description = TextField(_("description"), blank=True)

    # Location fields
    province = CharField(_("province"), max_length=100, blank=True)
    district = CharField(_("district"), max_length=100, blank=True)
    address = TextField(_("address"))

    phone = CharField(_("phone"), max_length=15)
    email = EmailField(_("email"), blank=True)

    # Shop verification
    is_verified = BooleanField(_("verified"), default=False)

    # Business details
    business_license = CharField(_("business license"), max_length=100, blank=True)
    tax_id = CharField(_("tax ID"), max_length=50, blank=True)

    # Shop image
    logo = ImageField(_("shop logo"), upload_to="shop_logos/", null=True, blank=True)

    # Ratings
    average_rating = DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    total_ratings = PositiveIntegerField(_("total ratings"), default=0)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("shop")
        verbose_name_plural = _("shops")
        # Allow multiple shops per seller but ensure unique shop names per seller
        unique_together = ["seller", "name"]
        indexes = [Index(fields=["seller", "name"], name="unique_shop_per_seller")]

    def __str__(self):
        return f"{self.name} (by {self.seller.username})"
