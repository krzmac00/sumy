from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer
from mainapp.serializers import ThreadSerializer
from mainapp.post import PostSerializer
from news.serializers import NewsItemSerializer
from noticeboard.serializers import AdvertisementSerializer
from .search import SearchService
from .models import UserSearchHistory

User = get_user_model()


class UserSearchView(APIView):
    """Advanced search for users."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract filters
        filters = {}
        if 'role' in request.query_params:
            filters['role'] = request.query_params['role']
        if 'is_active' in request.query_params:
            filters['is_active'] = request.query_params['is_active'] == 'true'
        
        # Perform search
        results = SearchService.search_users(query, filters, request.user)
        
        # Paginate results
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_results = results[start:end]
        
        # Serialize results
        serializer = UserSerializer(paginated_results, many=True)
        
        return Response({
            'count': results.count(),
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })


class ThreadSearchView(APIView):
    """Advanced search for threads."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract filters
        filters = {}
        if 'category' in request.query_params:
            filters['category'] = request.query_params['category']
        if 'author' in request.query_params:
            filters['author'] = request.query_params['author']
        if 'date_from' in request.query_params:
            filters['date_from'] = request.query_params['date_from']
        if 'date_to' in request.query_params:
            filters['date_to'] = request.query_params['date_to']
        if 'is_pinned' in request.query_params:
            filters['is_pinned'] = request.query_params['is_pinned'] == 'true'
        if 'has_votes' in request.query_params:
            filters['has_votes'] = request.query_params['has_votes'] == 'true'
        
        # Perform search
        results = SearchService.search_threads(query, filters, request.user)
        
        # Paginate results
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_results = results[start:end]
        
        # Serialize results
        serializer = ThreadSerializer(paginated_results, many=True)
        
        return Response({
            'count': results.count(),
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })


class MultiSearchView(APIView):
    """Search across multiple content types."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get search types
        search_types = request.query_params.getlist('types')
        if not search_types:
            search_types = ['user', 'thread', 'news', 'notice']
        
        limit_per_type = int(request.query_params.get('limit', 5))
        
        # Perform multi-search
        results = SearchService.multi_search(
            query, search_types, limit_per_type, request.user
        )
        
        # Serialize results
        serialized_results = {}
        
        if 'users' in results:
            serialized_results['users'] = UserSerializer(
                results['users'], many=True
            ).data
        
        if 'threads' in results:
            serialized_results['threads'] = ThreadSerializer(
                results['threads'], many=True
            ).data
        
        if 'posts' in results:
            serialized_results['posts'] = PostSerializer(
                results['posts'], many=True
            ).data
        
        if 'news' in results:
            serialized_results['news'] = NewsItemSerializer(
                results['news'], many=True
            ).data
        
        if 'notices' in results:
            serialized_results['notices'] = AdvertisementSerializer(
                results['notices'], many=True
            ).data
        
        return Response({
            'query': query,
            'results': serialized_results
        })


class SearchSuggestionsView(APIView):
    """Get search suggestions based on query history."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type', None)
        
        if len(query) < 2:
            return Response([])
        
        # Use the SearchQueryViewSet's suggestions logic
        from .views import SearchQueryViewSet
        viewset = SearchQueryViewSet()
        viewset.request = request
        return viewset.suggestions(request)


class SearchHistoryView(APIView):
    """Get user's search history."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        history = UserSearchHistory.objects.filter(
            user=request.user
        ).select_related('search_query')[:50]
        
        data = []
        for item in history:
            data.append({
                'id': item.id,
                'query': item.search_query.query,
                'search_type': item.search_query.search_type,
                'timestamp': item.search_query.timestamp,
                'result_count': item.search_query.result_count,
                'clicked_result_id': item.clicked_result_id,
                'clicked_result_type': item.clicked_result_type
            })
        
        return Response(data)
    
    def delete(self, request):
        """Clear search history."""
        deleted_count = UserSearchHistory.objects.filter(
            user=request.user
        ).delete()[0]
        
        return Response({
            'status': 'cleared',
            'deleted_count': deleted_count
        })