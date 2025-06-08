import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sumy.settings')
django.setup()

from django.test import TestCase
from rest_framework import status
from django.urls import reverse
from rest_framework.test import APITestCase

from mainapp.post import Post, Thread
from mainapp.post import create_post, get_post, update_post, delete_post
from mainapp.post import create_thread, get_thread, update_thread, delete_thread, create_thread_legacy
from accounts.models import CustomUser
from django.contrib.auth import get_user_model

class PostAndThreadTests(TestCase):
    def test_create_post_without_replies(self):
        post_id = create_post("user1", "Hello, world!", [])
        post = Post.objects.get(id=post_id)
        self.assertEqual(post.nickname, "user1")
        self.assertEqual(post.content, "Hello, world!")
        self.assertFalse(post.was_edited)

    def test_create_post_with_replies(self):
        parent = Post.objects.create(nickname="parent", content="Parent post")
        post_id = create_post("user2", "Replying...", [parent.id])
        reply = Post.objects.get(id=post_id)
        self.assertEqual(reply.replying_to.first().id, parent.id)

    def test_create_post_replying_to_multiple_posts(self):
        parent1 = Post.objects.create(nickname="parent1",
                                      content="First parent")
        parent2 = Post.objects.create(nickname="parent2",
                                      content="Second parent")
        post_id = create_post("user3", "Replying to two posts",
                              [parent1.id, parent2.id])
        reply = Post.objects.get(id=post_id)

        replying_to_ids = list(reply.replying_to.values_list('id', flat=True))
        self.assertIn(parent1.id, replying_to_ids)
        self.assertIn(parent2.id, replying_to_ids)
        self.assertEqual(len(replying_to_ids), 2)

    def test_get_post(self):
        post = Post.objects.create(nickname="user3", content="Get me")
        fetched = get_post(post.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched['content'], "Get me")

    def test_get_post_with_replies(self):
        parent = Post.objects.create(nickname="parent", content="Parent post")
        post_id = create_post("user2", "Replying...", [parent.id])
        fetched = get_post(parent.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched['content'], "Parent post")
        self.assertEqual(len(fetched['replies']), 1)
        self.assertEqual(fetched['replies'][0]['content'], "Replying...")

    def test_update_post(self):
        post = Post.objects.create(nickname="user4", content="Old content")
        update_post(post.id, "New content")
        post.refresh_from_db()
        self.assertEqual(post.content, "New content")
        self.assertTrue(post.was_edited)

    def test_delete_post(self):
        post = Post.objects.create(nickname="user5", content="To delete")
        delete_post(post.id)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_delete_parent_post_does_not_delete_reply(self):
        parent = Post.objects.create(nickname="parent", content="Parent post")
        reply_id = create_post("user4", "Reply to parent", [parent.id])
        reply = Post.objects.get(id=reply_id)

        parent.delete()
        reply.refresh_from_db()
        self.assertTrue(Post.objects.filter(id=reply.id).exists())
        self.assertEqual(reply.replying_to.count(),
                         0)  # Powiązanie powinno zniknąć

    def test_create_thread(self):
        thread_id = create_thread("user6", "Thread content", "General", "Thread title", True, False)
        thread = Thread.objects.get(post_id=thread_id)
        self.assertEqual(thread.title, "Thread title")
        self.assertTrue(thread.visible_for_teachers)
        self.assertFalse(thread.can_be_answered)

    def test_get_thread(self):
        post = Post.objects.create(nickname="user7", content="Thread post")
        thread = Thread.objects.create(
            post=post,
            category="Q&A",
            title="Important topic",
            visible_for_teachers=False,
            can_be_answered=True
        )
        data = get_thread(post.id)
        self.assertEqual(data["title"], "Important topic")
        self.assertEqual(data["nickname"], "user7")

    def test_update_thread(self):
        post = Post.objects.create(nickname="user8", content="Another thread")
        thread = Thread.objects.create(post=post, category="Fun", title="Old title")
        update_thread(post.id, "New title")
        thread.refresh_from_db()
        self.assertEqual(thread.title, "New title")

    def test_delete_thread(self):
        post = Post.objects.create(nickname="user9", content="Thread to delete")
        Thread.objects.create(post=post, category="Delete", title="Bye")
        delete_thread(post.id)
        self.assertFalse(Post.objects.filter(id=post.id).exists())
        self.assertFalse(Thread.objects.filter(post_id=post.id).exists())


class PostAPITestCase(APITestCase):
    def setUp(self):
        self.post = Post.objects.create(
            nickname='TestUser',
            content='This is a test post.'
        )
        self.list_create_url = reverse('post-list-create')
        self.detail_url = reverse('post-detail', kwargs={'pk':self.post.pk})

    def test_list_posts(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_post(self):
        data = {
            'nickname':'AnotherUser',
            'content':'New content'
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 2)

    def test_retrieve_post(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nickname'], self.post.nickname)

    def test_update_post(self):
        data = {
            'content':'Updated content'
        }
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Odśwież post z bazy danych
        self.post.refresh_from_db()
        self.assertEqual(self.post.content, 'Updated content')

        # Teraz sprawdzimy czy was_edited zmienia się na True
        self.assertTrue(self.post.was_edited)

    def test_delete_post(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(pk=self.post.pk).exists())


class ThreadAPITestCase(APITestCase):
    def setUp(self):
        # Tworzymy post
        self.post = Post.objects.create(
            nickname='TestUser',
            content='This is a test post.'
        )

        # Tworzymy wątek związany z postem
        self.thread = Thread.objects.create(
            post=self.post,
            category='General',
            title='Test Thread',
            visible_for_teachers=False,
            can_be_answered=True
        )

        self.list_create_url = reverse('thread-list-create')
        self.detail_url = reverse('thread-detail',
                                  kwargs={'pk':self.thread.pk})

    def test_list_threads(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_thread(self):
        new_post = Post.objects.create(
            nickname='NewTestUser',
            content='This is a new test post.'
        )
        data = {
            'post': new_post.pk,  # Związane z istniejącym postem
            'category':'Math',
            'title':'Math Discussion',
            'visible_for_teachers':True,
            'can_be_answered':False
        }
        response = self.client.post(self.list_create_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Thread.objects.count(), 2)

    def test_retrieve_thread(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.thread.title)

    def test_update_thread(self):
        data = {
            'title':'Updated Thread Title'
        }
        response = self.client.patch(self.detail_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Odśwież wątek z bazy danych
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.title, 'Updated Thread Title')

    def test_delete_thread(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Thread.objects.filter(pk=self.thread.pk).exists())


class NewThreadModelTests(TestCase):
    """Tests for the refactored Thread model without placeholder posts."""
    
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            email='test@edu.p.lodz.pl',
            first_name='Test',
            last_name='User',
            login='123456',
            role='student',
            password='testpassword'
        )
    
    def test_create_thread_without_placeholder_post(self):
        """Test that creating a thread doesn't create placeholder posts."""
        initial_post_count = Post.objects.count()
        
        thread_id = create_thread(
            title="Test Thread",
            content="Test content",
            category="general",
            nickname="TestUser"
        )
        
        # No new posts should be created
        self.assertEqual(Post.objects.count(), initial_post_count)
        
        # Thread should exist and have correct data
        thread = Thread.objects.get(id=thread_id)
        self.assertEqual(thread.title, "Test Thread")
        self.assertEqual(thread.content, "Test content")
        self.assertEqual(thread.category, "general")
        self.assertEqual(thread.nickname, "TestUser")
        self.assertFalse(thread.is_anonymous)
        
    def test_create_anonymous_thread(self):
        """Test creating an anonymous thread."""
        thread_id = create_thread(
            title="Anonymous Thread",
            content="Anonymous content",
            category="general",
            nickname="AnonUser",
            is_anonymous=True
        )
        
        thread = Thread.objects.get(id=thread_id)
        self.assertTrue(thread.is_anonymous)
        self.assertEqual(thread.nickname, "AnonUser")
        self.assertIsNone(thread.author)
        
    def test_create_authenticated_thread(self):
        """Test creating a thread with authenticated user."""
        thread_id = create_thread(
            title="User Thread",
            content="User content",
            category="exams",
            nickname="UserNick",
            user=self.user,
            is_anonymous=False
        )
        
        thread = Thread.objects.get(id=thread_id)
        self.assertEqual(thread.author, self.user)
        self.assertFalse(thread.is_anonymous)
        self.assertEqual(thread.nickname, "UserNick")
        
    def test_thread_post_relationship(self):
        """Test that posts can still be associated with threads."""
        thread_id = create_thread(
            title="Test Thread",
            content="Content",
            category="general"
        )
        thread = Thread.objects.get(id=thread_id)
        
        # Create a post associated with the thread
        post = Post.objects.create(
            nickname="TestUser",
            content="Reply to thread",
            thread=thread
        )
        
        self.assertEqual(thread.posts.count(), 1)
        self.assertEqual(thread.posts.first().content, "Reply to thread")
        
    def test_thread_serializer_without_posts(self):
        """Test ThreadSerializer works with standalone threads."""
        from mainapp.post import ThreadSerializer
        
        thread = Thread.objects.create(
            title="Serializer Test",
            content="Test content",
            category="general",
            nickname="SerializerUser"
        )
        
        serializer = ThreadSerializer(thread)
        data = serializer.data
        
        self.assertEqual(data['title'], "Serializer Test")
        self.assertEqual(data['content'], "Test content")
        self.assertEqual(data['category'], "general")
        self.assertEqual(data['nickname'], "SerializerUser")
        self.assertEqual(len(data['posts']), 0)
        
    def test_thread_serializer_with_posts(self):
        """Test ThreadSerializer includes associated posts."""
        from mainapp.post import ThreadSerializer
        
        thread = Thread.objects.create(
            title="Thread with Posts",
            content="Original content",
            category="assignments",
            nickname="ThreadAuthor"
        )
        
        # Add some posts to the thread
        Post.objects.create(
            nickname="Responder1",
            content="First response",
            thread=thread
        )
        Post.objects.create(
            nickname="Responder2",
            content="Second response",
            thread=thread
        )
        
        serializer = ThreadSerializer(thread)
        data = serializer.data
        
        self.assertEqual(len(data['posts']), 2)
        self.assertEqual(data['posts'][0]['content'], "First response")
        self.assertEqual(data['posts'][1]['content'], "Second response")
        
    def test_thread_author_display_name(self):
        """Test author display name generation."""
        from mainapp.post import ThreadSerializer
        
        # Test anonymous thread
        anon_thread = Thread.objects.create(
            title="Anonymous Thread",
            content="Content",
            category="general",
            nickname="AnonNick",
            is_anonymous=True
        )
        
        serializer = ThreadSerializer(anon_thread)
        self.assertEqual(serializer.data['author_display_name'], "AnonNick")
        
        # Test authenticated user thread
        auth_thread = Thread.objects.create(
            title="Auth Thread",
            content="Content",
            category="general",
            nickname="AuthNick",
            author=self.user,
            is_anonymous=False
        )
        
        serializer = ThreadSerializer(auth_thread)
        expected_name = f"{self.user.first_name} {self.user.last_name} {self.user.login}"
        self.assertEqual(serializer.data['author_display_name'], expected_name)
        
    def test_legacy_create_thread_compatibility(self):
        """Test that legacy create_thread function still works."""
        initial_post_count = Post.objects.count()
        
        thread_id = create_thread_legacy(
            nickname="LegacyUser",
            content="Legacy content",
            category="general",
            title="Legacy Thread",
            visibleforteachers=True,
            canbeanswered=False,
            user=self.user,
            is_anonymous=False
        )
        
        # Should not create placeholder posts
        self.assertEqual(Post.objects.count(), initial_post_count)
        
        thread = Thread.objects.get(id=thread_id)
        self.assertEqual(thread.title, "Legacy Thread")
        self.assertEqual(thread.content, "Legacy content")
        self.assertTrue(thread.visible_for_teachers)
        self.assertFalse(thread.can_be_answered)
        
    def test_get_thread_by_id(self):
        """Test getting thread by new ID format."""
        thread = Thread.objects.create(
            title="Get Test Thread",
            content="Get test content",
            category="technical",
            nickname="GetTestUser"
        )
        
        result = get_thread(thread.id)
        
        self.assertIsNotNone(result)
        self.assertEqual(result['id'], thread.id)
        self.assertEqual(result['title'], "Get Test Thread")
        self.assertEqual(result['content'], "Get test content")
        self.assertEqual(result['category'], "technical")
        
    def test_update_thread_new_format(self):
        """Test updating thread with new format."""
        thread = Thread.objects.create(
            title="Original Title",
            content="Original content",
            category="general",
            nickname="UpdateUser"
        )
        
        update_thread(thread.id, "Updated Title", "Updated content")
        
        thread.refresh_from_db()
        self.assertEqual(thread.title, "Updated Title")
        self.assertEqual(thread.content, "Updated content")
        
    def test_delete_thread_new_format(self):
        """Test deleting thread with new format."""
        thread = Thread.objects.create(
            title="Delete Test",
            content="To be deleted",
            category="general",
            nickname="DeleteUser"
        )
        thread_id = thread.id
        
        delete_thread(thread_id)
        
        self.assertFalse(Thread.objects.filter(id=thread_id).exists())


class ThreadAPIIntegrationTests(APITestCase):
    """Integration tests for Thread API with new model structure."""
    
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            email='api@edu.p.lodz.pl',
            first_name='API',
            last_name='User',
            login='999999',
            role='student',
            password='apipassword'
        )
        
    def test_create_thread_api_endpoint(self):
        """Test thread creation via API doesn't create placeholder posts."""
        initial_post_count = Post.objects.count()
        
        data = {
            'title': 'API Test Thread',
            'content': 'Test content via API',
            'category': 'general',
            'nickname': 'APIUser',
            'visible_for_teachers': False,
            'can_be_answered': True,
            'is_anonymous': True
        }
        
        response = self.client.post('/create-thread/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), initial_post_count)  # No new posts
        
        # Verify thread was created correctly
        thread = Thread.objects.get(title='API Test Thread')
        self.assertEqual(thread.content, 'Test content via API')
        self.assertEqual(thread.category, 'general')
        self.assertTrue(thread.is_anonymous)
        
    def test_thread_api_response_format(self):
        """Test that API response maintains expected format for frontend."""
        data = {
            'title': 'Format Test Thread',
            'content': 'Format test content',
            'category': 'exams',
            'nickname': 'FormatUser',
            'visible_for_teachers': True,
            'can_be_answered': False,
            'is_anonymous': False
        }
        
        response = self.client.post('/create-thread/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check response structure
        thread_data = response.data
        expected_fields = [
            'id', 'title', 'content', 'category', 'nickname',
            'visible_for_teachers', 'can_be_answered', 'is_anonymous',
            'posts', 'date', 'user', 'author_display_name', 'last_activity_date'
        ]
        
        for field in expected_fields:
            self.assertIn(field, thread_data, f"Missing field: {field}")
            
        self.assertEqual(thread_data['title'], 'Format Test Thread')
        self.assertEqual(thread_data['content'], 'Format test content')
        self.assertEqual(thread_data['category'], 'exams')
        self.assertTrue(thread_data['visible_for_teachers'])
        self.assertFalse(thread_data['can_be_answered'])
        
    def test_authenticated_user_thread_creation(self):
        """Test creating thread as authenticated user."""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'title': 'Authenticated Thread',
            'content': 'Content from authenticated user',
            'category': 'courses',
            'visible_for_teachers': False,
            'can_be_answered': True,
            'is_anonymous': False
        }
        
        response = self.client.post('/create-thread/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        thread = Thread.objects.get(title='Authenticated Thread')
        self.assertEqual(thread.author, self.user)
        self.assertFalse(thread.is_anonymous)
        
        # Check that author_display_name is properly formatted
        expected_display_name = f"{self.user.first_name} {self.user.last_name} {self.user.login}"
        self.assertEqual(response.data['author_display_name'], expected_display_name)