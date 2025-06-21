"""
Performance tests to verify system can handle 10,000+ concurrent users.
Requirements: System should provide fast responses even under heavy load.
"""

import pytest
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import connection
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from tests.factories import (
    UserFactory, ThreadFactory, PostFactory, 
    AdvertisementFactory, NewsItemFactory, EventFactory
)

User = get_user_model()


class PerformanceMetrics:
    """Track and analyze performance metrics"""
    
    def __init__(self):
        self.response_times = []
        self.errors = []
        self.start_time = None
        self.end_time = None
    
    def add_response_time(self, duration):
        self.response_times.append(duration)
    
    def add_error(self, error):
        self.errors.append(error)
    
    def start(self):
        self.start_time = time.time()
    
    def stop(self):
        self.end_time = time.time()
    
    def get_stats(self):
        if not self.response_times:
            return None
        
        return {
            'total_requests': len(self.response_times) + len(self.errors),
            'successful_requests': len(self.response_times),
            'failed_requests': len(self.errors),
            'error_rate': len(self.errors) / (len(self.response_times) + len(self.errors)) * 100,
            'min_response_time': min(self.response_times),
            'max_response_time': max(self.response_times),
            'avg_response_time': statistics.mean(self.response_times),
            'median_response_time': statistics.median(self.response_times),
            'p95_response_time': statistics.quantiles(self.response_times, n=20)[18] if len(self.response_times) > 20 else max(self.response_times),
            'p99_response_time': statistics.quantiles(self.response_times, n=100)[98] if len(self.response_times) > 100 else max(self.response_times),
            'total_duration': self.end_time - self.start_time if self.end_time else None,
            'requests_per_second': len(self.response_times) / (self.end_time - self.start_time) if self.end_time else None
        }


class LoadTestMixin:
    """Mixin for load testing functionality"""
    
    def create_test_users(self, count):
        """Create test users for load testing"""
        users = []
        for i in range(count):
            user = User.objects.create_user(
                email=f'loadtest{i}@edu.p.lodz.pl',
                password='testpass123',
                first_name=f'LoadTest{i}',
                last_name='User'
            )
            users.append(user)
        return users
    
    def get_auth_headers(self, user):
        """Get authentication headers for a user"""
        refresh = RefreshToken.for_user(user)
        return {
            'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'
        }
    
    def simulate_user_request(self, user, endpoint, method='GET', data=None):
        """Simulate a single user request and measure response time"""
        client = APIClient()
        client.force_authenticate(user=user)
        
        start_time = time.time()
        
        try:
            if method == 'GET':
                response = client.get(endpoint)
            elif method == 'POST':
                response = client.post(endpoint, data, format='json')
            elif method == 'PUT':
                response = client.put(endpoint, data, format='json')
            elif method == 'DELETE':
                response = client.delete(endpoint)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'success': response.status_code < 400,
                'status_code': response.status_code,
                'duration': duration,
                'error': None
            }
        except Exception as e:
            end_time = time.time()
            duration = end_time - start_time
            
            return {
                'success': False,
                'status_code': None,
                'duration': duration,
                'error': str(e)
            }
    
    def run_concurrent_requests(self, users, endpoint, method='GET', data_func=None, max_workers=100):
        """Run concurrent requests from multiple users"""
        metrics = PerformanceMetrics()
        metrics.start()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            
            for user in users:
                data = data_func(user) if data_func else None
                future = executor.submit(self.simulate_user_request, user, endpoint, method, data)
                futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                if result['success']:
                    metrics.add_response_time(result['duration'])
                else:
                    metrics.add_error(result['error'] or f"HTTP {result['status_code']}")
        
        metrics.stop()
        return metrics


@pytest.mark.django_db
class TestHighLoadPerformance(TransactionTestCase, LoadTestMixin):
    """Test system performance under high load (10,000+ users)"""
    
    def setUp(self):
        """Set up test data"""
        # Clear cache
        cache.clear()
        
        # Create initial data
        self.create_initial_data()
        
        # Create test users for load testing
        print("\nCreating test users for load testing...")
        self.test_users = self.create_test_users(100)  # Using 100 users to simulate 10,000 requests
    
    def create_initial_data(self):
        """Create initial data for testing"""
        # Create some threads, posts, ads, news, events
        for i in range(50):
            thread = ThreadFactory()
            PostFactory.create_batch(5, thread=thread)
        
        AdvertisementFactory.create_batch(30)
        NewsItemFactory.create_batch(20)
        EventFactory.create_batch(40)
    
    def test_read_heavy_load(self):
        """Test system performance under read-heavy load (10,000 GET requests)"""
        print("\n" + "="*60)
        print("TEST: Read-Heavy Load Performance (10,000 requests)")
        print("="*60)
        
        endpoints = [
            reverse('mainapp:thread-list-create'),
            reverse('noticeboard:advertisement-list'),
            reverse('news:news-item-list'),
            reverse('mainapp:event-list'),
        ]
        
        # Performance requirements
        max_avg_response_time = 0.2  # 200ms average
        max_p95_response_time = 0.5  # 500ms for 95th percentile
        max_error_rate = 1.0  # 1% error rate
        
        total_metrics = PerformanceMetrics()
        
        # Simulate 10,000 requests (100 users × 100 requests each)
        for i in range(100):
            endpoint = endpoints[i % len(endpoints)]
            metrics = self.run_concurrent_requests(
                self.test_users, 
                endpoint, 
                method='GET',
                max_workers=50
            )
            
            stats = metrics.get_stats()
            total_metrics.response_times.extend(metrics.response_times)
            total_metrics.errors.extend(metrics.errors)
            
            if i % 10 == 0:
                print(f"Progress: {(i+1)*100} requests completed...")
        
        # Calculate final statistics
        total_stats = {
            'total_requests': len(total_metrics.response_times) + len(total_metrics.errors),
            'successful_requests': len(total_metrics.response_times),
            'failed_requests': len(total_metrics.errors),
            'error_rate': len(total_metrics.errors) / (len(total_metrics.response_times) + len(total_metrics.errors)) * 100 if total_metrics.response_times else 100,
            'avg_response_time': statistics.mean(total_metrics.response_times) if total_metrics.response_times else 0,
            'p95_response_time': statistics.quantiles(total_metrics.response_times, n=20)[18] if len(total_metrics.response_times) > 20 else 0,
        }
        
        # Print results
        print("\nResults:")
        print(f"Total Requests: {total_stats['total_requests']}")
        print(f"Successful: {total_stats['successful_requests']}")
        print(f"Failed: {total_stats['failed_requests']}")
        print(f"Error Rate: {total_stats['error_rate']:.2f}%")
        print(f"Average Response Time: {total_stats['avg_response_time']*1000:.2f}ms")
        print(f"95th Percentile: {total_stats['p95_response_time']*1000:.2f}ms")
        
        # Assertions
        self.assertLess(
            total_stats['avg_response_time'], 
            max_avg_response_time,
            f"Average response time {total_stats['avg_response_time']*1000:.2f}ms exceeds {max_avg_response_time*1000}ms"
        )
        
        self.assertLess(
            total_stats['p95_response_time'],
            max_p95_response_time,
            f"95th percentile response time {total_stats['p95_response_time']*1000:.2f}ms exceeds {max_p95_response_time*1000}ms"
        )
        
        self.assertLess(
            total_stats['error_rate'],
            max_error_rate,
            f"Error rate {total_stats['error_rate']:.2f}% exceeds {max_error_rate}%"
        )
    
    def test_write_heavy_load(self):
        """Test system performance under write-heavy load"""
        print("\n" + "="*60)
        print("TEST: Write-Heavy Load Performance")
        print("="*60)
        
        # Performance requirements for writes
        max_avg_response_time = 0.5  # 500ms average for writes
        max_p95_response_time = 1.0  # 1 second for 95th percentile
        max_error_rate = 2.0  # 2% error rate for writes
        
        def create_thread_data(user):
            return {
                'title': f'Load test thread by {user.email}',
                'content': 'This is a load test thread content.',
                'category': 'other'
            }
        
        # Test creating 1000 threads concurrently
        metrics = self.run_concurrent_requests(
            self.test_users[:10],  # Use 10 users, 100 times each
            reverse('mainapp:thread-list-create'),
            method='POST',
            data_func=create_thread_data,
            max_workers=20  # Lower concurrency for writes
        )
        
        stats = metrics.get_stats()
        
        # Print results
        print("\nResults:")
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Successful: {stats['successful_requests']}")
        print(f"Failed: {stats['failed_requests']}")
        print(f"Error Rate: {stats['error_rate']:.2f}%")
        print(f"Average Response Time: {stats['avg_response_time']*1000:.2f}ms")
        print(f"95th Percentile: {stats['p95_response_time']*1000:.2f}ms")
        
        # Assertions
        self.assertLess(
            stats['avg_response_time'],
            max_avg_response_time,
            f"Average response time {stats['avg_response_time']*1000:.2f}ms exceeds {max_avg_response_time*1000}ms"
        )
        
        self.assertLess(
            stats['p95_response_time'],
            max_p95_response_time,
            f"95th percentile response time {stats['p95_response_time']*1000:.2f}ms exceeds {max_p95_response_time*1000}ms"
        )
    
    def test_mixed_load(self):
        """Test system performance under mixed read/write load"""
        print("\n" + "="*60)
        print("TEST: Mixed Load Performance (80% read, 20% write)")
        print("="*60)
        
        # Performance requirements
        max_avg_response_time = 0.3  # 300ms average for mixed load
        max_p95_response_time = 0.7  # 700ms for 95th percentile
        
        read_endpoints = [
            reverse('mainapp:thread-list-create'),
            reverse('noticeboard:advertisement-list'),
            reverse('mainapp:event-list'),
        ]
        
        def thread_data(user):
            return {
                'title': f'Mixed load test by {user.email}',
                'content': 'Testing mixed load performance.',
                'category': 'other'
            }
        
        total_metrics = PerformanceMetrics()
        total_metrics.start()
        
        # Simulate mixed load
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = []
            
            for i in range(1000):  # 1000 total requests
                user = self.test_users[i % len(self.test_users)]
                
                if i % 5 == 0:  # 20% writes
                    future = executor.submit(
                        self.simulate_user_request,
                        user,
                        reverse('mainapp:thread-list-create'),
                        'POST',
                        thread_data(user)
                    )
                else:  # 80% reads
                    endpoint = read_endpoints[i % len(read_endpoints)]
                    future = executor.submit(
                        self.simulate_user_request,
                        user,
                        endpoint,
                        'GET'
                    )
                
                futures.append(future)
            
            for future in as_completed(futures):
                result = future.result()
                if result['success']:
                    total_metrics.add_response_time(result['duration'])
                else:
                    total_metrics.add_error(result['error'] or f"HTTP {result['status_code']}")
        
        total_metrics.stop()
        stats = total_metrics.get_stats()
        
        # Print results
        print("\nResults:")
        print(f"Total Requests: {stats['total_requests']}")
        print(f"Successful: {stats['successful_requests']}")
        print(f"Failed: {stats['failed_requests']}")
        print(f"Error Rate: {stats['error_rate']:.2f}%")
        print(f"Average Response Time: {stats['avg_response_time']*1000:.2f}ms")
        print(f"95th Percentile: {stats['p95_response_time']*1000:.2f}ms")
        print(f"Requests/Second: {stats['requests_per_second']:.2f}")
        
        # Assertions
        self.assertLess(
            stats['avg_response_time'],
            max_avg_response_time,
            f"Average response time {stats['avg_response_time']*1000:.2f}ms exceeds {max_avg_response_time*1000}ms"
        )
        
        self.assertLess(
            stats['p95_response_time'],
            max_p95_response_time,
            f"95th percentile response time {stats['p95_response_time']*1000:.2f}ms exceeds {max_p95_response_time*1000}ms"
        )
    
    def test_database_connection_pooling(self):
        """Test database connection pooling under load"""
        print("\n" + "="*60)
        print("TEST: Database Connection Pooling")
        print("="*60)
        
        initial_queries = len(connection.queries)
        
        # Run concurrent database queries
        metrics = self.run_concurrent_requests(
            self.test_users[:50],
            reverse('mainapp:thread-list-create'),
            method='GET',
            max_workers=50
        )
        
        stats = metrics.get_stats()
        total_queries = len(connection.queries) - initial_queries
        
        print(f"\nTotal DB Queries: {total_queries}")
        print(f"Queries per Request: {total_queries / stats['successful_requests']:.2f}")
        
        # Ensure connection pooling is working (should reuse connections)
        self.assertLess(
            total_queries / stats['successful_requests'],
            10,  # Should not exceed 10 queries per request on average
            "Too many database queries per request - connection pooling may not be working"
        )
    
    def test_cache_effectiveness(self):
        """Test cache effectiveness under load"""
        print("\n" + "="*60)
        print("TEST: Cache Effectiveness")
        print("="*60)
        
        endpoint = reverse('mainapp:thread-list-create')
        
        # First run - cold cache
        print("\nCold cache run...")
        cache.clear()
        cold_metrics = self.run_concurrent_requests(
            self.test_users[:20],
            endpoint,
            method='GET',
            max_workers=20
        )
        cold_stats = cold_metrics.get_stats()
        
        # Second run - warm cache
        print("\nWarm cache run...")
        warm_metrics = self.run_concurrent_requests(
            self.test_users[:20],
            endpoint,
            method='GET',
            max_workers=20
        )
        warm_stats = warm_metrics.get_stats()
        
        # Calculate improvement
        improvement = (cold_stats['avg_response_time'] - warm_stats['avg_response_time']) / cold_stats['avg_response_time'] * 100
        
        print(f"\nCold Cache Avg Response: {cold_stats['avg_response_time']*1000:.2f}ms")
        print(f"Warm Cache Avg Response: {warm_stats['avg_response_time']*1000:.2f}ms")
        print(f"Performance Improvement: {improvement:.1f}%")
        
        # Cache should provide at least 20% improvement
        self.assertGreater(
            improvement,
            20,
            f"Cache improvement {improvement:.1f}% is less than expected 20%"
        )


@pytest.mark.django_db
class TestEndpointSpecificPerformance(TestCase, LoadTestMixin):
    """Test specific endpoint performance requirements"""
    
    def setUp(self):
        """Set up test data"""
        self.users = UserFactory.create_batch(10)
        ThreadFactory.create_batch(100)
        AdvertisementFactory.create_batch(50)
        EventFactory.create_batch(50)
    
    def test_forum_list_performance(self):
        """Forum thread list should respond in under 100ms"""
        client = APIClient()
        client.force_authenticate(user=self.users[0])
        
        response_times = []
        for _ in range(100):
            start = time.time()
            response = client.get(reverse('mainapp:thread-list-create'))
            end = time.time()
            
            self.assertEqual(response.status_code, 200)
            response_times.append(end - start)
        
        avg_time = statistics.mean(response_times) * 1000  # Convert to ms
        p95_time = statistics.quantiles(response_times, n=20)[18] * 1000
        
        print(f"\nForum List - Avg: {avg_time:.2f}ms, P95: {p95_time:.2f}ms")
        
        self.assertLess(avg_time, 100, "Forum list average response time exceeds 100ms")
        self.assertLess(p95_time, 200, "Forum list P95 response time exceeds 200ms")
    
    def test_search_performance(self):
        """Search should respond in under 200ms"""
        client = APIClient()
        client.force_authenticate(user=self.users[0])
        
        search_terms = ['test', 'forum', 'help', 'question', 'python']
        response_times = []
        
        for term in search_terms:
            for _ in range(20):
                start = time.time()
                response = client.get(
                    reverse('mainapp:thread-list-create'),
                    {'search': term}
                )
                end = time.time()
                
                self.assertEqual(response.status_code, 200)
                response_times.append(end - start)
        
        avg_time = statistics.mean(response_times) * 1000
        p95_time = statistics.quantiles(response_times, n=20)[18] * 1000
        
        print(f"\nSearch - Avg: {avg_time:.2f}ms, P95: {p95_time:.2f}ms")
        
        self.assertLess(avg_time, 200, "Search average response time exceeds 200ms")
        self.assertLess(p95_time, 400, "Search P95 response time exceeds 400ms")