# Generated by Django 3.1.1 on 2020-09-23 09:24

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Labs',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.IntegerField()),
                ('description', models.CharField(max_length=150)),
                ('image', models.ImageField(upload_to='computer_graphics/images')),
            ],
        ),
    ]