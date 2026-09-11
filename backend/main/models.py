from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from decimal import Decimal

from django.db.models import (
    PositiveIntegerField,
    DateTimeField,
    DecimalField,
    TextChoices,
    EmailField,
    ImageField,
    CharField,
    DateField,
)

# TODO: Declare field validators

phone_validator = RegexValidator(
    regex=r"^\d{10}$", message=_("Mobile number must be 10 digits")
)

nic_validator = RegexValidator(
    regex=r"^[0-9]{10}$", message=_("NIC must be in valid format")
)

# TODO: Create authentication backend for custom user model


class UserManager(BaseUserManager):
    "Custom user manager"

    def create_user(self, email, username, password=None, **args):
        "Create and return a user"
        if not email:
            raise ValueError(_("The email must be set"))
        if not username:
            raise ValueError(_("The username must be set"))
        if ("role" in args) and (
            args["role"] not in ["SELLER", "BUYER", "ADMIN", "MECHANIC"]
        ):
            raise ValueError(_("The role must be valid"))

        email = self.normalize_email(email)

        # Set default values and merge with args
        defaults = {
            "email": email,
            "username": username,
            "is_active": True,
        }
        defaults.update(args)

        # Only set is_staff=True for admin users
        if defaults.get("role") == "ADMIN":
            defaults["is_staff"] = True

        user = self.model(**defaults)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password, **args):
        "Create and return a superuser"
        args.update(
            {
                "is_staff": True,
                "is_active": True,
                "is_superuser": True,
                "role": "ADMIN",
            }
        )

        if not args["is_staff"]:
            raise ValueError(_("Superuser must have is_staff=True."))
        if not args["is_superuser"]:
            raise ValueError(_("Superuser must have is_superuser=True."))
        if args["role"] != "ADMIN":
            raise ValueError(_("Superuser must have role of Admin."))

        return self.create_user(email, username, password, **args)


class User(AbstractUser):
    class Role(TextChoices):
        ADMIN = "ADMIN", _("Admin")
        BUYER = "BUYER", _("Buyer")
        SELLER = "SELLER", _("Seller")
        MECHANIC = "MECHANIC", _("Mechanic")

    # Core personal information
    name = CharField(_("name"), max_length=255)
    email = EmailField(_("email"), unique=True)
    username = CharField(max_length=150, unique=True)
    dob = DateField(_("birthday"), null=True, blank=True)
    nic = CharField(_("NIC"), max_length=10, unique=True, validators=[nic_validator])
    mobile_no = CharField(
        _("mobile"),
        max_length=10,
        unique=True,
        validators=[phone_validator],
        null=True,
        blank=True,
        default=None,
    )

    # Profile information
    profile_picture = ImageField(
        _("profile picture"), upload_to="profile_pics/", null=True, blank=True
    )

    # Role and status
    role = CharField(_("role"), max_length=10, choices=Role.choices, default=Role.BUYER)

    # Rating as seller/buyer
    average_rating = DecimalField(
        _("average rating"), max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    total_ratings = PositiveIntegerField(_("total ratings"), default=0)

    # Metadata
    updated_at = DateTimeField(_("updated at"), auto_now=True)
    created_at = DateTimeField(_("created at"), auto_now_add=True)

    # Remove unused fields from AbstractUser
    groups = None
    last_name = None
    first_name = None
    user_permissions = None

    # Authentication Config
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["name", "email"]

    class Meta:
        ordering = ["username"]
        verbose_name = _("user")
        verbose_name_plural = _("users")

    def __str__(self):
        return self.username
