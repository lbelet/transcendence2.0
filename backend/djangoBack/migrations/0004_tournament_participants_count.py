# Generated by Django 3.2.12 on 2023-12-14 16:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('djangoBack', '0003_tournament_participants'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='participants_count',
            field=models.IntegerField(default=0),
        ),
    ]