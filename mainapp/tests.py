import pytest
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
from mainapp.post import create_thread, get_thread, update_thread, delete_thread

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