from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone

User = get_user_model()


class NewsCategory(models.Model):
    """Hierarchical category system for news"""
    CATEGORY_TYPES = [
        ('university', 'University-wide'),
        ('faculty', 'Faculty'),
        ('announcement', 'Announcement'),
        ('event', 'Event'),
    ]
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='children')
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPES)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name_plural = "News Categories"
        ordering = ['order', 'name']
        
    def __str__(self):
        if self.parent:
            return f"{self.parent} > {self.name}"
        return self.name
    
    def get_full_path(self):
        """Get full category path as a list"""
        path = []
        current = self
        while current:
            path.insert(0, current)
            current = current.parent
        return path


class NewsItem(models.Model):
    """News items that can only be created by lecturers and admins"""
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='news_items')
    categories = models.ManyToManyField(NewsCategory, related_name='news_items')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)
    
    # Optional fields for events
    event_date = models.DateTimeField(null=True, blank=True)
    event_location = models.CharField(max_length=255, null=True, blank=True)
    event_end_date = models.DateTimeField(null=True, blank=True)
    event_description = models.TextField(null=True, blank=True)
    event_room = models.CharField(max_length=100, null=True, blank=True)
    event_teacher = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        permissions = [
            ("can_create_news", "Can create news items"),
        ]
        
    def __str__(self):
        return self.title
    
    def get_all_categories(self):
        """Get all categories including parents"""
        all_categories = set()
        for category in self.categories.all():
            path = category.get_full_path()
            all_categories.update(path)
        return list(all_categories)
