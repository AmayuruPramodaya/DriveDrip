from .views import UserCreateView, UserDetailView, UserInfoView
from django.urls import path

# app urls

urlpatterns = [
    path("user/", UserInfoView.as_view(), name="user_info"),
    path("user/register/", UserCreateView.as_view(), name="register"),
    path("user/<int:pk>/", UserDetailView.as_view(), name="user_detail"),
]
