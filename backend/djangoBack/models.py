from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

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

class User(AbstractBaseUser):
    # pseudo42 = models.CharField (null=True, unique=True)
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
    nbre_games = models.IntegerField(default=0)
    won_game = models.IntegerField(default=0)
    objects = UserManager()
    USERNAME_FIELD = 'username'
    def __str__(self):
        return f"{self.username} ({self.email})"

class PongGame(models.Model):
    date = models.DateTimeField(auto_now_add=True, null=True)  # La date et l'heure de la création de la partie seront automatiquement enregistrées
    player_one = models.ForeignKey(get_user_model(), related_name='player_one_game', on_delete=models.SET_NULL, null=True)
    player_two = models.ForeignKey(get_user_model(), related_name='player_two_game', on_delete=models.SET_NULL, null=True)
    player_one_socket_id = models.CharField(max_length=255, null=True, blank=True)
    player_two_socket_id = models.CharField(max_length=255, null=True, blank=True)
    score_player_one = models.IntegerField(default=0)
    score_player_two = models.IntegerField(default=0)
    winner = models.ForeignKey(get_user_model(), related_name='game_winner', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=[('waiting', 'Waiting'), ('playing', 'Playing'), ('complete', 'Complete')], default='waiting')
    isPaused = models.BooleanField(default=False)

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
    
class Player(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateTimeField(null=True)
    end_date = models.DateTimeField(null=True)
    number_of_players = models.IntegerField()
    is_active = models.BooleanField(default=True)
    participants = models.ManyToManyField(
        'Player',
        through='TournamentParticipation',
        related_name='tournaments',
        blank=True
    )
    participants_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"

class TournamentParticipation(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    is_ready = models.BooleanField(default=False)

    class Meta:
        unique_together = ['tournament', 'player']

class Match(models.Model):
    tournament = models.ForeignKey(Tournament, related_name='matches', on_delete=models.CASCADE)
    round = models.CharField(max_length=50, choices=[('semifinal', 'Semifinal'), ('final', 'Final')], default='NONE')  # Exemple: "Quarterfinal", "Semifinal", "Final"
    player_one = models.ForeignKey(Player, related_name='matches_as_player_one', on_delete=models.CASCADE, null=True)
    player_two = models.ForeignKey(Player, related_name='matches_as_player_two', on_delete=models.CASCADE, null=True)
    date_time = models.DateTimeField(null=True)
    score_player_one = models.IntegerField(default=0)
    score_player_two = models.IntegerField(default=0)
    winner = models.ForeignKey(Player, related_name='won_matches', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.round} - {self.player_one} vs {self.player_two} on {self.date_time}"