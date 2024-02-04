from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.conf.urls.static import static
from .views import get_config, oauth_callback
from . import views

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

    #API42 authentification
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    path('get_config/', views.get_config, name='get_config'),
     path('oauth/callback', views.oauth_callback, name='oauth_callback'),
    # path('handle_code/', views.handle_code, name='handle_code'),
    # path('api/get-config/', GetConfig.as_view(), name='get_config'),

    # JWT Token URLs
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
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

    path('create_tournament/', views.create_tournament, name='create-tournament'),
    path('register_to_tournament/<int:tournament_id>/', views.register_to_tournament, name='register-to-tournament'),
    path('unregister_from_tournament/<int:tournament_id>/', views.unregister_from_tournament, name='unregister-from-tournament'),
    path('available_tournaments/', views.available_tournaments, name='available-tournaments'),
    path('tournament_details/<int:tournament_id>/', views.tournament_details, name='tournament-details'),

    path('verify_token/', views.verify_token, name='verify_token'),

    path('update_nbre_games/', views.update_nbre_games, name='update-nbre-games'),

    path('set_player_ready/<int:tournament_id>/', views.set_player_ready, name='set_player_ready'),
    # path('startTournament/<int:tournament_id>/', views.startTournament, name='startTournament'),


    # Home page URL
    path('', views.index, name='index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
