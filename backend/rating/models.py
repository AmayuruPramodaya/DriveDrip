from django.core.validators import MinValueValidator, MaxValueValidator
from mechanic.models import MechanicProfile, MechanicHireRequest
from django.utils.translation import gettext_lazy as _
from parts.models import SparePart
from main.models import User
from shop.models import Shop

from django.db.models import (
    PositiveIntegerField,
    DateTimeField,
    BooleanField,
    TextChoices,
    ForeignKey,
    CharField,
    TextField,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class Rating(Model):
    "Model for ratings"

    class RatingType(TextChoices):
        USER = "USER", _("User Rating")
        SHOP = "SHOP", _("Shop Rating")
        SPARE_PART = "SPARE_PART", _("Spare Part Rating")
        MECHANIC = "MECHANIC", _("Mechanic Rating")
        MECHANIC_SERVICE = "MECHANIC_SERVICE", _("Mechanic Service Rating")

    # Rating details
    rater = ForeignKey(User, on_delete=CASCADE, related_name="given_ratings")
    rating_type = CharField(_("rating type"), max_length=20, choices=RatingType.choices)
    rating = PositiveIntegerField(
        _("rating"), validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    # Rating targets (only one should be filled)
    rated_user = ForeignKey(
        User,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="received_ratings",
    )
    rated_shop = ForeignKey(
        Shop, on_delete=CASCADE, null=True, blank=True, related_name="ratings"
    )
    rated_spare_part = ForeignKey(
        SparePart,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="ratings",
    )
    rated_mechanic = ForeignKey(
        MechanicProfile,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="ratings",
    )
    rated_hire_request = ForeignKey(
        MechanicHireRequest,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="ratings",
    )

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)

    class Meta:
        verbose_name = _("rating")
        verbose_name_plural = _("ratings")
        # Ensure one user can rate each target only once
        unique_together = [
            ["rater", "rated_user"],
            ["rater", "rated_shop"],
            ["rater", "rated_spare_part"],
            ["rater", "rated_mechanic"],
            ["rater", "rated_hire_request"],
        ]
        indexes = [
            Index(fields=["rater", "rated_user"], name="unique_user_rating"),
            Index(fields=["rater", "rated_shop"], name="unique_shop_rating"),
            Index(
                fields=["rater", "rated_spare_part"], name="unique_spare_part_rating"
            ),
            Index(fields=["rater", "rated_mechanic"], name="unique_mechanic_rating"),
            Index(
                fields=["rater", "rated_hire_request"],
                name="unique_hire_request_rating",
            ),
        ]

    def __str__(self):
        if self.rated_user:
            return f"{self.rater.username} rated {self.rated_user.username}: {self.rating}/5"
        elif self.rated_shop:
            return (
                f"{self.rater.username} rated {self.rated_shop.name}: {self.rating}/5"
            )
        elif self.rated_spare_part:
            return f"{self.rater.username} rated {self.rated_spare_part.name}: {self.rating}/5"
        elif self.rated_mechanic:
            return f"{self.rater.username} rated mechanic {self.rated_mechanic.user.username}: {self.rating}/5"
        elif self.rated_hire_request:
            return f"{self.rater.username} rated job #{self.rated_hire_request.id}: {self.rating}/5"


class Review(Model):
    "Model for reviews"

    class ReviewType(TextChoices):
        USER = "USER", _("User Review")
        SHOP = "SHOP", _("Shop Review")
        SPARE_PART = "SPARE_PART", _("Spare Part Review")
        MECHANIC = "MECHANIC", _("Mechanic Review")
        MECHANIC_SERVICE = "MECHANIC_SERVICE", _("Mechanic Service Review")

    # Review details
    reviewer = ForeignKey(User, on_delete=CASCADE, related_name="given_reviews")
    review_type = CharField(_("review type"), max_length=20, choices=ReviewType.choices)
    title = CharField(_("title"), max_length=255)
    content = TextField(_("review content"))

    # Review targets (only one should be filled)
    reviewed_user = ForeignKey(
        User,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="received_reviews",
    )
    reviewed_shop = ForeignKey(
        Shop, on_delete=CASCADE, null=True, blank=True, related_name="reviews"
    )
    reviewed_spare_part = ForeignKey(
        SparePart,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="reviews",
    )
    reviewed_mechanic = ForeignKey(
        MechanicProfile,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="reviews",
    )
    reviewed_hire_request = ForeignKey(
        MechanicHireRequest,
        on_delete=CASCADE,
        null=True,
        blank=True,
        related_name="reviews",
    )

    # Associated rating (optional)
    rating = ForeignKey(
        Rating, on_delete=CASCADE, null=True, blank=True, related_name="review"
    )

    # Status
    is_verified = BooleanField(_("verified"), default=False)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("review")
        verbose_name_plural = _("reviews")
        ordering = ["-created_at"]
        indexes = [
            Index(fields=["reviewer", "reviewed_user"], name="unique_user_review"),
            Index(fields=["reviewer", "reviewed_shop"], name="unique_shop_review"),
            Index(
                fields=["reviewer", "reviewed_spare_part"],
                name="unique_spare_part_review",
            ),
            Index(
                fields=["reviewer", "reviewed_mechanic"], name="unique_mechanic_review"
            ),
            Index(
                fields=["reviewer", "reviewed_hire_request"],
                name="unique_hire_request_review",
            ),
        ]

    def __str__(self):
        return f"Review by {self.reviewer.username}: {self.title}"
