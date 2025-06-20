# Generated by Django 5.1.3 on 2025-06-16 15:45

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EndpointUsage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('endpoint', models.CharField(db_index=True, max_length=255)),
                ('method', models.CharField(max_length=10)),
                ('view_name', models.CharField(blank=True, max_length=255, null=True)),
                ('last_accessed', models.DateTimeField(default=django.utils.timezone.now)),
                ('first_accessed', models.DateTimeField(default=django.utils.timezone.now)),
                ('total_requests', models.IntegerField(default=0)),
                ('total_errors', models.IntegerField(default=0)),
                ('avg_response_time', models.FloatField(default=0.0)),
                ('min_response_time', models.FloatField(blank=True, null=True)),
                ('max_response_time', models.FloatField(blank=True, null=True)),
                ('is_deprecated', models.BooleanField(default=False)),
                ('deprecation_date', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'ordering': ['-last_accessed'],
                'indexes': [models.Index(fields=['last_accessed'], name='analytics_e_last_ac_53185d_idx'), models.Index(fields=['total_requests'], name='analytics_e_total_r_dc7769_idx'), models.Index(fields=['is_deprecated'], name='analytics_e_is_depr_bf82b2_idx')],
                'unique_together': {('endpoint', 'method')},
            },
        ),
        migrations.CreateModel(
            name='SearchQuery',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('query', models.TextField(db_index=True)),
                ('search_type', models.CharField(choices=[('user', 'User Search'), ('thread', 'Thread Search'), ('post', 'Post Search'), ('news', 'News Search'), ('notice', 'Notice Search')], max_length=20)),
                ('timestamp', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('result_count', models.IntegerField(default=0)),
                ('execution_time', models.FloatField(default=0.0)),
                ('filters_applied', models.JSONField(blank=True, default=dict)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='UserSearchHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('clicked_result_id', models.IntegerField(blank=True, null=True)),
                ('clicked_result_type', models.CharField(blank=True, max_length=50, null=True)),
                ('search_query', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='analytics.searchquery')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='search_history', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-search_query__timestamp'],
            },
        ),
        migrations.CreateModel(
            name='EndpointRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('response_time', models.FloatField()),
                ('status_code', models.IntegerField()),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('endpoint_usage', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='requests', to='analytics.endpointusage')),
            ],
            options={
                'ordering': ['-timestamp'],
                'indexes': [models.Index(fields=['timestamp'], name='analytics_e_timesta_36cc60_idx'), models.Index(fields=['status_code'], name='analytics_e_status__3e3577_idx')],
            },
        ),
        migrations.AddIndex(
            model_name='searchquery',
            index=models.Index(fields=['search_type', 'timestamp'], name='analytics_s_search__b7cdc9_idx'),
        ),
        migrations.AddIndex(
            model_name='searchquery',
            index=models.Index(fields=['user', 'timestamp'], name='analytics_s_user_id_63c78b_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='usersearchhistory',
            unique_together={('user', 'search_query')},
        ),
    ]
