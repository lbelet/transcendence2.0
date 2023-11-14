from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.conf.urls.static import static

from djangoBack import settings

from . import views

urlpatterns = [
    # Admin URL
    path('admin/', admin.site.urls),

    # Authentication URLs
    path('register/', views.register, name='register'),
    path('api_login/', views.api_login, name='api-login'),
    path('verify_two_factor_code/', views.verify_two_factor_code,
         name='verify-two-factor-code'),

    # JWT Token URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # User related URL
    path('user/update', views.update_user, name='update-user'),
    path('get_user_avatar/', views.get_user_avatar, name='get-user-avatar'),
    path('search_users/', views.search_users, name='search_users'),
    path('send_friend_request/', views.send_friend_request, name='send_friend_request'),
    path('pending_friend_requests/', views.get_pending_friend_requests, name='pending_friend_requests'),
    path('accept_friend_request/<int:request_id>/', views.accept_friend_request, name='accept_friend_request'),
    path('decline_friend_request/<int:request_id>/', views.decline_friend_request, name='decline_friend_request'),
    path('get_friends/', views.get_friends, name='get_friends'),


    # Home page URL
    path('', views.index, name='index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
