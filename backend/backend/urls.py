from django.conf.urls.static import static
from main.views import HealthCheckView
from django.urls import path, include
from django.views.static import serve
from django.conf import settings
from django.contrib import admin


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenBlacklistView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    # Authentication endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("api/token/blacklist/", TokenBlacklistView.as_view(), name="blacklist_token"),
    # App urls
    path("api/", include("ai.urls")),
    path("api/", include("main.urls")),
    path("api/", include("chat.urls")),
    path("api/", include("shop.urls")),
    path("api/", include("parts.urls")),
    path("api/", include("order.urls")),
    path("api/", include("rating.urls")),
    path("api/", include("vehicle.urls")),
    path("api/", include("mechanic.urls")),
    path("media/<path:path>", serve, {"document_root": settings.MEDIA_ROOT}),
    path(
        "api/health/",
        HealthCheckView.as_view(),
        name="health_check",
    ),
]
