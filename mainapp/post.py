from django.db import models
from rest_framework import serializers

class Post(models.Model):
    nickname = models.CharField(max_length=63)
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    was_edited = models.BooleanField(default=False)
    thread = models.ForeignKey('Thread', on_delete=models.CASCADE,
                               related_name='posts', null=True, blank=True)
    replying_to = models.ManyToManyField('self', symmetrical=False,
                                                       related_name='replies', blank=True)
class PostSerializer(serializers.ModelSerializer):
    replies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    replying_to = serializers.PrimaryKeyRelatedField(many=True,
                                                     queryset=Post.objects.all())
    class Meta:
        model = Post
        fields = '__all__'

class Thread(models.Model):
    post = models.OneToOneField(Post, on_delete=models.CASCADE, primary_key=True, related_name='thread_details')
    category = models.CharField(max_length=63)
    title = models.CharField(max_length=1023)
    visible_for_teachers = models.BooleanField(default=False)
    can_be_answered = models.BooleanField(default=True)
    last_activity_date = models.DateTimeField(auto_now=True)
class ThreadSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source='post.nickname', read_only=True)
    content = serializers.CharField(source='post.content', read_only=True)
    posts = PostSerializer(many=True, read_only=True)
    class Meta:
        model = Thread
        fields = [
            'post', 'category', 'title', 'visible_for_teachers',
            'can_be_answered', 'last_activity_date', 'nickname', 'content', 'posts'
        ]

def create_post(nickname, content, replying_to_ids=None, thread_id=None):
    post = Post.objects.create(nickname=nickname, content=content, thread_id=thread_id)
    if replying_to_ids:
        post.replying_to.set(replying_to_ids)
    return post.id

def get_post(post_id):
    try:
        post = Post.objects.select_related('thread').get(id=post_id)
        return {
            "id":post.id,
            "nickname":post.nickname,
            "content":post.content,
            "date":post.date,
            "was_edited":post.was_edited,
            "thread_id":post.thread.id if post.thread else None,
            "replies":PostSerializer(post.replies.all(), many=True).data
        }
    except Post.DoesNotExist:
        return None

def update_post(post_id, new_content):
    try:
        post = Post.objects.get(id=post_id)
        post.content = new_content
        post.was_edited = True
        post.save()
    except Post.DoesNotExist:
        pass

def delete_post(post_id):
    Post.objects.filter(id=post_id).delete()

def create_thread(nickname, content, category, title, visibleforteachers, canbeanswered):
    post = Post.objects.create(nickname=nickname, content=content)
    thread = Thread.objects.create(
        post=post,
        category=category,
        title=title,
        visible_for_teachers=visibleforteachers,
        can_be_answered=canbeanswered
    )
    return thread.post.id

def get_thread(thread_id):
    try:
        thread = Thread.objects.select_related('post').get(post_id=thread_id)
        return {
            "id": thread.post.id,
            "category": thread.category,
            "title": thread.title,
            "visible_for_teachers": thread.visible_for_teachers,
            "can_be_answered": thread.can_be_answered,
            "last_activity_date": thread.last_activity_date,
            "nickname": thread.post.nickname,
            "content": thread.post.content
        }
    except Thread.DoesNotExist:
        return None

def update_thread(thread_id, new_title):
    try:
        thread = Thread.objects.get(post_id=thread_id)
        thread.title = new_title
        thread.save()
    except Thread.DoesNotExist:
        pass

def delete_thread(thread_id):
    Post.objects.filter(id=thread_id).delete()

