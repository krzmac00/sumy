# Generated by Django 5.2 on 2025-04-26 11:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('mainapp', '0002_post_parent_post_post_thread_alter_thread_post_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='parent_post',
        ),
        migrations.AddField(
            model_name='post',
            name='replying_to',
            field=models.ManyToManyField(blank=True, related_name='replies', to='mainapp.post'),
        ),
    ]
