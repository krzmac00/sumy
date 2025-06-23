# Generated migration for adding event fields to NewsItem

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='newsitem',
            name='event_end_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='newsitem',
            name='event_description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='newsitem',
            name='event_room',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='newsitem',
            name='event_teacher',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]