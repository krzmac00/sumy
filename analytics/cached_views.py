"""
Example implementations showing how to add caching to existing views.
"""

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from .cache_service import CacheService, cache_response, cache_method, CachedCounter
from .mixins import OptimizedModelViewSet


class CachedThreadViewSet(OptimizedModelViewSet):
    """Example of a cached thread viewset."""
    
    # Cache list view for 5 minutes
    @method_decorator(cache_page(60 * 5))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    # Cache retrieve view with custom logic
    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        cache_key = CacheService.make_key(CacheService.PREFIX_THREAD, pk)
        
        # Try cache first
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        # Get fresh data
        response = super().retrieve(request, *args, **kwargs)
        
        # Cache for 10 minutes
        if response.status_code == 200:
            cache.set(cache_key, response.data, CacheService.TIMEOUT_MEDIUM)
        
        return response
    
    def perform_update(self, serializer):
        """Invalidate cache on update."""
        super().perform_update(serializer)
        CacheService.invalidate_thread(serializer.instance.pk)
    
    def perform_destroy(self, instance):
        """Invalidate cache on delete."""
        thread_id = instance.pk
        super().perform_destroy(instance)
        CacheService.invalidate_thread(thread_id)
    
    @action(detail=True, methods=['post'])
    @cache_response(timeout=60)  # Cache for 1 minute
    def vote(self, request, pk=None):
        """Vote on a thread with caching."""
        thread = self.get_object()
        
        # Use cached counter for votes
        counter = CachedCounter(f'thread_votes:{pk}')
        counter.increment()
        
        # Sync to database if needed
        if counter.should_sync():
            thread.votes = counter.get()
            thread.save(update_fields=['votes'])
            counter.mark_synced()
        
        return Response({'votes': counter.get()})


class CachedSearchView(APIView):
    """Example of cached search implementation."""
    
    @cache_response(timeout=300, vary_on_user=False)
    def get(self, request):
        """Cached search endpoint."""
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', 'all')
        
        # Generate cache key for search
        cache_key, timeout = CacheService.cached_search(
            search_type, query, request.query_params.dict()
        )
        
        # Check cache
        cached_results = cache.get(cache_key)
        if cached_results:
            return Response(cached_results)
        
        # Perform search (your search logic here)
        results = self.perform_search(query, search_type)
        
        # Cache results
        cache.set(cache_key, results, timeout)
        
        return Response(results)


class CachedNewsViewSet(OptimizedModelViewSet):
    """Example with view count tracking using cache."""
    
    def retrieve(self, request, *args, **kwargs):
        """Track view count efficiently using cache."""
        response = super().retrieve(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Track view count in cache
            article_id = kwargs.get('pk')
            counter = CachedCounter(f'news_views:{article_id}')
            views = counter.increment()
            
            # Add view count to response
            response.data['view_count'] = views
            
            # Sync to database periodically
            if counter.should_sync():
                from news.models import NewsArticle
                NewsArticle.objects.filter(pk=article_id).update(
                    view_count=views
                )
                counter.mark_synced()
        
        return response


# Mixin for easy cache integration
class CacheInvalidationMixin:
    """
    Mixin to automatically invalidate cache on mutations.
    Add this to your existing viewsets.
    """
    
    # Override in subclass
    cache_prefix = None
    cache_timeout = CacheService.TIMEOUT_MEDIUM
    
    def get_cache_key(self, obj=None):
        """Generate cache key for object."""
        if not self.cache_prefix:
            self.cache_prefix = self.queryset.model.__name__.lower()
        
        if obj:
            return CacheService.make_key(self.cache_prefix, obj.pk)
        return CacheService.make_key(self.cache_prefix, 'list')
    
    def perform_create(self, serializer):
        """Invalidate list cache on create."""
        super().perform_create(serializer)
        cache.delete(self.get_cache_key())
    
    def perform_update(self, serializer):
        """Invalidate object cache on update."""
        super().perform_update(serializer)
        cache.delete(self.get_cache_key(serializer.instance))
        cache.delete(self.get_cache_key())
    
    def perform_destroy(self, instance):
        """Invalidate caches on delete."""
        cache.delete(self.get_cache_key(instance))
        cache.delete(self.get_cache_key())
        super().perform_destroy(instance)


# Example usage in settings.py for conditional caching
"""
# Add to settings.py:

# Cache configuration for development (using dummy cache)
if DEBUG:
    CACHES['default'] = {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }

# View-level cache settings
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 600
CACHE_MIDDLEWARE_KEY_PREFIX = 'sumy'

# Add cache middleware for anonymous users
MIDDLEWARE.insert(0, 'django.middleware.cache.UpdateCacheMiddleware')
MIDDLEWARE.append('django.middleware.cache.FetchFromCacheMiddleware')
"""