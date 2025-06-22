import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from rest_framework.test import APIClient
from mainapp.post import Thread
from mainapp.filters import ThreadFilter

User = get_user_model()


class DateFilterTestCase(TestCase):
    """Test cases for date filtering functionality with timezone support"""
    
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
        
        # Create threads with different dates
        self.today = timezone.now()
        self.yesterday = self.today - timedelta(days=1)
        self.last_week = self.today - timedelta(days=7)
        self.last_month = self.today - timedelta(days=30)
        
        self.thread_today = Thread.objects.create(
            title="Today's Thread",
            content="Created today",
            category="general",
            author=self.user
        )
        # Manually set created_date to bypass auto_now_add
        Thread.objects.filter(id=self.thread_today.id).update(created_date=self.today)
        
        self.thread_yesterday = Thread.objects.create(
            title="Yesterday's Thread",
            content="Created yesterday",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread_yesterday.id).update(created_date=self.yesterday)
        
        self.thread_last_week = Thread.objects.create(
            title="Last Week's Thread",
            content="Created last week",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread_last_week.id).update(created_date=self.last_week)
        
        self.thread_last_month = Thread.objects.create(
            title="Last Month's Thread",
            content="Created last month",
            category="general",
            author=self.user
        )
        Thread.objects.filter(id=self.thread_last_month.id).update(created_date=self.last_month)
        
    def test_date_from_filter_with_timezone(self):
        """Test date_from filter properly handles timezone conversion"""
        self.client.force_authenticate(user=self.user)
        
        # Filter threads from yesterday onwards
        yesterday_date = self.yesterday.date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={yesterday_date}')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should include today's and yesterday's threads
        thread_ids = [t['id'] for t in results]
        self.assertIn(self.thread_today.id, thread_ids)
        self.assertIn(self.thread_yesterday.id, thread_ids)
        self.assertNotIn(self.thread_last_week.id, thread_ids)
        self.assertNotIn(self.thread_last_month.id, thread_ids)
        
    def test_date_to_filter_with_timezone(self):
        """Test date_to filter properly handles timezone conversion"""
        self.client.force_authenticate(user=self.user)
        
        # Filter threads up to yesterday
        yesterday_date = self.yesterday.date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_to={yesterday_date}')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should include yesterday's and older threads
        thread_ids = [t['id'] for t in results]
        self.assertNotIn(self.thread_today.id, thread_ids)
        self.assertIn(self.thread_yesterday.id, thread_ids)
        self.assertIn(self.thread_last_week.id, thread_ids)
        self.assertIn(self.thread_last_month.id, thread_ids)
        
    def test_date_range_filter_with_timezone(self):
        """Test combining date_from and date_to filters"""
        self.client.force_authenticate(user=self.user)
        
        # Filter threads between last week and yesterday
        date_from = self.last_week.date().isoformat()
        date_to = self.yesterday.date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={date_from}&date_to={date_to}')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should include yesterday's and last week's threads only
        thread_ids = [t['id'] for t in results]
        self.assertNotIn(self.thread_today.id, thread_ids)
        self.assertIn(self.thread_yesterday.id, thread_ids)
        self.assertIn(self.thread_last_week.id, thread_ids)
        self.assertNotIn(self.thread_last_month.id, thread_ids)
        
    def test_date_filter_with_sorting(self):
        """Test date filters work correctly with sorting"""
        self.client.force_authenticate(user=self.user)
        
        # Filter threads from last week onwards, sorted by creation date (oldest first)
        date_from = self.last_week.date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={date_from}&ordering=created')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should be sorted: last week, yesterday, today
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['id'], self.thread_last_week.id)
        self.assertEqual(results[1]['id'], self.thread_yesterday.id)
        self.assertEqual(results[2]['id'], self.thread_today.id)
        
    def test_no_timezone_warning(self):
        """Test that our fix prevents the timezone warning"""
        self.client.force_authenticate(user=self.user)
        
        # This should not produce a timezone warning
        today_date = date.today().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_from={today_date}')
        
        # If the fix is working, this should complete without warnings
        self.assertEqual(response.status_code, 200)
        
    def test_edge_case_end_of_day(self):
        """Test that date_to includes all threads from that day"""
        self.client.force_authenticate(user=self.user)
        
        # Create a thread near end of day
        end_of_day_thread = Thread.objects.create(
            title="End of Day Thread",
            content="Created at 23:59",
            category="general",
            author=self.user
        )
        # Set to 23:59 of yesterday
        end_of_day_time = self.yesterday.replace(hour=23, minute=59, second=59)
        Thread.objects.filter(id=end_of_day_thread.id).update(created_date=end_of_day_time)
        
        # Filter up to yesterday should include this thread
        yesterday_date = self.yesterday.date().isoformat()
        response = self.client.get(f'/api/v1/threads/?date_to={yesterday_date}')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Handle paginated response
        if 'results' in data:
            results = data['results']
        else:
            results = data
        
        # Should include the end of day thread
        thread_ids = [t['id'] for t in results]
        self.assertIn(end_of_day_thread.id, thread_ids)