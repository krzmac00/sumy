import pytest
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from mainapp.post import Thread, Post, Vote

User = get_user_model()


class ForumSortFilterIntegrationTest(TransactionTestCase):
    """Integration tests for forum sort and filter functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            login='testuser',
            first_name='Test',
            last_name='User',
            role='student'
        )
        
        # Create multiple threads with varying attributes
        self.threads = []
        
        # Thread 1: High activity, many votes
        thread1 = Thread.objects.create(
            title="Popular Discussion",
            content="This is a very popular thread",
            category="general",
            author=self.user,
            created_date=timezone.now() - timedelta(days=7),
            last_activity_date=timezone.now() - timedelta(hours=1),
            vote_count_cache=25,
            post_count=15
        )
        self.threads.append(thread1)
        
        # Thread 2: Recent creation, few votes
        thread2 = Thread.objects.create(
            title="New Question",
            content="Just posted this question",
            category="academic",
            author=self.user,
            created_date=timezone.now() - timedelta(hours=2),
            last_activity_date=timezone.now() - timedelta(hours=2),
            vote_count_cache=2,
            post_count=1
        )
        self.threads.append(thread2)
        
        # Thread 3: Old but recently active
        thread3 = Thread.objects.create(
            title="Revived Topic",
            content="Old thread with recent activity",
            category="other",
            author=self.user,
            created_date=timezone.now() - timedelta(days=30),
            last_activity_date=timezone.now() - timedelta(minutes=30),
            vote_count_cache=8,
            post_count=20
        )
        self.threads.append(thread3)
        
        # Thread 4: Medium age, medium activity
        thread4 = Thread.objects.create(
            title="Regular Thread",
            content="Just a regular discussion",
            category="general",
            author=self.user,
            created_date=timezone.now() - timedelta(days=3),
            last_activity_date=timezone.now() - timedelta(days=1),
            vote_count_cache=5,
            post_count=7
        )
        self.threads.append(thread4)
        
    def test_default_sort_latest_activity(self):
        """Test that default sort is by latest activity"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Verify threads are sorted by last_activity_date descending
        # Expected order: thread3 (30 min), thread1 (1 hour), thread2 (2 hours), thread4 (1 day)
        self.assertEqual(results[0]['title'], "Revived Topic")
        self.assertEqual(results[1]['title'], "Popular Discussion")
        self.assertEqual(results[2]['title'], "New Question")
        self.assertEqual(results[3]['title'], "Regular Thread")
        
    def test_sort_by_creation_date_newest(self):
        """Test sorting by creation date (newest first)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Expected order: thread2 (2 hours), thread4 (3 days), thread1 (7 days), thread3 (30 days)
        self.assertEqual(results[0]['title'], "New Question")
        self.assertEqual(results[1]['title'], "Regular Thread")
        self.assertEqual(results[2]['title'], "Popular Discussion")
        self.assertEqual(results[3]['title'], "Revived Topic")
        
    def test_sort_by_creation_date_oldest(self):
        """Test sorting by creation date (oldest first)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Expected order: thread3 (30 days), thread1 (7 days), thread4 (3 days), thread2 (2 hours)
        self.assertEqual(results[0]['title'], "Revived Topic")
        self.assertEqual(results[1]['title'], "Popular Discussion")
        self.assertEqual(results[2]['title'], "Regular Thread")
        self.assertEqual(results[3]['title'], "New Question")
        
    def test_sort_by_vote_count(self):
        """Test sorting by vote count (most votes first)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Expected order by votes: thread1 (25), thread3 (8), thread4 (5), thread2 (2)
        self.assertEqual(results[0]['title'], "Popular Discussion")
        self.assertEqual(results[1]['title'], "Revived Topic")
        self.assertEqual(results[2]['title'], "Regular Thread")
        self.assertEqual(results[3]['title'], "New Question")
        
    def test_sort_by_post_count(self):
        """Test sorting by post count (most posts first)"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=-posts')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Expected order by posts: thread3 (20), thread1 (15), thread4 (7), thread2 (1)
        self.assertEqual(results[0]['title'], "Revived Topic")
        self.assertEqual(results[1]['title'], "Popular Discussion")
        self.assertEqual(results[2]['title'], "Regular Thread")
        self.assertEqual(results[3]['title'], "New Question")
        
    def test_sort_by_title_alphabetical(self):
        """Test sorting by title alphabetically"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?ordering=title')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Expected alphabetical order: New Question, Popular Discussion, Regular Thread, Revived Topic
        titles = [r['title'] for r in results]
        self.assertEqual(titles, sorted(titles))
        
    def test_category_filter_with_sort(self):
        """Test category filtering combined with sorting"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/threads/?category=general&ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return 'general' category threads, sorted by votes
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['title'], "Popular Discussion")  # 25 votes
        self.assertEqual(results[1]['title'], "Regular Thread")  # 5 votes
        
        for thread in results:
            self.assertEqual(thread['category'], 'general')
            
    def test_date_range_filter_with_sort(self):
        """Test date range filtering with sorting"""
        self.client.force_authenticate(user=self.user)
        
        # Get threads created in the last 5 days, sorted by votes
        date_from = (timezone.now() - timedelta(days=5)).date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={date_from}&ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should exclude thread1 (7 days) and thread3 (30 days)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['title'], "Regular Thread")  # 5 votes
        self.assertEqual(results[1]['title'], "New Question")  # 2 votes
        
    def test_search_with_sort(self):
        """Test search functionality with sorting"""
        self.client.force_authenticate(user=self.user)
        
        # Search for 'thread' and sort by newest
        response = self.client.get('/api/v1/threads/?search=thread&ordering=-created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should find threads with 'thread' in title/content
        # Thread 1, 3, and 4 have 'thread' in their content or title
        found_titles = [r['title'] for r in results]
        self.assertIn("Regular Thread", found_titles)
        self.assertIn("Popular Discussion", found_titles)
        self.assertIn("Revived Topic", found_titles)
        
    def test_pagination_with_sort(self):
        """Test that sorting works correctly with pagination"""
        # Create more threads to test pagination
        for i in range(20):
            Thread.objects.create(
                title=f"Extra Thread {i}",
                content=f"Content {i}",
                category="general",
                author=self.user,
                created_date=timezone.now() - timedelta(days=i),
                vote_count_cache=i
            )
            
        self.client.force_authenticate(user=self.user)
        
        # Get first page sorted by votes
        response = self.client.get('/api/v1/threads/?ordering=-votes&page=1')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
            
        # Verify first page has highest vote counts
        votes = [t['vote_count'] for t in results]
        self.assertEqual(votes, sorted(votes, reverse=True))
            
    def test_multiple_filters_and_sort(self):
        """Test combining multiple filters with sorting"""
        # Create an anonymous thread
        anon_thread = Thread.objects.create(
            title="Anonymous General Thread",
            content="Anonymous content in general category",
            category="general",
            author=self.user,
            is_anonymous=True,
            created_date=timezone.now() - timedelta(days=2),
            vote_count_cache=10,
            post_count=3
        )
        
        self.client.force_authenticate(user=self.user)
        
        # Filter by category, anonymous status, and sort by votes
        response = self.client.get(
            '/api/v1/threads/?category=general&is_anonymous=true&ordering=-votes'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return the anonymous general thread
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], "Anonymous General Thread")
        self.assertTrue(results[0]['is_anonymous'])
        self.assertEqual(results[0]['category'], 'general')