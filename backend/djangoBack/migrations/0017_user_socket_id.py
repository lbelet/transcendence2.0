# Generated by Django 3.2.12 on 2023-11-17 14:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('djangoBack', '0016_remove_user_websocket_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='socket_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]