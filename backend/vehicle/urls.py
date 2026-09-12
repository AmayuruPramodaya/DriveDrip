from django.urls import path

from .views import (
    VehicleCategoryListView,
    VehicleBrandListView,
    VehicleModelListView,
    CarModel3DDetailView,
    CarModel3DListView,
)

# app urls

urlpatterns = [
    path("vehicle-brands/", VehicleBrandListView.as_view(), name="vehicle_brand_list"),
    path("vehicle-models/", VehicleModelListView.as_view(), name="vehicle_model_list"),
    path("3d-cars/", CarModel3DListView.as_view(), name="car_model_3d_list"),
    path(
        "vehicle-categories/",
        VehicleCategoryListView.as_view(),
        name="vehicle_category_list",
    ),
    path(
        "3d-cars/<int:pk>/",
        CarModel3DDetailView.as_view(),
        name="car_model_3d_detail",
    ),
]
