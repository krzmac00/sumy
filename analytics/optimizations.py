"""
Optimized versions of existing viewsets with select_related and prefetch_related.
Import these in your existing apps to replace the current viewsets.
"""

from rest_framework import viewsets
from django.contrib.auth import get_user_model
from mainapp.models import Thread, Post, Event, Vote
from mainapp.serializers import ThreadSerializer, EventSerializer
from mainapp.post import PostSerializer
from news.models import NewsItem, NewsCategory
from news.serializers import NewsItemSerializer
from noticeboard.models import Advertisement, Comment
from noticeboard.serializers import AdvertisementSerializer
from .mixins import OptimizedModelViewSet, OptimizedReadOnlyModelViewSet
from .filters import ThreadFilterSet, PostFilterSet, EventFilterSet, UserFilterSet

User = get_user_model()


class OptimizedUserViewSet(OptimizedModelViewSet):
    """Optimized User ViewSet with proper query optimization."""
    queryset = User.objects.all()
    filterset_class = UserFilterSet
    
    def get_queryset(self):
        """Optimize queries with select_related."""
        return super().get_queryset().select_related('profile')


class OptimizedThreadViewSet(OptimizedModelViewSet):
    """Optimized Thread ViewSet."""
    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    filterset_class = ThreadFilterSet
    
    def get_queryset(self):
        """Optimize with select_related and prefetch_related."""
        return super().get_queryset().select_related(
            'user',
            'user__profile'
        ).prefetch_related(
            'posts__user',
            'posts__user__profile',
            'posts__votes',
            'pinned_threads',
            'votes'
        ).order_by('-created_at')


class OptimizedPostViewSet(OptimizedModelViewSet):
    """Optimized Post ViewSet."""
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    filterset_class = PostFilterSet
    
    def get_queryset(self):
        """Optimize with select_related and prefetch_related."""
        return super().get_queryset().select_related(
            'user',
            'user__profile',
            'thread',
            'thread__user'
        ).prefetch_related(
            'votes'
        ).order_by('created_at')


class OptimizedEventViewSet(OptimizedModelViewSet):
    """Optimized Event ViewSet."""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_class = EventFilterSet
    
    def get_queryset(self):
        """Optimize with select_related."""
        return super().get_queryset().select_related(
            'user',
            'user__profile',
            'schedule_plan'
        ).order_by('-start')


class OptimizedNewsItemViewSet(OptimizedReadOnlyModelViewSet):
    """Optimized NewsItem ViewSet."""
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    
    def get_queryset(self):
        """Optimize with select_related and prefetch_related."""
        return super().get_queryset().select_related(
            'author',
            'author__profile'
        ).prefetch_related(
            'categories',
            'categories__parent',
            'categories__children'
        ).order_by('-created_at')


class OptimizedAdvertisementViewSet(OptimizedModelViewSet):
    """Optimized Advertisement ViewSet."""
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    
    def get_queryset(self):
        """Optimize with select_related and prefetch_related."""
        from django.utils import timezone
        
        # Only show non-expired posts
        queryset = super().get_queryset().filter(
            expires_at__gt=timezone.now()
        )
        
        return queryset.select_related(
            'author',
            'author__profile'
        ).prefetch_related(
            'comments__author',
            'comments__author__profile'
        ).order_by('-created_date')


# Mixin to apply to existing viewsets
class QueryOptimizationMixin:
    """
    Mixin to add query optimization to existing viewsets.
    Add this to your existing viewset classes.
    """
    
    # Define these in your viewset
    select_related_fields = []
    prefetch_related_fields = []
    
    def get_queryset(self):
        """Apply query optimizations."""
        queryset = super().get_queryset()
        
        if self.select_related_fields:
            queryset = queryset.select_related(*self.select_related_fields)
        
        if self.prefetch_related_fields:
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)
        
        return queryset


# Example usage in existing viewsets:
"""
# In mainapp/views.py:

from analytics.optimizations import QueryOptimizationMixin

class ThreadViewSet(QueryOptimizationMixin, viewsets.ModelViewSet):
    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    
    # Add these for optimization
    select_related_fields = ['user', 'user__profile']
    prefetch_related_fields = ['posts__user', 'posts__votes', 'pinned_threads']
"""