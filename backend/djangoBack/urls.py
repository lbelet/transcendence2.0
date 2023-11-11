from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from . import views

urlpatterns = [
    # Admin URL
    path('admin/', admin.site.urls),

    # Authentication URLs
    path('register/', views.register, name='register'),
    path('api_login/', views.api_login, name='api-login'),
    path('verify_two_factor_code/', views.verify_two_factor_code, name='verify-two-factor-code'),

    # JWT Token URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # User related URL
    path('user/update', views.update_user, name='update-user'),

    # Home page URL
    path('', views.index, name='index'),
]