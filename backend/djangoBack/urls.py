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
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),

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
    path('api_outGame_tournament/', views.api_outGame_tournament, name='api-outGame-tournament'),
    path('update_socket_id/', views.update_socket_id, name='update-socket-id'),
    path('update_GameSocket_id/', views.update_GameSocket_id, name='update-GameSocket-id'),
    path('join_game_queue/', views.join_game_queue, name='join-game-queue'),
    path('update_language/', views.update_language, name='update-language'),

    path('create_tournament/', views.create_tournament, name='create-tournament'),
    path('check_tournament_exists/<str:tournament_name>/', views.check_tournament_exists, name='check_tournament_exists'),
    path('register_to_tournament/<int:tournament_id>/', views.register_to_tournament, name='register-to-tournament'),
    path('unregister_from_tournament/<int:tournament_id>/', views.unregister_from_tournament, name='unregister-from-tournament'),
    path('available_tournaments/', views.available_tournaments, name='available-tournaments'),
    path('tournament_details/<int:tournament_id>/', views.tournament_details, name='tournament-details'),

    path('verify_token/', views.verify_token, name='verify_token'),

    path('update_nbre_games/', views.update_nbre_games, name='update-nbre-games'),

    path('set_player_ready/<int:tournament_id>/', views.set_player_ready, name='set-player-ready'),

    path('get_game_players/<int:game_id>/', views.get_game_players, name='get-game-players'),
    path('get_game_players_tournament/<int:game_id>/', views.get_game_players_tournament, name='get-game-players-tournament'),


    # Home page URL
    path('', views.index, name='index'),
    path('health/', views.health_check, name='health-check'),

    path('check_tournament_exists/<str:tournament_name>/', views.check_tournament_exists, name='check-tournament-exists'),
    path('check_user_exists/', views.check_user_exists, name='check_user_exists'),

    path('delete_tournament/<int:tournament_id>/', views.delete_tournament, name='delete-tournament'),
    path('user_games_history/', views.user_games_history, name='user-games-history'),
    path('game_info/<int:game_id>/', views.game_info, name='game-info'),

    path('get_csrf_token/', views.get_csrf_token, name='get-csrf-token'),
    path('check_nickname_exists/<str:nickName>/', views.check_nickname_exists, name='check-nickname-exists'),



]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
