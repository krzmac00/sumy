from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class EndpointUsage(models.Model):
    """Track usage statistics for API endpoints."""
    
    endpoint = models.CharField(max_length=255, db_index=True)
    method = models.CharField(max_length=10)
    view_name = models.CharField(max_length=255, null=True, blank=True)
    last_accessed = models.DateTimeField(default=timezone.now)
    first_accessed = models.DateTimeField(default=timezone.now)
    total_requests = models.IntegerField(default=0)
    total_errors = models.IntegerField(default=0)
    avg_response_time = models.FloatField(default=0.0)
    min_response_time = models.FloatField(null=True, blank=True)
    max_response_time = models.FloatField(null=True, blank=True)
    is_deprecated = models.BooleanField(default=False)
    deprecation_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('endpoint', 'method')
        ordering = ['-last_accessed']
        indexes = [
            models.Index(fields=['last_accessed']),
            models.Index(fields=['total_requests']),
            models.Index(fields=['is_deprecated']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint}"
    
    @property
    def days_since_last_access(self):
        return (timezone.now() - self.last_accessed).days
    
    @property
    def is_unused(self):
        """Consider endpoint unused if not accessed in 30 days."""
        return self.days_since_last_access > 30


class EndpointRequest(models.Model):
    """Detailed log of individual endpoint requests."""
    
    endpoint_usage = models.ForeignKey(EndpointUsage, on_delete=models.CASCADE, related_name='requests')
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    response_time = models.FloatField()  # in milliseconds
    status_code = models.IntegerField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['status_code']),
        ]


class SearchQuery(models.Model):
    """Track search queries for analytics and autocomplete."""
    
    SEARCH_TYPES = (
        ('user', 'User Search'),
        ('thread', 'Thread Search'),
        ('post', 'Post Search'),
        ('news', 'News Search'),
        ('notice', 'Notice Search'),
    )
    
    query = models.TextField(db_index=True)
    search_type = models.CharField(max_length=20, choices=SEARCH_TYPES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    result_count = models.IntegerField(default=0)
    execution_time = models.FloatField(default=0.0)  # in milliseconds
    filters_applied = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['search_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.search_type}: {self.query[:50]}"


class UserSearchHistory(models.Model):
    """Store user search history for personalization."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_history')
    search_query = models.ForeignKey(SearchQuery, on_delete=models.CASCADE)
    clicked_result_id = models.IntegerField(null=True, blank=True)
    clicked_result_type = models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        ordering = ['-search_query__timestamp']
        unique_together = ('user', 'search_query')
