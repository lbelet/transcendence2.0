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
    path('logout/', views.api_logout, name='api_logout'),


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
    path('api_inGame/', views.api_inGame, name='in-game'),
    path('api_outGame/', views.api_outGame, name='api-outGame'),
    path('update_socket_id/', views.update_socket_id, name='update-socket-id'),
    path('update_GameSocket_id/', views.update_GameSocket_id, name='update-GameSocket-id'),
    path('join_game_queue/', views.join_game_queue, name='join-game-queue'),
    path('update_language/', views.update_language, name='update-language'),
    # path('update_email/', views.update_email, name='update-email'),

    path('create_tournament/', views.create_tournament, name='create_tournament'),




    # Home page URL
    path('', views.index, name='index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
