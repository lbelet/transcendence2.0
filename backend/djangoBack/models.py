from django.db import models
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
    # Add additional fields here if necessary

    objects = UserManager()

    USERNAME_FIELD = 'username'
    # REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.username} ({self.email})"

# Game Model
class Game(models.Model):
    username1 = models.CharField(max_length=100)
    username2 = models.CharField(max_length=100)
    winner = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.username1} vs {self.username2} - Winner: {self.winner}"

# Test Model
class Test(models.Model):
    number_of_games = models.IntegerField()
    number_of_wins = models.IntegerField()

    def __str__(self):
        return f"Games: {self.number_of_games}, Wins: {self.number_of_wins}"
