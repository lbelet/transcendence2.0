# Generated by Django 3.2.12 on 2023-11-17 13:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('djangoBack', '0014_auto_20231116_1846'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='websocket_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]