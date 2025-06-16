from django.db import models
from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Q
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
    
    def vote_count(self):
        """Calculate vote count as upvotes - downvotes"""
        upvotes = self.votes.filter(vote_type='upvote').count()
        downvotes = self.votes.filter(vote_type='downvote').count()
        return upvotes - downvotes
    
    def get_user_vote(self, user):
        """Get the current user's vote for this post"""
        if not user or not user.is_authenticated:
            return None
        try:
            vote = self.votes.get(user=user)
            return vote.vote_type
        except Vote.DoesNotExist:
            return None
class PostSerializer(serializers.ModelSerializer):
    replies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    replying_to = serializers.PrimaryKeyRelatedField(many=True,
                                                    queryset=Post.objects.all(),
                                                    required=False)
    user_display_name = serializers.SerializerMethodField()
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    can_vote = serializers.SerializerMethodField()
    author_profile_picture = serializers.SerializerMethodField()
    author_profile_thumbnail = serializers.SerializerMethodField()
    
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
    
    def get_vote_count(self, obj):
        return obj.vote_count()
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None
    
    def get_can_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # User cannot vote on their own posts (even anonymous ones)
        return obj.user != request.user
    
    def get_author_profile_picture(self, obj):
        if obj.is_anonymous or not obj.user:
            return None
        if obj.user.profile_picture:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.user.profile_picture.url)
                # Ensure it uses the correct protocol and host
                if 'localhost:8000' not in url:
                    url = url.replace(request.get_host(), 'localhost:8000')
                return url
            return f'http://localhost:8000{obj.user.profile_picture.url}'
        return None
    
    def get_author_profile_thumbnail(self, obj):
        if obj.is_anonymous or not obj.user:
            return None
        if obj.user.profile_thumbnail:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.user.profile_thumbnail.url)
                # Ensure it uses the correct protocol and host
                if 'localhost:8000' not in url:
                    url = url.replace(request.get_host(), 'localhost:8000')
                return url
            return f'http://localhost:8000{obj.user.profile_thumbnail.url}'
        return None
            
    class Meta:
        model = Post
        fields = ['id', 'user', 'nickname', 'content', 'date', 'was_edited', 
                  'thread', 'replying_to', 'replies', 'is_anonymous', 'user_display_name',
                  'vote_count', 'user_vote', 'can_vote', 'author_profile_picture', 
                  'author_profile_thumbnail']

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
    
    def vote_count(self):
        """Calculate vote count as upvotes - downvotes"""
        upvotes = self.votes.filter(vote_type='upvote').count()
        downvotes = self.votes.filter(vote_type='downvote').count()
        return upvotes - downvotes
    
    def get_user_vote(self, user):
        """Get the current user's vote for this thread"""
        if not user or not user.is_authenticated:
            return None
        try:
            vote = self.votes.get(user=user)
            return vote.vote_type
        except Vote.DoesNotExist:
            return None
    
    def __str__(self):
        return f"{self.title} ({self.category})"

class Vote(models.Model):
    VOTE_CHOICES = [
        ('upvote', 'Upvote'),
        ('downvote', 'Downvote'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=10, choices=VOTE_CHOICES)
    created_date = models.DateTimeField(auto_now_add=True)
    
    # Generic foreign key to vote on either Thread or Post
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes', null=True, blank=True)
    
    class Meta:
        # Ensure user can only vote once per thread or post
        constraints = [
            models.UniqueConstraint(fields=['user', 'thread'], name='unique_thread_vote_per_user'),
            models.UniqueConstraint(fields=['user', 'post'], name='unique_post_vote_per_user'),
        ]
        # Ensure vote is for either thread or post, not both
        # This will be enforced in the clean method
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if (self.thread and self.post) or (not self.thread and not self.post):
            raise ValidationError("Vote must be for either a thread or a post, not both or neither.")
        
        # Prevent users from voting on their own content
        if self.thread and self.thread.author == self.user:
            raise ValidationError("Users cannot vote on their own threads.")
        if self.post and self.post.user == self.user:
            raise ValidationError("Users cannot vote on their own posts.")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        target = self.thread.title if self.thread else f"Post {self.post.id}"
        return f"{self.user.username} {self.vote_type}d {target}"

class ThreadSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True, read_only=True)
    author_display_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    vote_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    can_vote = serializers.SerializerMethodField()
    author_profile_picture = serializers.SerializerMethodField()
    author_profile_thumbnail = serializers.SerializerMethodField()
    
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
    
    def get_vote_count(self, obj):
        return obj.vote_count()
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_user_vote(request.user)
        return None
    
    def get_can_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        # User cannot vote on their own threads (even anonymous ones)
        return obj.author != request.user
    
    def get_author_profile_picture(self, obj):
        if obj.is_anonymous or not obj.author:
            return None
        if obj.author.profile_picture:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.author.profile_picture.url)
                # Ensure it uses the correct protocol and host
                if 'localhost:8000' not in url:
                    url = url.replace(request.get_host(), 'localhost:8000')
                return url
            return f'http://localhost:8000{obj.author.profile_picture.url}'
        return None
    
    def get_author_profile_thumbnail(self, obj):
        if obj.is_anonymous or not obj.author:
            return None
        if obj.author.profile_thumbnail:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.author.profile_thumbnail.url)
                # Ensure it uses the correct protocol and host
                if 'localhost:8000' not in url:
                    url = url.replace(request.get_host(), 'localhost:8000')
                return url
            return f'http://localhost:8000{obj.author.profile_thumbnail.url}'
        return None
            
    class Meta:
        model = Thread
        fields = [
            'id', 'category', 'title', 'content', 'nickname', 'date',
            'visible_for_teachers', 'can_be_answered', 'last_activity_date',
            'posts', 'is_anonymous', 'user', 'author_display_name',
            'vote_count', 'user_vote', 'can_vote', 'author_profile_picture',
            'author_profile_thumbnail'
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

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = ['id', 'vote_type', 'created_date', 'thread', 'post']
        read_only_fields = ['id', 'created_date']

def vote_on_thread(user, thread_id, vote_type):
    """
    Vote on a thread. Returns (success, message, vote_count)
    """
    try:
        thread = Thread.objects.get(id=thread_id)
        
        # Check if user can vote (not their own thread)
        if thread.author == user:
            return False, "You cannot vote on your own thread", thread.vote_count()
        
        # Check if vote already exists
        try:
            existing_vote = Vote.objects.get(user=user, thread=thread)
            
            if existing_vote.vote_type == vote_type:
                # Same vote - withdraw it
                existing_vote.delete()
                return True, "Vote withdrawn", thread.vote_count()
            else:
                # Different vote - change it
                existing_vote.vote_type = vote_type
                existing_vote.save()
                return True, f"Vote changed to {vote_type}", thread.vote_count()
                
        except Vote.DoesNotExist:
            # Create new vote
            Vote.objects.create(user=user, thread=thread, vote_type=vote_type)
            return True, f"Voted {vote_type}", thread.vote_count()
            
    except Thread.DoesNotExist:
        return False, "Thread not found", 0

def vote_on_post(user, post_id, vote_type):
    """
    Vote on a post. Returns (success, message, vote_count)
    """
    try:
        post = Post.objects.get(id=post_id)
        
        # Check if user can vote (not their own post)
        if post.user == user:
            return False, "You cannot vote on your own post", post.vote_count()
        
        # Check if vote already exists
        try:
            existing_vote = Vote.objects.get(user=user, post=post)
            
            if existing_vote.vote_type == vote_type:
                # Same vote - withdraw it
                existing_vote.delete()
                return True, "Vote withdrawn", post.vote_count()
            else:
                # Different vote - change it
                existing_vote.vote_type = vote_type
                existing_vote.save()
                return True, f"Vote changed to {vote_type}", post.vote_count()
                
        except Vote.DoesNotExist:
            # Create new vote
            Vote.objects.create(user=user, post=post, vote_type=vote_type)
            return True, f"Voted {vote_type}", post.vote_count()
            
    except Post.DoesNotExist:
        return False, "Post not found", 0


class PinnedThread(models.Model):
    """Model to track threads pinned by users with last viewed timestamp."""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='pinned_threads'
    )
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name='pinned_by_users'
    )
    pinned_at = models.DateTimeField(auto_now_add=True)
    last_viewed = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ('user', 'thread')
        ordering = ['-pinned_at']
    
    def get_unread_count(self):
        """Calculate number of unread comments since last viewed."""
        return Post.objects.filter(
            thread=self.thread,
            date__gt=self.last_viewed
        ).count()
    
    def mark_as_viewed(self):
        """Update last_viewed timestamp to current time."""
        self.last_viewed = timezone.now()
        self.save(update_fields=['last_viewed'])
    
    def __str__(self):
        return f"{self.user.username} pinned {self.thread.title}"

