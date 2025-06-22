import django_filters
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, time
from .post import Thread


class ThreadFilter(django_filters.FilterSet):
    """Filter for Thread model with advanced filtering options"""
    
    # Text search
    search = django_filters.CharFilter(method='search_filter', label='Search')
    
    # Category filter
    category = django_filters.CharFilter(field_name='category', lookup_expr='exact')
    
    # Date filters
    date_from = django_filters.DateFilter(method='filter_date_from', label='Date from')
    date_to = django_filters.DateFilter(method='filter_date_to', label='Date to')
    
    # Sort by options
    ordering = django_filters.OrderingFilter(
        fields=(
            ('created_date', 'created'),
            ('last_activity_date', 'activity'),
            ('vote_count_cache', 'votes'),
            ('post_count', 'posts'),
            ('title', 'title'),
        ),
        field_labels={
            'created_date': 'Creation date',
            'last_activity_date': 'Last activity',
            'vote_count_cache': 'Vote count',
            'post_count': 'Post count',
            'title': 'Title',
        }
    )
    
    # Vote count range
    min_votes = django_filters.NumberFilter(field_name='vote_count_cache', lookup_expr='gte')
    max_votes = django_filters.NumberFilter(field_name='vote_count_cache', lookup_expr='lte')
    
    # Post count range
    min_posts = django_filters.NumberFilter(field_name='post_count', lookup_expr='gte')
    max_posts = django_filters.NumberFilter(field_name='post_count', lookup_expr='lte')
    
    # Boolean filters
    can_be_answered = django_filters.BooleanFilter(field_name='can_be_answered')
    visible_for_teachers = django_filters.BooleanFilter(field_name='visible_for_teachers')
    
    # Author filter
    author = django_filters.CharFilter(field_name='author__login', lookup_expr='icontains')
    is_anonymous = django_filters.BooleanFilter(field_name='is_anonymous')
    
    class Meta:
        model = Thread
        fields = ['category', 'can_be_answered', 'visible_for_teachers', 'is_anonymous']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set default ordering if none provided
        if 'ordering' not in self.data:
            self.data = self.data.copy()
            self.data['ordering'] = '-activity'
    
    def search_filter(self, queryset, name, value):
        """Custom search filter that searches in title and content"""
        return queryset.filter(
            Q(title__icontains=value) | Q(content__icontains=value)
        )
    
    def filter_date_from(self, queryset, name, value):
        """Filter threads created on or after the given date"""
        if value:
            # Convert date to timezone-aware datetime at start of day
            start_datetime = timezone.make_aware(
                datetime.combine(value, time.min)
            )
            return queryset.filter(created_date__gte=start_datetime)
        return queryset
    
    def filter_date_to(self, queryset, name, value):
        """Filter threads created on or before the given date"""
        if value:
            # Convert date to timezone-aware datetime at end of day
            end_datetime = timezone.make_aware(
                datetime.combine(value, time.max)
            )
            return queryset.filter(created_date__lte=end_datetime)
        return queryset