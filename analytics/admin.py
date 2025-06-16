from django.contrib import admin
from django.utils.html import format_html
from .models import EndpointUsage, EndpointRequest, SearchQuery, UserSearchHistory


@admin.register(EndpointUsage)
class EndpointUsageAdmin(admin.ModelAdmin):
    list_display = [
        'endpoint', 'method', 'last_accessed', 'total_requests', 
        'avg_response_time_ms', 'error_rate', 'status_indicator', 'is_deprecated'
    ]
    list_filter = ['method', 'is_deprecated', 'last_accessed']
    search_fields = ['endpoint', 'view_name']
    readonly_fields = [
        'endpoint', 'method', 'view_name', 'first_accessed', 'last_accessed',
        'total_requests', 'total_errors', 'avg_response_time', 'min_response_time',
        'max_response_time', 'days_since_last_access', 'is_unused'
    ]
    date_hierarchy = 'last_accessed'
    actions = ['mark_as_deprecated', 'mark_as_active']
    
    def avg_response_time_ms(self, obj):
        return f"{obj.avg_response_time:.2f} ms"
    avg_response_time_ms.short_description = 'Avg Response Time'
    avg_response_time_ms.admin_order_field = 'avg_response_time'
    
    def error_rate(self, obj):
        if obj.total_requests == 0:
            return "0%"
        rate = (obj.total_errors / obj.total_requests) * 100
        return f"{rate:.1f}%"
    error_rate.short_description = 'Error Rate'
    
    def status_indicator(self, obj):
        if obj.is_unused:
            return format_html('<span style="color: red;">⚠️ Unused</span>')
        elif obj.days_since_last_access > 7:
            return format_html('<span style="color: orange;">⚡ Low Usage</span>')
        else:
            return format_html('<span style="color: green;">✅ Active</span>')
    status_indicator.short_description = 'Status'
    
    def mark_as_deprecated(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_deprecated=True, deprecation_date=timezone.now())
        self.message_user(request, f"{queryset.count()} endpoints marked as deprecated.")
    mark_as_deprecated.short_description = "Mark selected endpoints as deprecated"
    
    def mark_as_active(self, request, queryset):
        queryset.update(is_deprecated=False, deprecation_date=None)
        self.message_user(request, f"{queryset.count()} endpoints marked as active.")
    mark_as_active.short_description = "Mark selected endpoints as active"


@admin.register(EndpointRequest)
class EndpointRequestAdmin(admin.ModelAdmin):
    list_display = ['endpoint_usage', 'timestamp', 'response_time', 'status_code', 'user', 'ip_address']
    list_filter = ['status_code', 'timestamp']
    search_fields = ['endpoint_usage__endpoint', 'user__email', 'ip_address']
    date_hierarchy = 'timestamp'
    raw_id_fields = ['user']


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query', 'search_type', 'user', 'timestamp', 'result_count', 'execution_time']
    list_filter = ['search_type', 'timestamp']
    search_fields = ['query', 'user__email']
    date_hierarchy = 'timestamp'
    raw_id_fields = ['user']


@admin.register(UserSearchHistory)
class UserSearchHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'search_query', 'clicked_result_id', 'clicked_result_type']
    list_filter = ['clicked_result_type']
    search_fields = ['user__email', 'search_query__query']
    raw_id_fields = ['user', 'search_query']
