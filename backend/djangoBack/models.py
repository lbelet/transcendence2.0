# from django.db import models
# from django.contrib.auth.models import AbstractBaseUser

# class User(AbstractBaseUser):
#     username = models.CharField(max_length=100, unique=True)
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     email = models.EmailField(unique=True)
#     password = models.CharField(max_length=100)

#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['username', 'first_name', 'last_name']  # add this line

from django.db import models

class Game(models.Model):
    username1 = models.CharField(max_length=100)
    username2 = models.CharField(max_length=100)
    winner = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.username1} vs {self.username2} - Winner: {self.winner}"

class Test(models.Model):
    number_of_games = models.IntegerField()
    number_of_wins = models.IntegerField()

    def __str__(self):
        return f"Games: {self.number_of_games}, Wins: {self.number_of_wins}"

