from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# Custom UserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The email address must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    # def create_superuser(self, email, password=None, **extra_fields):
    #     extra_fields.setdefault('is_staff', True)
    #     extra_fields.setdefault('is_superuser', True)

    #     if extra_fields.get('is_staff') is not True:
    #         raise ValueError('Superuser must have is_staff=True.')
    #     if extra_fields.get('is_superuser') is not True:
    #         raise ValueError('Superuser must have is_superuser=True.')

    #     return self.create_user(email, password, **extra_fields)

# Custom User Model


class User(AbstractBaseUser):
    username = models.CharField(max_length=100, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    is_two_factor_enabled = models.BooleanField(default=False)
    two_factor_code = models.CharField(max_length=6, null=True, blank=True)
    two_factor_code_expires = models.DateTimeField(null=True, blank=True)
    totp_secret = models.CharField(max_length=100, null=True, blank=True)
    two_factor_method = models.CharField(
        max_length=10, choices=[('email', 'Email'), ('qr', 'QR'), ('none', 'NONE')], default='none')
    avatar = models.ImageField(
        upload_to='avatars/', null=True, blank=True, default='avatars/default.png')
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)

    ONLINE = 'en ligne'
    OFFLINE = 'hors ligne'
    IN_GAME = 'en jeu'
    STATUS_CHOICES = [
        (ONLINE, 'En ligne'),
        (OFFLINE, 'Hors ligne'),
        (IN_GAME, 'En jeu'),
    ]

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=OFFLINE)

    socket_id = models.CharField(max_length=255, blank=True, default='NONE')
    game_socket_id = models.CharField(max_length=255, blank=True, default='NONE')


    language = models.CharField(max_length=10, default='fr')

    # Add additional fields here if necessary

    objects = UserManager()

    USERNAME_FIELD = 'username'
    # REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.username} ({self.email})"

# Game Model


class PongGame(models.Model):
    player_one = models.ForeignKey(get_user_model(), related_name='player_one_game', on_delete=models.SET_NULL, null=True)
    player_two = models.ForeignKey(get_user_model(), related_name='player_two_game', on_delete=models.SET_NULL, null=True)
    player_one_socket_id = models.CharField(max_length=255, null=True, blank=True)
    player_two_socket_id = models.CharField(max_length=255, null=True, blank=True)
    score_player_one = models.IntegerField(default=0)
    score_player_two = models.IntegerField(default=0)
    winner = models.ForeignKey(get_user_model(), related_name='game_winner', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=[('waiting', 'Waiting'), ('playing', 'Playing'), ('complete', 'Complete')], default='waiting')
    isPaused = models.BooleanField(default=False)
    # player_one_channel_name = models.CharField(max_length=255, blank=True, null=True)
    # player_two_channel_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        player_one_username = self.player_one.username if self.player_one else "No Player"
        player_two_username = self.player_two.username if self.player_two else "No Player"
        winner_username = self.winner.username if self.winner else "No Winner"

        return f"{player_one_username} vs {player_two_username} - Winner: {winner_username}"

class FriendRequest(models.Model):
    sender = models.ForeignKey(
        User, related_name='sent_friend_requests', on_delete=models.CASCADE)
    receiver = models.ForeignKey(
        User, related_name='received_friend_requests', on_delete=models.CASCADE)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"De {self.sender.username} à {self.receiver.username}"


class Test(models.Model):
    number_of_games = models.IntegerField()
    number_of_wins = models.IntegerField()

    def __str__(self):
        return f"Games: {self.number_of_games}, Wins: {self.number_of_wins}"
