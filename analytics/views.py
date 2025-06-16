from django.db.models import Count, Avg, Q, F, Max
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import EndpointUsage, EndpointRequest, SearchQuery, UserSearchHistory
from .serializers import (
    EndpointUsageSerializer, EndpointRequestSerializer,
    SearchQuerySerializer, UserSearchHistorySerializer,
    EndpointUsageSummarySerializer, SearchSuggestionSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow admins to edit analytics."""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_staff


class EndpointUsageViewSet(viewsets.ModelViewSet):
    """ViewSet for endpoint usage analytics."""
    queryset = EndpointUsage.objects.all()
    serializer_class = EndpointUsageSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['method', 'is_deprecated']
    search_fields = ['endpoint', 'view_name']
    ordering_fields = ['last_accessed', 'total_requests', 'avg_response_time']
    ordering = ['-last_accessed']
    
    @action(detail=False, methods=['get'])
    def unused(self, request):
        """Get all unused endpoints (not accessed in 30+ days)."""
        threshold_date = timezone.now() - timedelta(days=30)
        unused_endpoints = self.get_queryset().filter(
            last_accessed__lt=threshold_date
        ).order_by('-total_requests')
        
        serializer = self.get_serializer(unused_endpoints, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for endpoint usage."""
        today = timezone.now().date()
        threshold_date = timezone.now() - timedelta(days=30)
        
        # Calculate statistics
        total_endpoints = EndpointUsage.objects.count()
        active_endpoints = EndpointUsage.objects.filter(
            last_accessed__gte=threshold_date
        ).count()
        unused_endpoints = total_endpoints - active_endpoints
        deprecated_endpoints = EndpointUsage.objects.filter(is_deprecated=True).count()
        
        # Today's statistics
        today_requests = EndpointRequest.objects.filter(
            timestamp__date=today
        )
        total_requests_today = today_requests.count()
        avg_response_time_today = today_requests.aggregate(
            avg=Avg('response_time')
        )['avg'] or 0
        
        # Calculate error rate
        errors_today = today_requests.filter(status_code__gte=400).count()
        error_rate_today = (errors_today / total_requests_today * 100) if total_requests_today > 0 else 0
        
        data = {
            'total_endpoints': total_endpoints,
            'active_endpoints': active_endpoints,
            'unused_endpoints': unused_endpoints,
            'deprecated_endpoints': deprecated_endpoints,
            'total_requests_today': total_requests_today,
            'avg_response_time_today': avg_response_time_today,
            'error_rate_today': error_rate_today,
        }
        
        serializer = EndpointUsageSummarySerializer(data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def deprecate(self, request, pk=None):
        """Mark an endpoint as deprecated."""
        endpoint = self.get_object()
        endpoint.is_deprecated = True
        endpoint.deprecation_date = timezone.now()
        endpoint.save()
        return Response({'status': 'deprecated'})
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Mark an endpoint as active (not deprecated)."""
        endpoint = self.get_object()
        endpoint.is_deprecated = False
        endpoint.deprecation_date = None
        endpoint.save()
        return Response({'status': 'activated'})


class EndpointRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for endpoint request logs."""
    queryset = EndpointRequest.objects.all()
    serializer_class = EndpointRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status_code', 'endpoint_usage']
    search_fields = ['endpoint_usage__endpoint', 'user__username', 'ip_address']
    ordering_fields = ['timestamp', 'response_time', 'status_code']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Limit to last 7 days of data for performance."""
        seven_days_ago = timezone.now() - timedelta(days=7)
        return super().get_queryset().filter(timestamp__gte=seven_days_ago)


class SearchQueryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for search query analytics."""
    queryset = SearchQuery.objects.all()
    serializer_class = SearchQuerySerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['search_type']
    search_fields = ['query']
    ordering_fields = ['timestamp', 'result_count', 'execution_time']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular search queries."""
        search_type = request.query_params.get('search_type', None)
        days = int(request.query_params.get('days', 7))
        limit = int(request.query_params.get('limit', 20))
        
        # Filter by date range
        date_threshold = timezone.now() - timedelta(days=days)
        queries = SearchQuery.objects.filter(timestamp__gte=date_threshold)
        
        # Filter by search type if provided
        if search_type:
            queries = queries.filter(search_type=search_type)
        
        # Group by query and count
        popular_queries = queries.values('query', 'search_type').annotate(
            count=Count('id')
        ).order_by('-count')[:limit]
        
        return Response(popular_queries)
    
    @action(detail=False, methods=['get'])
    def suggestions(self, request):
        """Get search suggestions based on popular queries."""
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('search_type', None)
        limit = int(request.query_params.get('limit', 10))
        
        if len(query) < 2:
            return Response([])
        
        # Find matching queries
        suggestions = SearchQuery.objects.filter(
            query__icontains=query
        )
        
        if search_type:
            suggestions = suggestions.filter(search_type=search_type)
        
        # Group and order by frequency
        suggestions = suggestions.values('query').annotate(
            frequency=Count('id'),
            last_used=Max('timestamp')
        ).order_by('-frequency')[:limit]
        
        serializer = SearchSuggestionSerializer(suggestions, many=True)
        return Response(serializer.data)


class UserSearchHistoryViewSet(viewsets.ModelViewSet):
    """ViewSet for user search history."""
    serializer_class = UserSearchHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return search history for the current user only."""
        return UserSearchHistory.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all search history for the current user."""
        deleted_count = self.get_queryset().delete()[0]
        return Response({
            'status': 'cleared',
            'deleted_count': deleted_count
        })


class AnalyticsDashboardView(APIView):
    """Comprehensive analytics dashboard endpoint."""
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        """Get comprehensive analytics data for dashboard."""
        # Time ranges
        today = timezone.now().date()
        seven_days_ago = timezone.now() - timedelta(days=7)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Endpoint statistics
        endpoint_stats = {
            'total': EndpointUsage.objects.count(),
            'active': EndpointUsage.objects.filter(
                last_accessed__gte=thirty_days_ago
            ).count(),
            'deprecated': EndpointUsage.objects.filter(is_deprecated=True).count(),
            'high_error_rate': EndpointUsage.objects.filter(
                total_requests__gt=100,
                total_errors__gt=F('total_requests') * 0.05  # >5% error rate
            ).count(),
        }
        
        # Top endpoints by requests
        top_endpoints = EndpointUsage.objects.order_by('-total_requests')[:10]
        top_endpoints_data = EndpointUsageSerializer(top_endpoints, many=True).data
        
        # Slowest endpoints
        slowest_endpoints = EndpointUsage.objects.filter(
            total_requests__gt=10
        ).order_by('-avg_response_time')[:10]
        slowest_endpoints_data = EndpointUsageSerializer(slowest_endpoints, many=True).data
        
        # Request volume over time
        request_volume = []
        for i in range(7):
            date = today - timedelta(days=i)
            count = EndpointRequest.objects.filter(
                timestamp__date=date
            ).count()
            request_volume.append({
                'date': date.isoformat(),
                'requests': count
            })
        request_volume.reverse()
        
        # Search statistics
        search_stats = {
            'total_searches': SearchQuery.objects.filter(
                timestamp__gte=seven_days_ago
            ).count(),
            'unique_queries': SearchQuery.objects.filter(
                timestamp__gte=seven_days_ago
            ).values('query').distinct().count(),
            'avg_execution_time': SearchQuery.objects.filter(
                timestamp__gte=seven_days_ago
            ).aggregate(avg=Avg('execution_time'))['avg'] or 0,
        }
        
        # Popular search types
        search_by_type = SearchQuery.objects.filter(
            timestamp__gte=seven_days_ago
        ).values('search_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'endpoint_stats': endpoint_stats,
            'top_endpoints': top_endpoints_data,
            'slowest_endpoints': slowest_endpoints_data,
            'request_volume': request_volume,
            'search_stats': search_stats,
            'search_by_type': search_by_type,
        })