# Generated by Django 3.2.12 on 2024-01-16 20:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('djangoBack', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OAuthUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('username', models.CharField(max_length=255)),
            ],
        ),
    ]
