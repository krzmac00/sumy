from django_filters import rest_framework as filters
from django.db import models
from django.contrib.auth import get_user_model
from rest_framework.filters import OrderingFilter
import json

User = get_user_model()


class UniversalFilterBackend(filters.DjangoFilterBackend):
    """
    Dynamic filter backend that generates filters based on model fields.
    Supports complex queries with Q objects and custom lookup expressions.
    """
    
    def get_filterset_class(self, view, queryset=None):
        """Dynamically generate FilterSet class based on model."""
        if hasattr(view, 'filterset_class') and view.filterset_class:
            return view.filterset_class
        
        if not hasattr(view, 'get_queryset'):
            return None
        
        queryset = queryset or view.get_queryset()
        model = queryset.model
        
        # Generate filter fields based on model fields
        filter_fields = {}
        for field in model._meta.fields:
            field_name = field.name
            field_type = type(field)
            
            # Add appropriate filters based on field type
            if isinstance(field, (models.CharField, models.TextField)):
                filter_fields[f'{field_name}'] = ['exact', 'icontains', 'istartswith']
                filter_fields[f'{field_name}__icontains'] = filters.CharFilter(
                    field_name=field_name, lookup_expr='icontains'
                )
            elif isinstance(field, (models.IntegerField, models.FloatField, models.DecimalField)):
                filter_fields[f'{field_name}'] = ['exact', 'lt', 'lte', 'gt', 'gte']
                filter_fields[f'{field_name}__range'] = filters.RangeFilter(field_name=field_name)
            elif isinstance(field, models.DateTimeField):
                filter_fields[f'{field_name}'] = ['exact', 'lt', 'lte', 'gt', 'gte']
                filter_fields[f'{field_name}__date'] = filters.DateFilter(
                    field_name=field_name, lookup_expr='date'
                )
                filter_fields[f'{field_name}__range'] = filters.DateFromToRangeFilter(
                    field_name=field_name
                )
            elif isinstance(field, models.BooleanField):
                filter_fields[f'{field_name}'] = filters.BooleanFilter(field_name=field_name)
            elif isinstance(field, models.ForeignKey):
                filter_fields[f'{field_name}'] = ['exact']
                filter_fields[f'{field_name}__id'] = filters.NumberFilter(
                    field_name=f'{field_name}__id'
                )
        
        # Create dynamic FilterSet class
        attrs = {
            'Meta': type('Meta', (), {
                'model': model,
                'fields': filter_fields
            })
        }
        
        # Add any custom filters from the filter_fields dict
        for name, filter_instance in filter_fields.items():
            if isinstance(filter_instance, filters.Filter):
                attrs[name] = filter_instance
        
        return type(f'{model.__name__}FilterSet', (filters.FilterSet,), attrs)


class AdvancedOrderingFilter(OrderingFilter):
    """
    Enhanced ordering filter that supports multiple fields and custom sort orders.
    """
    
    def get_ordering(self, request, queryset, view):
        """Get ordering from request with support for multiple fields."""
        ordering = super().get_ordering(request, queryset, view)
        
        # Support for custom sort orders
        custom_ordering = request.query_params.get('custom_sort', None)
        if custom_ordering:
            if custom_ordering == 'most_relevant' and hasattr(queryset.model, 'rank'):
                return ['-rank']
            elif custom_ordering == 'trending' and hasattr(queryset.model, 'calculate_trending_score'):
                # Annotate with trending score and order by it
                from django.db.models import F, ExpressionWrapper, FloatField
                from django.utils import timezone
                from datetime import timedelta
                
                now = timezone.now()
                queryset = queryset.annotate(
                    trending_score=ExpressionWrapper(
                        F('votes') / (F('created_at') - now).total_seconds(),
                        output_field=FloatField()
                    )
                )
                return ['-trending_score']
        
        return ordering


class UniversalFilterSet(filters.FilterSet):
    """
    Base FilterSet with common filters and methods for all models.
    """
    
    # Common search filter
    search = filters.CharFilter(method='filter_search')
    
    # Date range filters
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')
    
    # Complex query support
    q = filters.CharFilter(method='filter_complex_query')
    
    def filter_search(self, queryset, name, value):
        """
        Generic search across text fields.
        Override in subclasses for model-specific search.
        """
        from django.db.models import Q
        
        # Get all text fields
        text_fields = [
            f.name for f in queryset.model._meta.fields
            if isinstance(f, (models.CharField, models.TextField))
        ]
        
        # Build Q object for search
        q_objects = Q()
        for field in text_fields:
            q_objects |= Q(**{f'{field}__icontains': value})
        
        return queryset.filter(q_objects)
    
    def filter_complex_query(self, queryset, name, value):
        """
        Support for complex queries using JSON format.
        Example: {"or": [{"field": "value"}, {"field2__gt": 10}]}
        """
        from django.db.models import Q
        
        try:
            query_dict = json.loads(value)
        except json.JSONDecodeError:
            return queryset
        
        def build_q_object(query_dict):
            if 'or' in query_dict:
                q = Q()
                for item in query_dict['or']:
                    q |= build_q_object(item)
                return q
            elif 'and' in query_dict:
                q = Q()
                for item in query_dict['and']:
                    q &= build_q_object(item)
                return q
            else:
                # Simple key-value pairs
                return Q(**query_dict)
        
        return queryset.filter(build_q_object(query_dict))
    
    class Meta:
        fields = []


# Model-specific FilterSets

class UserFilterSet(UniversalFilterSet):
    """FilterSet for User model with specific filters."""
    
    role = filters.CharFilter(method='filter_role')
    department = filters.CharFilter(field_name='profile__department', lookup_expr='icontains')
    has_profile_picture = filters.BooleanFilter(method='filter_has_profile_picture')
    is_active = filters.BooleanFilter(field_name='is_active')
    date_joined_range = filters.DateFromToRangeFilter(field_name='date_joined')
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser'
        ]
    
    def filter_role(self, queryset, name, value):
        """Filter by user role (student, lecturer, admin)."""
        role_map = {
            'student': {'is_student': True},
            'lecturer': {'is_lecturer': True},
            'admin': {'is_staff': True}
        }
        
        if value.lower() in role_map:
            return queryset.filter(**role_map[value.lower()])
        return queryset
    
    def filter_has_profile_picture(self, queryset, name, value):
        """Filter users with/without profile pictures."""
        if value:
            return queryset.exclude(profile__profile_picture='')
        else:
            return queryset.filter(profile__profile_picture='')
    
    def filter_search(self, queryset, name, value):
        """Search across user fields."""
        from django.db.models import Q
        
        return queryset.filter(
            Q(username__icontains=value) |
            Q(email__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value)
        )


class ThreadFilterSet(UniversalFilterSet):
    """FilterSet for Thread model."""
    
    category = filters.CharFilter(field_name='category')
    author = filters.NumberFilter(field_name='user__id')
    author_username = filters.CharFilter(field_name='user__username', lookup_expr='icontains')
    is_pinned = filters.BooleanFilter(field_name='is_pinned')
    has_votes = filters.BooleanFilter(method='filter_has_votes')
    min_votes = filters.NumberFilter(field_name='votes', lookup_expr='gte')
    max_votes = filters.NumberFilter(field_name='votes', lookup_expr='lte')
    
    def filter_has_votes(self, queryset, name, value):
        """Filter threads with/without votes."""
        if value:
            return queryset.filter(votes__gt=0)
        else:
            return queryset.filter(votes=0)
    
    def filter_search(self, queryset, name, value):
        """Search in thread title and content."""
        from django.db.models import Q
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(content__icontains=value)
        )
    
    class Meta:
        model = None  # Set by view
        fields = ['category', 'is_pinned', 'user']


class PostFilterSet(UniversalFilterSet):
    """FilterSet for Post model."""
    
    thread = filters.NumberFilter(field_name='thread__id')
    author = filters.NumberFilter(field_name='user__id')
    has_votes = filters.BooleanFilter(method='filter_has_votes')
    
    def filter_has_votes(self, queryset, name, value):
        """Filter posts with/without votes."""
        if value:
            return queryset.filter(votes__gt=0)
        else:
            return queryset.filter(votes=0)
    
    def filter_search(self, queryset, name, value):
        """Search in post content."""
        return queryset.filter(content__icontains=value)
    
    class Meta:
        model = None  # Set by view
        fields = ['thread', 'user']


class EventFilterSet(UniversalFilterSet):
    """FilterSet for Event model."""
    
    category = filters.MultipleChoiceFilter(field_name='category')
    date_from = filters.DateFilter(field_name='start__date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='end__date', lookup_expr='lte')
    location = filters.CharFilter(field_name='location', lookup_expr='icontains')
    organizer = filters.NumberFilter(field_name='user__id')
    
    def filter_search(self, queryset, name, value):
        """Search in event title and description."""
        from django.db.models import Q
        
        return queryset.filter(
            Q(title__icontains=value) |
            Q(description__icontains=value) |
            Q(location__icontains=value)
        )
    
    class Meta:
        model = None  # Set by view
        fields = ['category', 'user']