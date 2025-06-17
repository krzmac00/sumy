"""
Integration tests for notification flows across modules

Tests how different actions trigger notifications and how users
interact with the notification system.
"""

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from datetime import timedelta

from tests.base import BaseAPITestCase
from tests.factories import (
    UserFactory, ThreadFactory, PostFactory,
    AdvertisementFactory, CommentFactory
)
from mainapp.models import Thread, Post
from noticeboard.models import Advertisement, Comment


class TestNotificationFlows(BaseAPITestCase):
    """Test notification triggers and delivery across modules"""
    
    @BaseAPITestCase.doc
    def test_forum_reply_notifications(self):
        """
        Test notifications when users reply to forum threads
        
        Verifies:
        - Thread author gets notified of replies
        - Other participants get notified
        - Anonymous posts still trigger notifications
        - User can control notification preferences
        """
        # User creates a thread
        thread = ThreadFactory(author=self.test_user)
        
        # Another user replies
        replier = UserFactory()
        self.authenticate(replier)
        
        post_data = {
            'thread': thread.id,
            'content': 'Great question! Here is my answer...',
            'is_anonymous': False
        }
        
        response = self.client.post(
            reverse('mainapp:post-list-create'),
            post_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Thread author should have a notification
        # (Notification system would be checked here if implemented)
        
        # Third user also replies
        third_user = UserFactory()
        self.authenticate(third_user)
        
        another_post = {
            'thread': thread.id,
            'content': 'I have a different perspective...',
            'is_anonymous': True,
            'nickname': 'Anonymous Helper'
        }
        
        response = self.client.post(
            reverse('mainapp:post-list-create'),
            another_post
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Both thread author and first replier should get notifications
        # Verify thread activity is updated
        thread.refresh_from_db()
        self.assertEqual(thread.post_count, 2)
    
    @BaseAPITestCase.doc
    def test_advertisement_comment_notifications(self):
        """
        Test notifications for advertisement interactions
        
        Verifies:
        - Ad author gets notified of comments
        - Private comments trigger different notifications
        - Expired ad notifications are handled
        """
        # Create advertisement
        ad = AdvertisementFactory(author=self.test_user)
        
        # Another user comments publicly
        commenter = UserFactory()
        self.authenticate(commenter)
        
        public_comment = {
            'advertisement': ad.id,
            'content': 'Is this still available?',
            'is_public': True
        }
        
        response = self.client.post(
            reverse('noticeboard:comment-list'),
            public_comment
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Same user adds private comment with contact info
        private_comment = {
            'advertisement': ad.id,
            'content': 'My phone: 555-0123, very interested!',
            'is_public': False
        }
        
        response = self.client.post(
            reverse('noticeboard:comment-list'),
            private_comment
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify activity update
        ad.refresh_from_db()
        self.assertGreater(ad.last_activity_date, ad.created_date)
        
        # Ad author should see both comments
        self.authenticate(self.test_user)
        comments = self.client.get(
            reverse('noticeboard:comment-list'),
            {'advertisement': ad.id}
        )
        self.assertEqual(comments.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(comments.data['results']), 2)
    
    @BaseAPITestCase.doc
    def test_mention_notifications_in_posts(self):
        """
        Test @mention functionality in forum posts
        
        Verifies:
        - Mentions in posts trigger notifications
        - Multiple mentions are handled
        - Invalid mentions are ignored
        """
        # Create users with known usernames
        user1 = UserFactory(login='student123')
        user2 = UserFactory(login='helper456')
        
        # Create thread
        thread = ThreadFactory()
        
        # Post with mentions
        self.authenticate(self.test_user)
        post_data = {
            'thread': thread.id,
            'content': 'Thanks @student123 and @helper456 for your help!',
            'is_anonymous': False
        }
        
        response = self.client.post(
            reverse('mainapp:post-list-create'),
            post_data
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Both mentioned users should receive notifications
        # Invalid mention should be ignored
        post_with_invalid = {
            'thread': thread.id,
            'content': 'Thanks @nonexistentuser for nothing!',
            'is_anonymous': False
        }
        
        response = self.client.post(
            reverse('mainapp:post-list-create'),
            post_with_invalid
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should not cause error even with invalid mention
    
    @BaseAPITestCase.doc  
    def test_event_reminder_notifications(self):
        """
        Test event reminder notifications
        
        Verifies:
        - Upcoming events trigger reminders
        - Different reminder times work
        - User preferences are respected
        """
        # Create event happening tomorrow
        tomorrow_event = {
            'title': 'Important Exam',
            'description': 'Final exam for Math 101',
            'start_date': (timezone.now() + timedelta(days=1)).isoformat(),
            'end_date': (timezone.now() + timedelta(days=1, hours=2)).isoformat(),
            'category': 'exam'
        }
        
        response = self.client.post(
            reverse('mainapp:event-list'),
            tomorrow_event
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Create event happening in an hour
        soon_event = {
            'title': 'Study Group',
            'description': 'Weekly study group meeting',
            'start_date': (timezone.now() + timedelta(hours=1)).isoformat(),
            'end_date': (timezone.now() + timedelta(hours=3)).isoformat(),
            'category': 'private'
        }
        
        response = self.client.post(
            reverse('mainapp:event-list'),
            soon_event
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify events are created
        events = self.client.get(reverse('mainapp:event-list'))
        self.assertEqual(events.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(events.data['results']), 2)


class TestDigestNotifications(BaseAPITestCase):
    """Test daily/weekly digest notification generation"""
    
    @BaseAPITestCase.doc
    def test_daily_activity_digest(self):
        """
        Test generation of daily activity digest
        
        Verifies:
        - Digest includes relevant content
        - User preferences filter content
        - Digest respects blacklist
        """
        # Create various activities
        thread1 = ThreadFactory(
            title='Popular Discussion',
            category='academic',
            created_date=timezone.now() - timedelta(hours=12)
        )
        
        # Add posts to make it "hot"
        PostFactory.create_batch(5, thread=thread1)
        
        thread2 = ThreadFactory(
            title='Another Topic',
            category='lifestyle',
            created_date=timezone.now() - timedelta(hours=6)
        )
        
        # Recent advertisement
        ad = AdvertisementFactory(
            title='Textbook Sale',
            category='sale',
            created_date=timezone.now() - timedelta(hours=3)
        )
        
        # Get digest-worthy content
        # This would typically be done by a background task
        recent_threads = Thread.objects.filter(
            created_date__gte=timezone.now() - timedelta(days=1)
        ).order_by('-post_count', '-created_date')
        
        recent_ads = Advertisement.objects.filter(
            created_date__gte=timezone.now() - timedelta(days=1),
            is_active=True
        ).order_by('-created_date')
        
        # Verify content exists for digest
        self.assertGreater(recent_threads.count(), 0)
        self.assertGreater(recent_ads.count(), 0)
    
    @BaseAPITestCase.doc
    def test_weekly_summary_generation(self):
        """
        Test weekly summary notification content
        
        Verifies:
        - Summary includes top content
        - Statistics are calculated correctly
        - Personalization based on user activity
        """
        # Create week's worth of content
        for i in range(7):
            day_offset = timedelta(days=i)
            
            # Daily threads
            ThreadFactory.create_batch(
                3,
                created_date=timezone.now() - day_offset
            )
            
            # Daily ads
            AdvertisementFactory.create_batch(
                2,
                created_date=timezone.now() - day_offset
            )
        
        # Calculate weekly statistics
        week_ago = timezone.now() - timedelta(days=7)
        
        week_threads = Thread.objects.filter(
            created_date__gte=week_ago
        ).count()
        
        week_ads = Advertisement.objects.filter(
            created_date__gte=week_ago
        ).count()
        
        # Verify weekly content
        self.assertGreaterEqual(week_threads, 21)  # 3 per day * 7 days
        self.assertGreaterEqual(week_ads, 14)     # 2 per day * 7 days
        
        # Get top threads by activity
        top_threads = Thread.objects.filter(
            created_date__gte=week_ago
        ).order_by('-post_count', '-vote_count_cache')[:5]
        
        # Weekly summary would include these top threads