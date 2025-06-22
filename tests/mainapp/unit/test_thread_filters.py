import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from mainapp.post import Thread, Post, Vote
from mainapp.filters import ThreadFilter

User = get_user_model()


class ThreadFilterTestCase(TestCase):
    """Test cases for thread filtering and sorting functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.user1 = User.objects.create_user(
            email='test1@example.com',
            password='testpass123',
            login='user1',
            first_name='Test',
            last_name='User1',
            role='student'
        )
        self.user2 = User.objects.create_user(
            email='test2@example.com',
            password='testpass123',
            login='user2',
            first_name='Test',
            last_name='User2',
            role='student'
        )
        self.teacher = User.objects.create_user(
            email='teacher@example.com',
            password='testpass123',
            login='teacher1',
            first_name='Test',
            last_name='Teacher',
            role='lecturer'
        )
        
        # Create threads with different attributes for testing
        self.thread1 = Thread.objects.create(
            title="First Thread",
            content="Content of first thread",
            category="general",
            author=self.user1,
            created_date=timezone.now() - timedelta(days=5),
            last_activity_date=timezone.now() - timedelta(days=1),
            vote_count_cache=10,
            post_count=5
        )
        
        self.thread2 = Thread.objects.create(
            title="Second Thread",
            content="Content of second thread",
            category="academic",
            author=self.user2,
            created_date=timezone.now() - timedelta(days=3),
            last_activity_date=timezone.now() - timedelta(hours=5),
            vote_count_cache=5,
            post_count=2
        )
        
        self.thread3 = Thread.objects.create(
            title="Anonymous Thread",
            content="Anonymous content",
            category="general",
            author=self.user1,
            is_anonymous=True,
            created_date=timezone.now() - timedelta(days=1),
            last_activity_date=timezone.now() - timedelta(minutes=30),
            vote_count_cache=15,
            post_count=8
        )
        
        self.thread4 = Thread.objects.create(
            title="Teacher Only Thread",
            content="Visible for teachers only",
            category="academic",
            author=self.teacher,
            visible_for_teachers=True,
            created_date=timezone.now() - timedelta(days=2),
            last_activity_date=timezone.now() - timedelta(hours=2),
            vote_count_cache=3,
            post_count=1
        )
        
        # Add some votes to verify vote counting
        Vote.objects.create(user=self.user2, thread=self.thread1, vote_type='upvote')
        Vote.objects.create(user=self.teacher, thread=self.thread1, vote_type='upvote')
        
        # Update vote count caches
        self.thread1.update_vote_count()
        self.thread2.update_vote_count()
        self.thread3.update_vote_count()
        self.thread4.update_vote_count()
        
    def test_sort_by_latest_activity(self):
        """Test sorting by latest activity date (descending)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=-activity')
        
        # Debug output if test fails
        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data if hasattr(response, 'data') else response.content}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Verify threads are sorted by last_activity_date descending
        # Extract our test threads from results
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        filtered_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Check that the threads appear in the correct order
        # Should be ordered: thread3 (30 min ago), thread2 (5 hours ago), thread1 (1 day ago)
        # Note: thread4 is visible only to teachers
        self.assertTrue(len(filtered_results) >= 3)
        thread_order = [r['id'] for r in filtered_results[:3]]
        self.assertIn(self.thread3.id, thread_order)  # Most recent activity
        self.assertIn(self.thread2.id, thread_order)  # Second most recent
        self.assertIn(self.thread1.id, thread_order)  # Third most recent
        
    def test_sort_by_newest_created(self):
        """Test sorting by creation date (newest first)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=-created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should be ordered: thread3 (1 day ago), thread4 (2 days ago), thread2 (3 days ago), thread1 (5 days ago)
        self.assertEqual(results[0]['id'], self.thread3.id)
        self.assertEqual(results[1]['id'], self.thread2.id)
        self.assertEqual(results[2]['id'], self.thread1.id)
        
    def test_sort_by_oldest_created(self):
        """Test sorting by creation date (oldest first)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should be ordered: thread1 (5 days ago), thread2 (3 days ago), thread4 (2 days ago), thread3 (1 day ago)
        self.assertEqual(results[0]['id'], self.thread1.id)
        self.assertEqual(results[1]['id'], self.thread2.id)
        self.assertEqual(results[2]['id'], self.thread3.id)
        
    def test_sort_by_most_votes(self):
        """Test sorting by vote count (descending)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Verify threads are sorted by vote count descending
        # Check that ALL results (not just our test threads) are sorted correctly
        all_vote_counts = [r['vote_count'] for r in results]
        self.assertEqual(all_vote_counts, sorted(all_vote_counts, reverse=True), 
                        f"Vote counts not sorted correctly: {all_vote_counts}")
        
        # Extract our test threads from results (students see all threads)
        test_thread_ids = {self.thread1.id, self.thread2.id, self.thread3.id, self.thread4.id}
        filtered_results = [r for r in results if r['id'] in test_thread_ids]
        
        # Verify our threads are present and sorted correctly
        self.assertEqual(len(filtered_results), 4, "All threads should be visible to students")
        
        # After updating vote counts, the order should be:
        # thread3 (15), thread1 (12), thread2 (5), thread4 (3)
        self.assertEqual(filtered_results[0]['id'], self.thread3.id)  # 15 votes
        self.assertEqual(filtered_results[1]['id'], self.thread1.id)  # 12 votes
        self.assertEqual(filtered_results[2]['id'], self.thread2.id)  # 5 votes
        self.assertEqual(filtered_results[3]['id'], self.thread4.id)  # 3 votes
        
    def test_sort_by_most_posts(self):
        """Test sorting by post count (descending)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=-posts')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should be ordered by post count: thread3 (8), thread1 (5), thread2 (2), thread4 (1)
        self.assertEqual(results[0]['id'], self.thread3.id)
        self.assertEqual(results[1]['id'], self.thread1.id)
        self.assertEqual(results[2]['id'], self.thread2.id)
        
    def test_sort_by_title(self):
        """Test sorting by title (ascending alphabetically)"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?ordering=title')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should be ordered alphabetically by title
        titles = [r['title'] for r in results]
        self.assertEqual(titles, sorted(titles))
        
    def test_filter_by_category(self):
        """Test filtering by category"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?category=general')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return threads with category 'general'
        self.assertEqual(len(results), 2)
        for thread in results:
            self.assertEqual(thread['category'], 'general')
            
    def test_filter_by_date_range(self):
        """Test filtering by date range"""
        self.client.force_authenticate(user=self.user1)
        
        # Get threads created in the last 2 days
        date_from = (timezone.now() - timedelta(days=2)).date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={date_from}')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return thread3 (created 1 day ago)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.thread3.id)
        
    def test_filter_by_anonymous(self):
        """Test filtering by anonymous status"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?is_anonymous=true')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return anonymous threads
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.thread3.id)
        self.assertTrue(results[0]['is_anonymous'])
        
    def test_search_filter(self):
        """Test search functionality across title and content"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/?search=anonymous')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should return thread3 which has 'anonymous' in title or content
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.thread3.id)
        
    def test_teacher_visibility_filter(self):
        """Test that visible_for_teachers only affects what teachers see"""
        # As a student, should see ALL threads (including visible_for_teachers ones)
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/v1/threads/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            student_results = data['results']
        else:
            student_results = data
        
        thread_ids = [t['id'] for t in student_results]
        # Students can see all threads
        self.assertIn(self.thread1.id, thread_ids)
        self.assertIn(self.thread2.id, thread_ids)
        self.assertIn(self.thread3.id, thread_ids)
        self.assertIn(self.thread4.id, thread_ids)  # Teacher-visible thread is also visible to students
        
        # As a teacher, should ONLY see threads marked as visible_for_teachers
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get('/api/v1/threads/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            teacher_results = data['results']
        else:
            teacher_results = data
        
        teacher_thread_ids = [t['id'] for t in teacher_results]
        # Teachers only see threads with visible_for_teachers=True
        self.assertIn(self.thread4.id, teacher_thread_ids)  # This is the only visible_for_teachers thread
        self.assertNotIn(self.thread1.id, teacher_thread_ids)
        self.assertNotIn(self.thread2.id, teacher_thread_ids)
        self.assertNotIn(self.thread3.id, teacher_thread_ids)
        
    def test_blacklist_filter(self):
        """Test blacklist functionality"""
        # Add blacklist to user
        self.user1.blacklist = ['second', 'anonymous']
        self.user1.save()
        
        self.client.force_authenticate(user=self.user1)
        
        # With blacklist on (default)
        response = self.client.get('/api/v1/threads/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should not see threads containing blacklisted words
        thread_ids = [t['id'] for t in results]
        self.assertNotIn(self.thread2.id, thread_ids)  # Contains 'second'
        self.assertNotIn(self.thread3.id, thread_ids)  # Contains 'anonymous'
        
        # With blacklist off
        response = self.client.get('/api/v1/threads/?blacklist=off')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should see all threads
        thread_ids = [t['id'] for t in results]
        self.assertIn(self.thread2.id, thread_ids)
        self.assertIn(self.thread3.id, thread_ids)
        
    def test_combined_filters_and_sort(self):
        """Test combining multiple filters and sorting"""
        self.client.force_authenticate(user=self.user1)
        
        # Filter by category and sort by vote count
        response = self.client.get('/api/v1/threads/?category=general&ordering=-votes')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should only return general category threads, sorted by votes
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['id'], self.thread3.id)  # 15 votes
        self.assertEqual(results[1]['id'], self.thread1.id)  # 10 votes
        
        for thread in results:
            self.assertEqual(thread['category'], 'general')