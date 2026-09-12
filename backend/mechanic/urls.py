from django.urls import path

from .views import (
    MechanicAvailabilityListCreateView,
    MechanicHireRequestListCreateView,
    MechanicHireRequestDetailView,
    MechanicProfileListCreateView,
    MechanicServiceListCreateView,
    MechanicServiceDetailView,
    MechanicProfileDetailView,
    review_mechanic,
    rate_mechanic,
)

# app urls

urlpatterns = [
    path(
        "mechanics/",
        MechanicProfileListCreateView.as_view(),
        name="mechanic_profile_list_create",
    ),
    path(
        "mechanics/<int:pk>/",
        MechanicProfileDetailView.as_view(),
        name="mechanic_profile_detail",
    ),
    path(
        "mechanic-services/",
        MechanicServiceListCreateView.as_view(),
        name="mechanic_service_list_create",
    ),
    path(
        "mechanic-services/<int:pk>/",
        MechanicServiceDetailView.as_view(),
        name="mechanic_service_detail",
    ),
    path(
        "hire-requests/",
        MechanicHireRequestListCreateView.as_view(),
        name="hire_request_list_create",
    ),
    path(
        "hire-requests/<int:pk>/",
        MechanicHireRequestDetailView.as_view(),
        name="hire_request_detail",
    ),
    path(
        "hire-requests/<int:hire_request_id>/rate/",
        rate_mechanic,
        name="rate_mechanic",
    ),
    path(
        "hire-requests/<int:hire_request_id>/review/",
        review_mechanic,
        name="review_mechanic",
    ),
    path(
        "mechanic-availability/",
        MechanicAvailabilityListCreateView.as_view(),
        name="mechanic_availability",
    ),
]
