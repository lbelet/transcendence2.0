from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# Définition de votre UserManager personnalisé


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('L\'adresse email doit être définie')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        # Ici, vous pouvez définir l'age directement si c'est passé dans extra_fields
        # ou vous pouvez le rendre obligatoire en l'ajoutant comme argument
        user.save(using=self._db)
        return user


    # def create_superuser(self, email, password=None, **extra_fields):
    #     extra_fields.setdefault('is_staff', True)
    #     extra_fields.setdefault('is_superuser', True)

    #     if extra_fields.get('is_staff') is not True:
    #         raise ValueError('Le superutilisateur doit avoir is_staff=True.')
    #     if extra_fields.get('is_superuser') is not True:
    #         raise ValueError(
    #             'Le superutilisateur doit avoir is_superuser=True.')

    #     return self.create_user(email, password, **extra_fields)

# Définition de votre modèle utilisateur personnalisé


class User(AbstractBaseUser):
    username = models.CharField(max_length=100, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=100)

    # Ajoutez les champs supplémentaires ici si nécessaire

    # Spécifiez le UserManager pour le modèle utilisateur
    objects = UserManager()

    USERNAME_FIELD = 'username'
    # REQUIRED_FIELDS = ['first_name', 'last_name']


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
