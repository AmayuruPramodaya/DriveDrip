from django.urls import path

from .views import (
    RatingListCreateView,
    ReviewListCreateView,
    ReviewDetailView,
    rate_item,
)

# app urls

urlpatterns = [
    path("rate/", rate_item, name="rate_item"),
    path("ratings/", RatingListCreateView.as_view(), name="rating_list_create"),
    path("reviews/", ReviewListCreateView.as_view(), name="review_list_create"),
    path("reviews/<int:pk>/", ReviewDetailView.as_view(), name="review_detail"),
]
