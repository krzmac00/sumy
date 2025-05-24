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
    post = models.OneToOneField(Post, on_delete=models.CASCADE, primary_key=True, related_name='thread_details')
    category = models.CharField(max_length=63)
    title = models.CharField(max_length=1023)
    visible_for_teachers = models.BooleanField(default=False)
    can_be_answered = models.BooleanField(default=True)
    last_activity_date = models.DateTimeField(auto_now=True)
    
    # Fields for the new model schema - will be properly migrated in a separate step
    content = models.TextField(null=True, blank=True)
    thread_author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                            related_name='authored_threads', null=True, blank=True)
    thread_nickname = models.CharField(max_length=63, null=True, blank=True)
    thread_is_anonymous = models.BooleanField(null=True, blank=True)
    thread_date = models.DateTimeField(null=True, blank=True)
class ThreadSerializer(serializers.ModelSerializer):
    nickname = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    is_anonymous = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    author_display_name = serializers.SerializerMethodField()
    posts = PostSerializer(many=True, read_only=True)
    
    def get_nickname(self, obj):
        # Prefer the dedicated thread nickname field if available
        if obj.thread_nickname:
            return obj.thread_nickname
        # Fall back to the associated post's nickname
        return obj.post.nickname if obj.post else "Anonymous"
    
    def get_content(self, obj):
        # Prefer the dedicated thread content field if available
        if obj.content:
            return obj.content
        # Fall back to the associated post's content
        return obj.post.content if obj.post else ""
    
    def get_is_anonymous(self, obj):
        # Prefer the dedicated thread is_anonymous field if available
        if obj.thread_is_anonymous is not None:
            return obj.thread_is_anonymous
        # Fall back to the associated post's is_anonymous
        return obj.post.is_anonymous if obj.post else False
    
    def get_date(self, obj):
        # Prefer the dedicated thread date field if available
        if obj.thread_date:
            return obj.thread_date
        # Fall back to the associated post's date
        return obj.post.date if obj.post else obj.last_activity_date
    
    def get_user(self, obj):
        # Prefer the dedicated thread author field if available
        if obj.thread_author:
            return obj.thread_author.id
        # Fall back to the associated post's user
        return obj.post.user.id if obj.post and obj.post.user else None
    
    def get_author_display_name(self, obj):
        # Use thread-specific fields if available
        if obj.thread_is_anonymous:
            return obj.thread_nickname
        elif obj.thread_author:
            if obj.thread_author.role == 'student':
                return f"{obj.thread_author.first_name} {obj.thread_author.last_name} {obj.thread_author.login}"
            else:
                return f"{obj.thread_author.first_name} {obj.thread_author.last_name}"
        
        # Fall back to associated post behavior
        if hasattr(obj, 'post') and obj.post:
            if obj.post.is_anonymous:
                return obj.post.nickname
            elif obj.post.user:
                if obj.post.user.role == 'student':
                    return f"{obj.post.user.first_name} {obj.post.user.last_name} {obj.post.user.login}"
                else:
                    return f"{obj.post.user.first_name} {obj.post.user.last_name}"
            else:
                return obj.post.nickname
        
        return "Anonymous"
            
    class Meta:
        model = Thread
        fields = [
            'post', 'category', 'title', 'content', 'nickname', 'date',
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

def create_thread(nickname, content, category, title, visibleforteachers, canbeanswered, user=None, is_anonymous=False):
    # Create placeholder post for compatibility
    post = Post.objects.create(
        nickname="Placeholder", 
        content="This is a placeholder post for thread compatibility",
        user=None,
        is_anonymous=True
    )
    
    # Create thread with both old and new fields
    thread = Thread.objects.create(
        post=post,
        category=category,
        title=title,
        visible_for_teachers=visibleforteachers,
        can_be_answered=canbeanswered,
        # New fields
        content=content,
        thread_author=user,
        thread_nickname=nickname,
        thread_is_anonymous=is_anonymous,
        thread_date=timezone.now()
    )
    
    return thread.post.id

def get_thread(thread_id):
    try:
        thread = Thread.objects.get(post_id=thread_id)
        
        # Use new fields if available, otherwise fall back to post fields
        nickname = thread.thread_nickname if thread.thread_nickname else thread.post.nickname
        content = thread.content if thread.content else thread.post.content
        is_anonymous = thread.thread_is_anonymous if thread.thread_is_anonymous is not None else thread.post.is_anonymous
        date = thread.thread_date if thread.thread_date else thread.post.date
        
        return {
            "id": thread.post.id,
            "category": thread.category,
            "title": thread.title,
            "visible_for_teachers": thread.visible_for_teachers,
            "can_be_answered": thread.can_be_answered,
            "last_activity_date": thread.last_activity_date,
            "nickname": nickname,
            "content": content,
            "is_anonymous": is_anonymous,
            "date": date
        }
    except Thread.DoesNotExist:
        return None

def update_thread(thread_id, new_title=None, new_content=None):
    try:
        thread = Thread.objects.get(post_id=thread_id)
        if new_title:
            thread.title = new_title
        if new_content:
            thread.content = new_content
        thread.save()
    except Thread.DoesNotExist:
        pass

def delete_thread(thread_id):
    # Find the thread and delete both it and its post
    try:
        thread = Thread.objects.get(post_id=thread_id)
        post_id = thread.post.id
        thread.delete()
        Post.objects.filter(id=post_id).delete()
    except Thread.DoesNotExist:
        pass

