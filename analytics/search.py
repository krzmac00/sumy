import time
from django.contrib.postgres.search import (
    SearchVector, SearchQuery, SearchRank, TrigramSimilarity
)
from django.contrib.auth import get_user_model
from django.db.models import Q, F, Value, CharField
from django.db.models.functions import Concat
from django.utils import timezone
from mainapp.models import Thread, Post
from news.models import NewsItem
from noticeboard.models import Advertisement
from .models import SearchQuery as SearchQueryModel, UserSearchHistory

User = get_user_model()


class SearchService:
    """Service for advanced search functionality across multiple models."""
    
    @staticmethod
    def search_users(query, filters=None, user=None):
        """
        Advanced user search with full-text search and fuzzy matching.
        
        Args:
            query: Search query string
            filters: Dict of filters (role, department, etc.)
            user: User performing the search (for history tracking)
        
        Returns:
            QuerySet of matching users with relevance scores
        """
        start_time = time.time()
        
        # Create search vector for full-text search
        search_vector = SearchVector(
            'first_name', weight='A'
        ) + SearchVector(
            'last_name', weight='A'
        ) + SearchVector(
            'email', weight='B'
        ) + SearchVector(
            'username', weight='B'
        )
        
        # Create search query
        search_query = SearchQuery(query)
        
        # Start with base queryset
        queryset = User.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        )
        
        # Apply full-text search
        queryset = queryset.filter(search=search_query)
        
        # If no results, try fuzzy matching
        if not queryset.exists():
            # Combine first and last name for similarity matching
            queryset = User.objects.annotate(
                full_name=Concat('first_name', Value(' '), 'last_name', output_field=CharField()),
                name_similarity=TrigramSimilarity('full_name', query),
                email_similarity=TrigramSimilarity('email', query),
                username_similarity=TrigramSimilarity('username', query)
            ).filter(
                Q(name_similarity__gt=0.3) |
                Q(email_similarity__gt=0.3) |
                Q(username_similarity__gt=0.3)
            ).order_by('-name_similarity', '-email_similarity')
        else:
            queryset = queryset.order_by('-rank')
        
        # Apply filters if provided
        if filters:
            if 'role' in filters:
                role_field = f"is_{filters['role']}"
                if hasattr(User, role_field):
                    queryset = queryset.filter(**{role_field: True})
            
            if 'is_active' in filters:
                queryset = queryset.filter(is_active=filters['is_active'])
        
        # Select related profile data
        queryset = queryset.select_related('profile')
        
        # Track search query
        execution_time = (time.time() - start_time) * 1000
        if user and user.is_authenticated:
            search_record = SearchQueryModel.objects.create(
                query=query,
                search_type='user',
                user=user,
                result_count=queryset.count(),
                execution_time=execution_time,
                filters_applied=filters or {}
            )
            
            # Create user search history entry
            UserSearchHistory.objects.create(
                user=user,
                search_query=search_record
            )
        
        return queryset
    
    @staticmethod
    def search_threads(query, filters=None, user=None):
        """
        Advanced thread search with full-text search in title and content.
        
        Args:
            query: Search query string
            filters: Dict of filters (category, author, date_range, etc.)
            user: User performing the search
        
        Returns:
            QuerySet of matching threads with relevance scores
        """
        start_time = time.time()
        
        # Create search vector combining title and content
        search_vector = SearchVector(
            'title', weight='A'
        ) + SearchVector(
            'content', weight='B'
        )
        
        # Create search query
        search_query = SearchQuery(query)
        
        # Start with base queryset
        queryset = Thread.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        ).filter(search=search_query).order_by('-rank', '-created_at')
        
        # Apply filters
        if filters:
            if 'category' in filters:
                queryset = queryset.filter(category=filters['category'])
            
            if 'author' in filters:
                queryset = queryset.filter(user__id=filters['author'])
            
            if 'date_from' in filters:
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            
            if 'date_to' in filters:
                queryset = queryset.filter(created_at__lte=filters['date_to'])
            
            if 'is_pinned' in filters:
                queryset = queryset.filter(is_pinned=filters['is_pinned'])
            
            if 'has_votes' in filters and filters['has_votes']:
                queryset = queryset.filter(votes__gt=0)
        
        # Optimize with select_related and prefetch_related
        queryset = queryset.select_related('user').prefetch_related(
            'posts__user',
            'pinned_threads'
        )
        
        # Track search query
        execution_time = (time.time() - start_time) * 1000
        if user and user.is_authenticated:
            search_record = SearchQueryModel.objects.create(
                query=query,
                search_type='thread',
                user=user,
                result_count=queryset.count(),
                execution_time=execution_time,
                filters_applied=filters or {}
            )
            
            UserSearchHistory.objects.create(
                user=user,
                search_query=search_record
            )
        
        return queryset
    
    @staticmethod
    def search_posts(query, filters=None, user=None):
        """Search within posts."""
        start_time = time.time()
        
        search_vector = SearchVector('content', weight='A')
        search_query = SearchQuery(query)
        
        queryset = Post.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        ).filter(search=search_query).order_by('-rank', '-created_at')
        
        # Apply filters
        if filters:
            if 'thread' in filters:
                queryset = queryset.filter(thread__id=filters['thread'])
            
            if 'author' in filters:
                queryset = queryset.filter(user__id=filters['author'])
            
            if 'date_from' in filters:
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            
            if 'date_to' in filters:
                queryset = queryset.filter(created_at__lte=filters['date_to'])
        
        # Optimize queries
        queryset = queryset.select_related('user', 'thread')
        
        # Track search
        execution_time = (time.time() - start_time) * 1000
        if user and user.is_authenticated:
            SearchQueryModel.objects.create(
                query=query,
                search_type='post',
                user=user,
                result_count=queryset.count(),
                execution_time=execution_time,
                filters_applied=filters or {}
            )
        
        return queryset
    
    @staticmethod
    def search_news(query, filters=None, user=None):
        """Search news articles."""
        start_time = time.time()
        
        search_vector = SearchVector(
            'title', weight='A'
        ) + SearchVector(
            'content', weight='B'
        )
        
        search_query = SearchQuery(query)
        
        queryset = NewsItem.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        ).filter(search=search_query).order_by('-rank', '-created_at')
        
        # Apply filters
        if filters:
            if 'category' in filters:
                queryset = queryset.filter(categories__id=filters['category'])
            
            if 'author' in filters:
                queryset = queryset.filter(author__id=filters['author'])
            
            if 'date_from' in filters:
                queryset = queryset.filter(created_at__gte=filters['date_from'])
            
            if 'date_to' in filters:
                queryset = queryset.filter(created_at__lte=filters['date_to'])
        
        # Optimize queries
        queryset = queryset.select_related('author', 'category')
        
        # Track search
        execution_time = (time.time() - start_time) * 1000
        if user and user.is_authenticated:
            SearchQueryModel.objects.create(
                query=query,
                search_type='news',
                user=user,
                result_count=queryset.count(),
                execution_time=execution_time,
                filters_applied=filters or {}
            )
        
        return queryset
    
    @staticmethod
    def search_notices(query, filters=None, user=None):
        """Search noticeboard posts."""
        start_time = time.time()
        
        search_vector = SearchVector(
            'title', weight='A'
        ) + SearchVector(
            'content', weight='B'
        ) + SearchVector(
            'location', weight='C'
        )
        
        search_query = SearchQuery(query)
        
        queryset = Advertisement.objects.annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query)
        ).filter(search=search_query).order_by('-rank', '-created_date')
        
        # Apply filters
        if filters:
            if 'category' in filters:
                queryset = queryset.filter(category=filters['category'])
            
            if 'price_min' in filters:
                queryset = queryset.filter(price__gte=filters['price_min'])
            
            if 'price_max' in filters:
                queryset = queryset.filter(price__lte=filters['price_max'])
            
            if 'location' in filters:
                queryset = queryset.filter(location__icontains=filters['location'])
        
        # Only show active posts
        queryset = queryset.filter(expires_at__gt=timezone.now())
        
        # Optimize queries
        queryset = queryset.select_related('author')
        
        # Track search
        execution_time = (time.time() - start_time) * 1000
        if user and user.is_authenticated:
            SearchQueryModel.objects.create(
                query=query,
                search_type='notice',
                user=user,
                result_count=queryset.count(),
                execution_time=execution_time,
                filters_applied=filters or {}
            )
        
        return queryset
    
    @staticmethod
    def multi_search(query, search_types=None, limit_per_type=5, user=None):
        """
        Search across multiple content types.
        
        Args:
            query: Search query string
            search_types: List of types to search (default: all)
            limit_per_type: Max results per type
            user: User performing the search
        
        Returns:
            Dict with results organized by type
        """
        if not search_types:
            search_types = ['user', 'thread', 'post', 'news', 'notice']
        
        results = {}
        
        if 'user' in search_types:
            results['users'] = SearchService.search_users(query, user=user)[:limit_per_type]
        
        if 'thread' in search_types:
            results['threads'] = SearchService.search_threads(query, user=user)[:limit_per_type]
        
        if 'post' in search_types:
            results['posts'] = SearchService.search_posts(query, user=user)[:limit_per_type]
        
        if 'news' in search_types:
            results['news'] = SearchService.search_news(query, user=user)[:limit_per_type]
        
        if 'notice' in search_types:
            results['notices'] = SearchService.search_notices(query, user=user)[:limit_per_type]
        
        return results