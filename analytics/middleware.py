import time
from django.utils import timezone
from django.urls import resolve
from django.db import transaction
from .models import EndpointUsage, EndpointRequest


class EndpointUsageMiddleware:
    """Middleware to track API endpoint usage and performance metrics."""
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Endpoints to exclude from tracking
        self.excluded_patterns = [
            '/admin/',
            '/static/',
            '/media/',
            '/__debug__/',
            '/api/analytics/',  # Avoid tracking analytics endpoints themselves
        ]
    
    def __call__(self, request):
        # Skip tracking for excluded patterns
        if any(request.path.startswith(pattern) for pattern in self.excluded_patterns):
            return self.get_response(request)
        
        # Only track API endpoints
        if not request.path.startswith('/api/'):
            return self.get_response(request)
        
        # Start timing
        start_time = time.time()
        
        # Get the response
        response = self.get_response(request)
        
        # Calculate response time
        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        # Track the usage asynchronously to avoid blocking the response
        self._track_usage(request, response, response_time)
        
        return response
    
    def _track_usage(self, request, response, response_time):
        """Track endpoint usage statistics."""
        try:
            # Resolve the view name
            try:
                resolver_match = resolve(request.path)
                view_name = f"{resolver_match.namespace}:{resolver_match.url_name}" if resolver_match.namespace else resolver_match.url_name
            except:
                view_name = None
            
            # Get or create the endpoint usage record
            with transaction.atomic():
                endpoint_usage, created = EndpointUsage.objects.select_for_update().get_or_create(
                    endpoint=request.path,
                    method=request.method,
                    defaults={
                        'view_name': view_name,
                        'first_accessed': timezone.now(),
                    }
                )
                
                # Update statistics
                endpoint_usage.last_accessed = timezone.now()
                endpoint_usage.total_requests += 1
                
                # Update error count
                if response.status_code >= 400:
                    endpoint_usage.total_errors += 1
                
                # Update response time statistics
                if endpoint_usage.min_response_time is None or response_time < endpoint_usage.min_response_time:
                    endpoint_usage.min_response_time = response_time
                
                if endpoint_usage.max_response_time is None or response_time > endpoint_usage.max_response_time:
                    endpoint_usage.max_response_time = response_time
                
                # Calculate new average response time
                total_time = endpoint_usage.avg_response_time * (endpoint_usage.total_requests - 1) + response_time
                endpoint_usage.avg_response_time = total_time / endpoint_usage.total_requests
                
                endpoint_usage.save()
                
                # Create detailed request log (only keep last 1000 requests per endpoint)
                request_count = EndpointRequest.objects.filter(endpoint_usage=endpoint_usage).count()
                if request_count >= 1000:
                    # Delete oldest requests to maintain limit
                    oldest_requests = EndpointRequest.objects.filter(
                        endpoint_usage=endpoint_usage
                    ).order_by('timestamp')[:request_count - 999]
                    EndpointRequest.objects.filter(
                        id__in=[req.id for req in oldest_requests]
                    ).delete()
                
                # Create new request log
                EndpointRequest.objects.create(
                    endpoint_usage=endpoint_usage,
                    timestamp=timezone.now(),
                    response_time=response_time,
                    status_code=response.status_code,
                    user=request.user if request.user.is_authenticated else None,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],  # Limit user agent length
                )
                
        except Exception as e:
            # Log the error but don't break the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error tracking endpoint usage: {str(e)}")
    
    def _get_client_ip(self, request):
        """Get the client's IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip