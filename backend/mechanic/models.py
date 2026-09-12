from django.utils.translation import gettext_lazy as _
from vehicle.models import VehicleCategory
from main.models import User
from decimal import Decimal

from django.db.models import (
    PositiveIntegerField,
    ManyToManyField,
    DateTimeField,
    OneToOneField,
    BooleanField,
    DecimalField,
    TextChoices,
    ForeignKey,
    CharField,
    DateField,
    TimeField,
    TextField,
    CASCADE,
    Index,
    Model,
)

# Create your models here.


class MechanicProfile(Model):
    "Extended profile for mechanics"

    user = OneToOneField(
        User,
        on_delete=CASCADE,
        related_name="mechanic_profile",
        limit_choices_to={"role": "MECHANIC"},
    )

    # Professional details
    license_number = CharField(_("license number"), max_length=100, blank=True)
    years_of_experience = PositiveIntegerField(_("years of experience"), default=0)
    specializations = ManyToManyField(
        VehicleCategory, related_name="specialist_mechanics", blank=True
    )
    description = TextField(_("professional description"), blank=True)
    certifications = TextField(_("certifications and qualifications"), blank=True)

    # Location and availability
    province = CharField(_("province"), max_length=100, blank=True)
    district = CharField(_("district"), max_length=100, blank=True)
    service_area = TextField(_("service area description"), blank=True)
    is_mobile = BooleanField(
        _("mobile mechanic"), default=False
    )  # Can travel to customer location

    # Business details
    hourly_rate = DecimalField(
        _("hourly rate"), max_digits=8, decimal_places=2, null=True, blank=True
    )
    business_name = CharField(_("business name"), max_length=255, blank=True)
    business_address = TextField(_("business address"), blank=True)

    # Verification
    is_verified = BooleanField(_("verified"), default=False)
    is_available = BooleanField(_("available for hire"), default=True)

    # Ratings specific to mechanic services
    service_rating = DecimalField(
        _("service rating"), max_digits=3, decimal_places=2, default=Decimal("0.00")
    )
    total_service_ratings = PositiveIntegerField(_("total service ratings"), default=0)
    total_jobs_completed = PositiveIntegerField(_("total jobs completed"), default=0)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("mechanic profile")
        verbose_name_plural = _("mechanic profiles")
        indexes = [Index(fields=["user"], name="unique_mechanic_profile")]

    def __str__(self):
        return f"Mechanic: {self.user.username}"


class MechanicService(Model):
    "Services offered by mechanics"

    class ServiceType(TextChoices):
        ENGINE_REPAIR = "ENGINE_REPAIR", _("Engine Repair")
        BRAKE_SERVICE = "BRAKE_SERVICE", _("Brake Service")
        TRANSMISSION = "TRANSMISSION", _("Transmission Repair")
        ELECTRICAL = "ELECTRICAL", _("Electrical Systems")
        AC_SERVICE = "AC_SERVICE", _("AC Service")
        BODY_WORK = "BODY_WORK", _("Body Work & Painting")
        TIRE_SERVICE = "TIRE_SERVICE", _("Tire Service")
        OIL_CHANGE = "OIL_CHANGE", _("Oil Change")
        INSPECTION = "INSPECTION", _("Vehicle Inspection")
        TOWING = "TOWING", _("Towing Service")
        EMERGENCY = "EMERGENCY", _("Emergency Repair")
        OTHER = "OTHER", _("Other Service")

    mechanic = ForeignKey(MechanicProfile, on_delete=CASCADE, related_name="services")
    service_type = CharField(
        _("service type"), max_length=20, choices=ServiceType.choices
    )
    name = CharField(_("service name"), max_length=255)
    description = TextField(_("service description"))

    # Pricing
    base_price = DecimalField(_("base price"), max_digits=8, decimal_places=2)
    price_per_hour = DecimalField(
        _("price per hour"), max_digits=8, decimal_places=2, null=True, blank=True
    )

    # Service details
    estimated_duration = PositiveIntegerField(
        _("estimated duration (minutes)"), null=True, blank=True
    )
    compatible_vehicles = ManyToManyField(
        VehicleCategory, related_name="available_services", blank=True
    )

    # Status
    is_active = BooleanField(_("active"), default=True)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("mechanic service")
        verbose_name_plural = _("mechanic services")
        indexes = [
            Index(fields=["mechanic", "service_type"], name="mechanic_service_index")
        ]

    def __str__(self):
        return f"{self.mechanic.user.username} - {self.name}"


class MechanicHireRequest(Model):
    "Model for hiring mechanic requests"

    class Status(TextChoices):
        PENDING = "PENDING", _("Pending")
        ACCEPTED = "ACCEPTED", _("Accepted")
        REJECTED = "REJECTED", _("Rejected")
        IN_PROGRESS = "IN_PROGRESS", _("In Progress")
        COMPLETED = "COMPLETED", _("Completed")
        CANCELLED = "CANCELLED", _("Cancelled")

    class JobType(TextChoices):
        ON_SITE = "ON_SITE", _("On-Site (Customer Location)")
        SHOP = "SHOP", _("At Mechanic Shop")
        ROADSIDE = "ROADSIDE", _("Roadside Assistance")

    # Participants
    customer = ForeignKey(User, on_delete=CASCADE, related_name="hire_requests")
    mechanic = ForeignKey(
        MechanicProfile, on_delete=CASCADE, related_name="hire_requests"
    )

    # Job details
    service = ForeignKey(
        MechanicService,
        on_delete=CASCADE,
        related_name="hire_requests",
        null=True,
        blank=True,
    )
    job_type = CharField(
        _("job type"), max_length=15, choices=JobType.choices, default=JobType.SHOP
    )

    # Problem description
    problem_description = TextField(_("problem description"))
    vehicle_info = TextField(_("vehicle information"))  # Make, model, year, etc.

    # Location details
    service_location = TextField(
        _("service location"), blank=True
    )  # For on-site/roadside

    # Scheduling
    preferred_date = DateField(_("preferred date"), null=True, blank=True)
    preferred_time = TimeField(_("preferred time"), null=True, blank=True)
    scheduled_date = DateField(_("scheduled date"), null=True, blank=True)
    scheduled_time = TimeField(_("scheduled time"), null=True, blank=True)

    # Pricing
    estimated_cost = DecimalField(
        _("estimated cost"), max_digits=10, decimal_places=2, null=True, blank=True
    )
    final_cost = DecimalField(
        _("final cost"), max_digits=10, decimal_places=2, null=True, blank=True
    )

    # Status and notes
    status = CharField(
        _("status"), max_length=15, choices=Status.choices, default=Status.PENDING
    )
    mechanic_notes = TextField(_("mechanic notes"), blank=True)
    customer_notes = TextField(_("customer notes"), blank=True)

    # Job completion
    work_completed = TextField(_("work completed"), blank=True)
    parts_used = TextField(_("parts used"), blank=True)

    # Metadata
    created_at = DateTimeField(_("created at"), auto_now_add=True)
    updated_at = DateTimeField(_("updated at"), auto_now=True)
    completed_at = DateTimeField(_("completed at"), null=True, blank=True)

    class Meta:
        verbose_name = _("mechanic hire request")
        verbose_name_plural = _("mechanic hire requests")
        ordering = ["-created_at"]
        indexes = [
            Index(fields=["customer", "mechanic"], name="customer_mechanic_index"),
            Index(fields=["status"], name="hire_request_status_index"),
        ]

    def __str__(self):
        return (
            f"Job #{self.id} - {self.customer.username} → {self.mechanic.user.username}"
        )


class MechanicAvailability(Model):
    "Model for mechanic availability schedule"

    class DayChoices(TextChoices):
        MONDAY = "MONDAY", _("Monday")
        TUESDAY = "TUESDAY", _("Tuesday")
        WEDNESDAY = "WEDNESDAY", _("Wednesday")
        THURSDAY = "THURSDAY", _("Thursday")
        FRIDAY = "FRIDAY", _("Friday")
        SATURDAY = "SATURDAY", _("Saturday")
        SUNDAY = "SUNDAY", _("Sunday")

    mechanic = ForeignKey(
        MechanicProfile, on_delete=CASCADE, related_name="availability"
    )
    day_of_week = CharField(_("day of week"), max_length=10, choices=DayChoices.choices)
    start_time = TimeField(_("start time"))
    end_time = TimeField(_("end time"))
    is_available = BooleanField(_("available"), default=True)

    class Meta:
        verbose_name = _("mechanic availability")
        verbose_name_plural = _("mechanic availability")
        unique_together = ["mechanic", "day_of_week"]
        indexes = [
            Index(
                fields=["mechanic", "day_of_week"], name="mechanic_availability_index"
            )
        ]

    def __str__(self):
        return f"{self.mechanic.user.username} - {self.day_of_week}: {self.start_time}-{self.end_time}"
