from django.urls import path

from .views import (
    SparePartCategoryListView,
    SparePartListCreateView,
    PopularSparePartsView,
    trending_spare_parts,
    SparePartDetailView,
    search_spare_parts,
)

# app urls

urlpatterns = [
    path("spare-parts/trending/", trending_spare_parts, name="trending_spare_parts"),
    path("spare-parts/search/", search_spare_parts, name="search_spare_parts"),
    path(
        "spare-part-categories/",
        SparePartCategoryListView.as_view(),
        name="spare_part_category_list",
    ),
    path(
        "spare-parts/",
        SparePartListCreateView.as_view(),
        name="spare_part_list_create",
    ),
    path(
        "spare-parts/<int:pk>/",
        SparePartDetailView.as_view(),
        name="spare_part_detail",
    ),
    path(
        "spare-parts/popular/",
        PopularSparePartsView.as_view(),
        name="popular_spare_parts",
    ),
]
