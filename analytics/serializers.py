from rest_framework import serializers
from .models import EndpointUsage, EndpointRequest, SearchQuery, UserSearchHistory


class EndpointUsageSerializer(serializers.ModelSerializer):
    days_since_last_access = serializers.ReadOnlyField()
    is_unused = serializers.ReadOnlyField()
    error_rate = serializers.SerializerMethodField()
    
    class Meta:
        model = EndpointUsage
        fields = [
            'id', 'endpoint', 'method', 'view_name', 'last_accessed',
            'first_accessed', 'total_requests', 'total_errors', 'avg_response_time',
            'min_response_time', 'max_response_time', 'is_deprecated',
            'deprecation_date', 'days_since_last_access', 'is_unused', 'error_rate'
        ]
        read_only_fields = [
            'endpoint', 'method', 'view_name', 'last_accessed', 'first_accessed',
            'total_requests', 'total_errors', 'avg_response_time',
            'min_response_time', 'max_response_time'
        ]
    
    def get_error_rate(self, obj):
        if obj.total_requests == 0:
            return 0
        return (obj.total_errors / obj.total_requests) * 100


class EndpointRequestSerializer(serializers.ModelSerializer):
    endpoint = serializers.CharField(source='endpoint_usage.endpoint', read_only=True)
    method = serializers.CharField(source='endpoint_usage.method', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = EndpointRequest
        fields = [
            'id', 'endpoint', 'method', 'timestamp', 'response_time',
            'status_code', 'username', 'ip_address', 'user_agent'
        ]


class SearchQuerySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SearchQuery
        fields = [
            'id', 'query', 'search_type', 'username', 'timestamp',
            'result_count', 'execution_time', 'filters_applied'
        ]


class UserSearchHistorySerializer(serializers.ModelSerializer):
    query = serializers.CharField(source='search_query.query', read_only=True)
    search_type = serializers.CharField(source='search_query.search_type', read_only=True)
    timestamp = serializers.DateTimeField(source='search_query.timestamp', read_only=True)
    
    class Meta:
        model = UserSearchHistory
        fields = [
            'id', 'query', 'search_type', 'timestamp',
            'clicked_result_id', 'clicked_result_type'
        ]


class EndpointUsageSummarySerializer(serializers.Serializer):
    """Serializer for endpoint usage summary statistics."""
    total_endpoints = serializers.IntegerField()
    active_endpoints = serializers.IntegerField()
    unused_endpoints = serializers.IntegerField()
    deprecated_endpoints = serializers.IntegerField()
    total_requests_today = serializers.IntegerField()
    avg_response_time_today = serializers.FloatField()
    error_rate_today = serializers.FloatField()


class SearchSuggestionSerializer(serializers.Serializer):
    """Serializer for search suggestions."""
    query = serializers.CharField()
    frequency = serializers.IntegerField()
    last_used = serializers.DateTimeField()