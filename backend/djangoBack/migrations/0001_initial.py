# Generated by Django 3.2.12 on 2024-01-07 18:34

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import djangoBack.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('username', models.CharField(max_length=100, unique=True)),
                ('first_name', models.CharField(max_length=100)),
                ('last_name', models.CharField(max_length=100)),
                ('email', models.EmailField(max_length=100, unique=True)),
                ('password', models.CharField(max_length=100)),
                ('is_two_factor_enabled', models.BooleanField(default=False)),
                ('two_factor_code', models.CharField(blank=True, max_length=6, null=True)),
                ('two_factor_code_expires', models.DateTimeField(blank=True, null=True)),
                ('totp_secret', models.CharField(blank=True, max_length=100, null=True)),
                ('two_factor_method', models.CharField(choices=[('email', 'Email'), ('qr', 'QR'), ('none', 'NONE')], default='none', max_length=10)),
                ('avatar', models.ImageField(blank=True, default='avatars/default.png', null=True, upload_to='avatars/')),
                ('status', models.CharField(choices=[('en ligne', 'En ligne'), ('hors ligne', 'Hors ligne'), ('en jeu', 'En jeu')], default='hors ligne', max_length=10)),
                ('socket_id', models.CharField(blank=True, default='NONE', max_length=255)),
                ('game_socket_id', models.CharField(blank=True, default='NONE', max_length=255)),
                ('language', models.CharField(default='fr', max_length=10)),
                ('nbre_games', models.IntegerField(default=0)),
                ('won_game', models.IntegerField(default=0)),
                ('friends', models.ManyToManyField(blank=True, related_name='_djangoBack_user_friends_+', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
            managers=[
                ('objects', djangoBack.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('start_date', models.DateTimeField(null=True)),
                ('end_date', models.DateTimeField(null=True)),
                ('number_of_players', models.IntegerField()),
                ('is_active', models.BooleanField(default=True)),
                ('participants_count', models.IntegerField(default=0)),
                ('participants', models.ManyToManyField(blank=True, related_name='tournaments', to='djangoBack.Player')),
            ],
        ),
        migrations.CreateModel(
            name='PongGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player_one_socket_id', models.CharField(blank=True, max_length=255, null=True)),
                ('player_two_socket_id', models.CharField(blank=True, max_length=255, null=True)),
                ('score_player_one', models.IntegerField(default=0)),
                ('score_player_two', models.IntegerField(default=0)),
                ('status', models.CharField(choices=[('waiting', 'Waiting'), ('playing', 'Playing'), ('complete', 'Complete')], default='waiting', max_length=10)),
                ('isPaused', models.BooleanField(default=False)),
                ('player_one', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='player_one_game', to=settings.AUTH_USER_MODEL)),
                ('player_two', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='player_two_game', to=settings.AUTH_USER_MODEL)),
                ('winner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='game_winner', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Match',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round', models.CharField(max_length=50)),
                ('date_time', models.DateTimeField()),
                ('score_player_one', models.IntegerField(default=0)),
                ('score_player_two', models.IntegerField(default=0)),
                ('player_one', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_player_one', to='djangoBack.player')),
                ('player_two', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_player_two', to='djangoBack.player')),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='djangoBack.tournament')),
                ('winner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='won_matches', to='djangoBack.player')),
            ],
        ),
        migrations.CreateModel(
            name='FriendRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_accepted', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('receiver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_friend_requests', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_friend_requests', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
