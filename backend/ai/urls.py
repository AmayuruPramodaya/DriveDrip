from django.urls import path
from .views import *

# app urls

urlpatterns = [
    path(
        "ai/generate-description/",
        generate_part_description,
        name="ai_generate_description",
    ),
    path("ai/semantic-search/", semantic_search_parts, name="semantic_search"),
    path(
        "spare-parts/<int:part_id>/compatibility-chat/",
        compatibility_chatbot,
        name="compatibility_chatbot",
    ),
    path(
        "spare-parts/<int:part_id>/summarize-reviews/",
        summarize_reviews,
        name="summarize_reviews",
    ),
    # Admin AI analysis endpoints
    path(
        "admin/seller-analysis/<int:seller_id>/",
        analyze_seller_reputation,
        name="seller_reputation_analysis",
    ),
    path(
        "admin/bulk-seller-analysis/",
        bulk_seller_analysis,
        name="bulk_seller_analysis",
    ),
]
