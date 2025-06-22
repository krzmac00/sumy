import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from mainapp.post import Thread

User = get_user_model()


class DefaultOrderingTestCase(TestCase):
    """Test cases for default ordering behavior"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            login='testuser',
            first_name='Test',
            last_name='User',
            role='student'
        )
        
        # Create threads with different last activity dates
        self.thread1 = Thread.objects.create(
            title="Old Activity Thread",
            content="Last activity was long ago",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread1.id).update(
            last_activity_date=timezone.now() - timedelta(days=5)
        )
        
        self.thread2 = Thread.objects.create(
            title="Recent Activity Thread",
            content="Last activity was recent",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread2.id).update(
            last_activity_date=timezone.now() - timedelta(hours=1)
        )
        
        self.thread3 = Thread.objects.create(
            title="Medium Activity Thread",
            content="Last activity was medium ago",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread3.id).update(
            last_activity_date=timezone.now() - timedelta(days=1)
        )
        
    def test_default_ordering_is_latest_activity(self):
        """Test that default ordering is by latest activity descending"""
        self.client.force_authenticate(user=self.user)
        
        # Request without any ordering parameter
        response = self.client.get('/api/v1/threads/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Should be ordered by latest activity: thread2 (1 hour), thread3 (1 day), thread1 (5 days)
        self.assertEqual(test_results[0]['id'], self.thread2.id)
        self.assertEqual(test_results[1]['id'], self.thread3.id)
        self.assertEqual(test_results[2]['id'], self.thread1.id)
        
    def test_explicit_ordering_overrides_default(self):
        """Test that explicit ordering parameter overrides default"""
        self.client.force_authenticate(user=self.user)
        
        # Request with explicit ordering by title
        response = self.client.get('/api/v1/threads/?ordering=title')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # All results should be ordered alphabetically by title
        titles = [r['title'] for r in results]
        self.assertEqual(titles, sorted(titles))