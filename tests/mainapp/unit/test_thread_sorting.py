import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from mainapp.post import Thread, Post

User = get_user_model()


class ThreadSortingTestCase(TestCase):
    """Test cases for thread sorting functionality"""
    
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
        
        # Create threads with different attributes
        # Thread 1: Oldest, few votes, many posts
        self.thread1 = Thread.objects.create(
            title="First Thread",
            content="This is the first thread",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread1.id).update(
            created_date=timezone.now() - timedelta(days=10),
            vote_count_cache=2,
            post_count=10
        )
        
        # Thread 2: Middle age, most votes, few posts
        self.thread2 = Thread.objects.create(
            title="Second Thread",
            content="This is the second thread",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread2.id).update(
            created_date=timezone.now() - timedelta(days=5),
            vote_count_cache=15,
            post_count=3
        )
        
        # Thread 3: Newest, medium votes, most posts
        self.thread3 = Thread.objects.create(
            title="Third Thread",
            content="This is the third thread",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread3.id).update(
            created_date=timezone.now() - timedelta(days=1),
            vote_count_cache=8,
            post_count=20
        )
        
        # Thread 4: Negative votes (more downvotes than upvotes)
        self.thread4 = Thread.objects.create(
            title="Fourth Thread",
            content="This is the fourth thread",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread4.id).update(
            created_date=timezone.now() - timedelta(days=3),
            vote_count_cache=-5,
            post_count=5
        )
        
    def test_sort_by_newest_first(self):
        """Test sorting by creation date, newest first (descending)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Should be ordered: thread3 (1 day), thread4 (3 days), thread2 (5 days), thread1 (10 days)
        self.assertEqual(test_results[0]['id'], self.thread3.id)
        self.assertEqual(test_results[1]['id'], self.thread4.id)
        self.assertEqual(test_results[2]['id'], self.thread2.id)
        self.assertEqual(test_results[3]['id'], self.thread1.id)
        
    def test_sort_by_oldest_first(self):
        """Test sorting by creation date, oldest first (ascending)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Should be ordered: thread1 (10 days), thread2 (5 days), thread4 (3 days), thread3 (1 day)
        self.assertEqual(test_results[0]['id'], self.thread1.id)
        self.assertEqual(test_results[1]['id'], self.thread2.id)
        self.assertEqual(test_results[2]['id'], self.thread4.id)
        self.assertEqual(test_results[3]['id'], self.thread3.id)
        
    def test_sort_by_most_votes(self):
        """Test sorting by vote count, most votes first (descending)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Should be ordered by votes: thread2 (15), thread3 (8), thread1 (2), thread4 (-5)
        self.assertEqual(test_results[0]['id'], self.thread2.id)
        self.assertEqual(test_results[0]['vote_count'], 15)
        
        self.assertEqual(test_results[1]['id'], self.thread3.id)
        self.assertEqual(test_results[1]['vote_count'], 8)
        
        self.assertEqual(test_results[2]['id'], self.thread1.id)
        self.assertEqual(test_results[2]['vote_count'], 2)
        
        self.assertEqual(test_results[3]['id'], self.thread4.id)
        self.assertEqual(test_results[3]['vote_count'], -5)
        
    def test_sort_by_most_posts(self):
        """Test sorting by post count, most posts first (descending)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-posts')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Should be ordered by posts: thread3 (20), thread1 (10), thread4 (5), thread2 (3)
        self.assertEqual(test_results[0]['id'], self.thread3.id)
        self.assertEqual(test_results[1]['id'], self.thread1.id)
        self.assertEqual(test_results[2]['id'], self.thread4.id)
        self.assertEqual(test_results[3]['id'], self.thread2.id)
        
    def test_vote_count_includes_negative(self):
        """Test that threads with negative votes are sorted correctly"""
        self.client.force_authenticate(user=self.user)
        
        # Create a thread with very negative votes
        thread_negative = Thread.objects.create(
            title="Very Unpopular Thread",
            content="This thread has many downvotes",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=thread_negative.id).update(
            vote_count_cache=-20
        )
        
        response = self.client.get('/api/v1/threads/?ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Filter to only our test threads
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id, thread_negative.id}
        test_results = [r for r in results if r['id'] in test_thread_ids]
        
        # The thread with -20 votes should be last
        self.assertEqual(test_results[-1]['id'], thread_negative.id)
        self.assertEqual(test_results[-1]['vote_count'], -20)