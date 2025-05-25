from django.db import models
from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

class Post(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                           related_name='posts', null=True, blank=True)
    nickname = models.CharField(max_length=63, default="Anonymous User")
    content = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    was_edited = models.BooleanField(default=False)
    thread = models.ForeignKey('Thread', on_delete=models.CASCADE,
                               related_name='posts', null=True, blank=True)
    replying_to = models.ManyToManyField('self', symmetrical=False,
                                                       related_name='replies', blank=True)
    is_anonymous = models.BooleanField(default=False)
class PostSerializer(serializers.ModelSerializer):
    replies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    replying_to = serializers.PrimaryKeyRelatedField(many=True,
                                                    queryset=Post.objects.all(),
                                                    required=False)
    user_display_name = serializers.SerializerMethodField()
    
    def get_user_display_name(self, obj):
        if obj.is_anonymous:
            return obj.nickname
        elif obj.user:
            if obj.user.role == 'student':
                return f"{obj.user.first_name} {obj.user.last_name} {obj.user.login}"
            else:
                return f"{obj.user.first_name} {obj.user.last_name}"
        else:
            return obj.nickname
            
    class Meta:
        model = Post
        fields = ['id', 'user', 'nickname', 'content', 'date', 'was_edited', 
                  'thread', 'replying_to', 'replies', 'is_anonymous', 'user_display_name']

class Thread(models.Model):
    # Primary key (auto-generated)
    id = models.AutoField(primary_key=True)
    
    # Thread content and metadata
    title = models.CharField(max_length=1023)
    content = models.TextField()
    category = models.CharField(max_length=63)
    
    # Author information
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                              related_name='authored_threads', null=True, blank=True)
    nickname = models.CharField(max_length=63, default="Anonymous User")
    is_anonymous = models.BooleanField(default=False)
    
    # Thread settings
    visible_for_teachers = models.BooleanField(default=False)
    can_be_answered = models.BooleanField(default=True)
    
    # Timestamps
    created_date = models.DateTimeField(auto_now_add=True)
    last_activity_date = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.category})"
class ThreadSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    author_display_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    
    def get_author_display_name(self, obj):
        if obj.is_anonymous:
            return obj.nickname
        elif obj.author:
            if obj.author.role == 'student':
                return f"{obj.author.first_name} {obj.author.last_name} {obj.author.login}"
            else:
                return f"{obj.author.first_name} {obj.author.last_name}"
        return obj.nickname or "Anonymous"
    
    def get_date(self, obj):
        return obj.created_date or obj.last_activity_date
    
    def get_user(self, obj):
        return obj.author.id if obj.author else None
            
    class Meta:
        model = Thread
        fields = [
            'id', 'category', 'title', 'content', 'nickname', 'date',
            'visible_for_teachers', 'can_be_answered', 'last_activity_date',
            'posts', 'is_anonymous', 'user', 'author_display_name'
        ]

def create_post(nickname, content, replying_to_ids=None, thread_id=None, user=None, is_anonymous=False):
    post = Post.objects.create(
        nickname=nickname, 
        content=content, 
        thread_id=thread_id,
        user=user,
        is_anonymous=is_anonymous
    )
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

def delete_post(post_id, user=None):
    """
    Delete a post only if the user is the creator of the post.

    Args:
        post_id: ID of the post to delete
        user: The user attempting to delete the post

    Returns:
        tuple: (success, message) where success is a boolean and message is a string
    """
    try:
        post = Post.objects.get(id=post_id)

        # Check if user is the creator of the post
        if user and post.user and post.user.id == user.id:
            post.delete()
            return True, "Post deleted successfully"
        else:
            return False, "You do not have permission to delete this post. Only the post creator can delete it."
    except Post.DoesNotExist:
        return False, "Post not found"

def create_thread(title, content, category, nickname=None, visible_for_teachers=False, 
                 can_be_answered=True, user=None, is_anonymous=False):
    """Create a new thread without placeholder posts."""
    thread = Thread.objects.create(
        title=title,
        content=content,
        category=category,
        nickname=nickname or "Anonymous User",
        visible_for_teachers=visible_for_teachers,
        can_be_answered=can_be_answered,
        author=user,
        is_anonymous=is_anonymous
    )
    return thread.id

# Legacy function for backward compatibility during migration
def create_thread_legacy(nickname, content, category, title, visibleforteachers, canbeanswered, user=None, is_anonymous=False):
    """Legacy create_thread function for backward compatibility during migration."""
    return create_thread(
        title=title,
        content=content,
        category=category,
        nickname=nickname,
        visible_for_teachers=visibleforteachers,
        can_be_answered=canbeanswered,
        user=user,
        is_anonymous=is_anonymous
    )

def get_thread(thread_id):
    try:
        thread = Thread.objects.get(id=thread_id)
        
        return {
            "id": thread.id,
            "category": thread.category,
            "title": thread.title,
            "visible_for_teachers": thread.visible_for_teachers,
            "can_be_answered": thread.can_be_answered,
            "last_activity_date": thread.last_activity_date,
            "nickname": thread.nickname,
            "content": thread.content,
            "is_anonymous": thread.is_anonymous,
            "date": thread.created_date
        }
    except Thread.DoesNotExist:
        return None

def update_thread(thread_id, new_title=None, new_content=None):
    try:
        thread = Thread.objects.get(id=thread_id)
        if new_title:
            thread.title = new_title
        if new_content:
            thread.content = new_content
        thread.save()
    except Thread.DoesNotExist:
        pass

def delete_thread(thread_id):
    try:
        thread = Thread.objects.get(id=thread_id)
        thread.delete()
    except Thread.DoesNotExist:
        pass

