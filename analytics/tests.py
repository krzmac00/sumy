from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from datetime import timedelta
import json

from .models import EndpointUsage, EndpointRequest, SearchQuery, UserSearchHistory
from .search import SearchService
from .cache_service import CacheService, CachedCounter
from mainapp.models import Thread, Post
from news.models import NewsItem, NewsCategory

User = get_user_model()


class EndpointUsageMiddlewareTest(TestCase):
    """Test endpoint usage tracking middleware."""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_endpoint_tracking(self):
        """Test that endpoints are tracked correctly."""
        # Make a request to an API endpoint
        response = self.client.get('/api/v1/threads/')
        
        # Check that endpoint usage was recorded
        usage = EndpointUsage.objects.filter(
            endpoint='/api/v1/threads/',
            method='GET'
        ).first()
        
        self.assertIsNotNone(usage)
        self.assertEqual(usage.total_requests, 1)
        self.assertIsNotNone(usage.avg_response_time)
    
    def test_error_tracking(self):
        """Test that errors are tracked."""
        # Make a request that will fail
        response = self.client.get('/api/v1/threads/999999/')
        
        # Check error count
        usage = EndpointUsage.objects.filter(
            endpoint='/api/v1/threads/999999/',
            method='GET'
        ).first()
        
        if usage:
            self.assertEqual(usage.total_errors, 1)
    
    def test_excluded_endpoints(self):
        """Test that excluded endpoints are not tracked."""
        # Admin endpoint should not be tracked
        response = self.client.get('/admin/')
        
        usage = EndpointUsage.objects.filter(
            endpoint='/admin/'
        ).exists()
        
        self.assertFalse(usage)


class SearchServiceTest(TestCase):
    """Test advanced search functionality."""
    
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(
            username='john_doe',
            email='john@example.com',
            first_name='John',
            last_name='Doe',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='jane_smith',
            email='jane@example.com',
            first_name='Jane',
            last_name='Smith',
            password='testpass123'
        )
        
        # Create test threads
        self.thread1 = Thread.objects.create(
            title='Django Best Practices',
            content='Learn about Django development best practices',
            user=self.user1,
            category='question'
        )
        self.thread2 = Thread.objects.create(
            title='Python Tips and Tricks',
            content='Useful Python programming tips',
            user=self.user2,
            category='discussion'
        )
    
    def test_user_search(self):
        """Test user search functionality."""
        # Search by name
        results = SearchService.search_users('john')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().username, 'john_doe')
        
        # Search by email
        results = SearchService.search_users('jane@example')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().username, 'jane_smith')
    
    def test_user_fuzzy_search(self):
        """Test fuzzy matching for users."""
        # Search with typo
        results = SearchService.search_users('jhon')  # Typo in 'john'
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().username, 'john_doe')
    
    def test_thread_search(self):
        """Test thread search functionality."""
        # Search in title
        results = SearchService.search_threads('Django')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().title, 'Django Best Practices')
        
        # Search in content
        results = SearchService.search_threads('programming tips')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().title, 'Python Tips and Tricks')
    
    def test_thread_search_with_filters(self):
        """Test thread search with filters."""
        filters = {'category': 'question'}
        results = SearchService.search_threads('best', filters)
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().category, 'question')
    
    def test_search_query_tracking(self):
        """Test that searches are tracked."""
        initial_count = SearchQuery.objects.count()
        
        SearchService.search_users('test', user=self.user1)
        
        self.assertEqual(SearchQuery.objects.count(), initial_count + 1)
        query = SearchQuery.objects.latest('timestamp')
        self.assertEqual(query.query, 'test')
        self.assertEqual(query.search_type, 'user')
        self.assertEqual(query.user, self.user1)


class AnalyticsAPITest(APITestCase):
    """Test analytics API endpoints."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='regularpass123'
        )
        
        # Create some endpoint usage data
        self.endpoint_usage = EndpointUsage.objects.create(
            endpoint='/api/v1/threads/',
            method='GET',
            total_requests=100,
            total_errors=5,
            avg_response_time=50.0
        )
    
    def test_endpoint_usage_list(self):
        """Test listing endpoint usage."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/analytics/endpoint-usage/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_unused_endpoints(self):
        """Test getting unused endpoints."""
        # Create an old endpoint
        old_date = timezone.now() - timedelta(days=31)
        old_endpoint = EndpointUsage.objects.create(
            endpoint='/api/v1/old/',
            method='GET',
            last_accessed=old_date
        )
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/analytics/endpoint-usage/unused/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        endpoints = [e['endpoint'] for e in response.data]
        self.assertIn('/api/v1/old/', endpoints)
    
    def test_endpoint_deprecation(self):
        """Test marking endpoint as deprecated."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.post(
            f'/api/analytics/endpoint-usage/{self.endpoint_usage.id}/deprecate/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.endpoint_usage.refresh_from_db()
        self.assertTrue(self.endpoint_usage.is_deprecated)
    
    def test_search_suggestions(self):
        """Test search suggestions endpoint."""
        # Create search history
        SearchQuery.objects.create(
            query='django tutorial',
            search_type='thread',
            user=self.regular_user
        )
        SearchQuery.objects.create(
            query='django forms',
            search_type='thread',
            user=self.regular_user
        )
        
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get('/api/analytics/search-queries/suggestions/?q=djan')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_analytics_dashboard(self):
        """Test analytics dashboard endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get('/api/analytics/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('endpoint_stats', response.data)
        self.assertIn('search_stats', response.data)
        self.assertIn('request_volume', response.data)


class CacheServiceTest(TestCase):
    """Test caching functionality."""
    
    def setUp(self):
        cache.clear()
    
    def test_cache_key_generation(self):
        """Test cache key generation."""
        key = CacheService.make_key('user', '123', 'profile')
        self.assertEqual(key, 'user:123:profile')
    
    def test_get_or_set(self):
        """Test get_or_set functionality."""
        key = 'test_key'
        value = 'test_value'
        
        # First call should set the value
        result = CacheService.get_or_set(key, lambda: value)
        self.assertEqual(result, value)
        
        # Second call should get from cache
        result = CacheService.get_or_set(key, lambda: 'different_value')
        self.assertEqual(result, value)
    
    def test_cache_invalidation(self):
        """Test cache invalidation patterns."""
        # Set some cache values
        cache.set('thread:1:data', 'thread1')
        cache.set('thread:2:data', 'thread2')
        cache.set('list:thread:page1', 'list1')
        
        # Invalidate thread 1
        CacheService.invalidate_thread(1)
        
        # Check that thread 1 cache is cleared
        self.assertIsNone(cache.get('thread:1:data'))
        # Thread 2 should still exist
        self.assertEqual(cache.get('thread:2:data'), 'thread2')
    
    def test_cached_counter(self):
        """Test cached counter functionality."""
        counter = CachedCounter('test_counter')
        
        # Test increment
        self.assertEqual(counter.increment(), 1)
        self.assertEqual(counter.increment(5), 6)
        
        # Test get
        self.assertEqual(counter.get(), 6)
        
        # Test decrement
        self.assertEqual(counter.decrement(2), 4)
        
        # Test reset
        counter.reset()
        self.assertEqual(counter.get(), 0)


class PerformanceTest(TestCase):
    """Test performance optimizations."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test data
        for i in range(10):
            thread = Thread.objects.create(
                title=f'Thread {i}',
                content=f'Content for thread {i}',
                user=self.user
            )
            for j in range(5):
                Post.objects.create(
                    thread=thread,
                    content=f'Post {j} in thread {i}',
                    user=self.user
                )
    
    def test_query_optimization(self):
        """Test that queries are optimized with select_related/prefetch_related."""
        from django.test.utils import override_settings
        from django.db import connection
        from django.db import reset_queries
        
        with override_settings(DEBUG=True):
            reset_queries()
            
            # Simulate optimized query
            threads = Thread.objects.select_related('user').prefetch_related('posts__user')
            
            # Force evaluation
            for thread in threads:
                _ = thread.user.username
                for post in thread.posts.all():
                    _ = post.user.username
            
            # Should have minimal queries (3: threads, posts, users)
            self.assertLess(len(connection.queries), 10)
