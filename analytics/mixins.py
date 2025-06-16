from django.core.cache import cache
from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .filters import UniversalFilterBackend, AdvancedOrderingFilter
import hashlib
import json


class OptimizedPagination(PageNumberPagination):
    """Customizable pagination with sensible defaults."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CacheKeyMixin:
    """Mixin to generate cache keys for viewsets."""
    
    def get_cache_key(self, request, view_name=None):
        """Generate a unique cache key based on request parameters."""
        key_parts = [
            view_name or self.__class__.__name__,
            request.get_full_path(),
            str(request.user.id) if request.user.is_authenticated else 'anon'
        ]
        
        # Include request body for POST requests
        if request.method == 'POST' and request.body:
            key_parts.append(hashlib.md5(request.body).hexdigest())
        
        return hashlib.md5(':'.join(key_parts).encode()).hexdigest()


class SelectRelatedMixin:
    """
    Mixin to automatically apply select_related and prefetch_related
    based on serializer fields.
    """
    
    def get_queryset(self):
        """Apply optimizations to queryset."""
        queryset = super().get_queryset()
        
        # Get serializer class
        serializer_class = self.get_serializer_class()
        if not serializer_class:
            return queryset
        
        # Extract related fields from serializer
        select_related = []
        prefetch_related = []
        
        if hasattr(serializer_class.Meta, 'select_related'):
            select_related = serializer_class.Meta.select_related
        
        if hasattr(serializer_class.Meta, 'prefetch_related'):
            prefetch_related = serializer_class.Meta.prefetch_related
        
        # Auto-detect relations if not specified
        if not select_related and not prefetch_related:
            select_related, prefetch_related = self._auto_detect_relations(serializer_class)
        
        # Apply optimizations
        if select_related:
            queryset = queryset.select_related(*select_related)
        
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        return queryset
    
    def _auto_detect_relations(self, serializer_class):
        """Auto-detect relations from serializer fields."""
        select_related = []
        prefetch_related = []
        
        # This is a simplified version - in production you'd want more sophisticated detection
        fields = serializer_class._declared_fields
        
        for field_name, field in fields.items():
            # Check for nested serializers which indicate relations
            if hasattr(field, 'queryset') or hasattr(field, 'child_relation'):
                # Determine if it's a ForeignKey or ManyToMany
                model = self.get_queryset().model
                if hasattr(model, field_name):
                    model_field = model._meta.get_field(field_name)
                    if model_field.many_to_one or model_field.one_to_one:
                        select_related.append(field_name)
                    elif model_field.many_to_many or model_field.one_to_many:
                        prefetch_related.append(field_name)
        
        return select_related, prefetch_related


class BulkOperationsMixin:
    """Mixin to support bulk create, update, and delete operations."""
    
    def get_serializer(self, *args, **kwargs):
        """Support bulk operations by setting many=True when needed."""
        if self.request and self.request.method in ['POST', 'PUT', 'PATCH']:
            data = kwargs.get('data', self.request.data)
            if isinstance(data, list):
                kwargs['many'] = True
        return super().get_serializer(*args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Support bulk create."""
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return Response(serializer.data, status=201)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        """Support bulk update."""
        if isinstance(request.data, list):
            # Bulk update logic
            instances = []
            for item in request.data:
                instance = self.get_queryset().get(pk=item['id'])
                serializer = self.get_serializer(instance, data=item, partial=True)
                serializer.is_valid(raise_exception=True)
                instances.append(serializer.save())
            
            serializer = self.get_serializer(instances, many=True)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)


class FieldSelectionMixin:
    """
    Mixin to allow clients to select specific fields in the response.
    Usage: ?fields=id,name,email
    """
    
    def get_serializer_class(self):
        """Dynamically modify serializer based on field selection."""
        serializer_class = super().get_serializer_class()
        
        fields_param = self.request.query_params.get('fields', None)
        if not fields_param:
            return serializer_class
        
        # Create a new serializer class with only selected fields
        fields = fields_param.split(',')
        
        class FieldSelectedSerializer(serializer_class):
            class Meta(serializer_class.Meta):
                fields = fields
        
        return FieldSelectedSerializer


class CachedViewMixin(CacheKeyMixin):
    """Mixin to add caching support to viewsets."""
    
    cache_timeout = 300  # 5 minutes default
    cache_key_prefix = 'api'
    
    def list(self, request, *args, **kwargs):
        """Cache list responses."""
        if request.method != 'GET':
            return super().list(request, *args, **kwargs)
        
        # Generate cache key
        cache_key = f"{self.cache_key_prefix}:{self.get_cache_key(request, 'list')}"
        
        # Try to get from cache
        cached_response = cache.get(cache_key)
        if cached_response:
            return Response(cached_response)
        
        # Get fresh data
        response = super().list(request, *args, **kwargs)
        
        # Cache the response data
        cache.set(cache_key, response.data, self.cache_timeout)
        
        return response
    
    def retrieve(self, request, *args, **kwargs):
        """Cache retrieve responses."""
        if request.method != 'GET':
            return super().retrieve(request, *args, **kwargs)
        
        # Generate cache key
        pk = kwargs.get('pk', '')
        cache_key = f"{self.cache_key_prefix}:{self.get_cache_key(request, f'retrieve:{pk}')}"
        
        # Try to get from cache
        cached_response = cache.get(cache_key)
        if cached_response:
            return Response(cached_response)
        
        # Get fresh data
        response = super().retrieve(request, *args, **kwargs)
        
        # Cache the response data
        cache.set(cache_key, response.data, self.cache_timeout)
        
        return response
    
    def invalidate_cache(self, request=None, pk=None):
        """Invalidate cache for this viewset."""
        # Implement cache invalidation logic
        pass


class OptimizedModelViewSet(
    SelectRelatedMixin,
    BulkOperationsMixin,
    FieldSelectionMixin,
    CachedViewMixin,
    viewsets.ModelViewSet
):
    """
    Optimized base ViewSet with all performance enhancements.
    
    Features:
    - Automatic select_related/prefetch_related
    - Query result caching
    - Bulk operations support
    - Field selection via query params
    - Advanced filtering and ordering
    """
    
    pagination_class = OptimizedPagination
    filter_backends = [UniversalFilterBackend, AdvancedOrderingFilter]
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Invalidate cache on create."""
        super().perform_create(serializer)
        self.invalidate_cache(self.request)
    
    def perform_update(self, serializer):
        """Invalidate cache on update."""
        super().perform_update(serializer)
        self.invalidate_cache(self.request, serializer.instance.pk)
    
    def perform_destroy(self, instance):
        """Invalidate cache on delete."""
        pk = instance.pk
        super().perform_destroy(instance)
        self.invalidate_cache(self.request, pk)


class OptimizedReadOnlyModelViewSet(
    SelectRelatedMixin,
    FieldSelectionMixin,
    CachedViewMixin,
    viewsets.ReadOnlyModelViewSet
):
    """
    Optimized read-only ViewSet for better performance.
    
    Use this for endpoints that only need list and retrieve operations.
    """
    
    pagination_class = OptimizedPagination
    filter_backends = [UniversalFilterBackend, AdvancedOrderingFilter]
    
    def get_serializer_context(self):
        """Add request to serializer context."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class SearchableViewMixin:
    """Mixin to add advanced search capabilities to viewsets."""
    
    search_service = None  # Set this to the appropriate search service
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Perform advanced search."""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'}, status=400)
        
        if not self.search_service:
            return Response({'error': 'Search not configured for this endpoint'}, status=501)
        
        # Extract filters from query params
        filters = {k: v for k, v in request.query_params.items() if k not in ['q', 'page', 'page_size']}
        
        # Perform search
        results = self.search_service(query, filters, request.user)
        
        # Paginate results
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(results, request)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)