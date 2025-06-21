from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Advertisement(models.Model):
    CATEGORY_CHOICES = [
        ('announcement', 'Announcement'),
        ('sale', 'Sale'),
        ('buy', 'Buy'),
        ('service', 'Service'),
        ('event', 'Event'),
        ('lost_found', 'Lost & Found'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='advertisements')
    created_date = models.DateTimeField(auto_now_add=True)
    last_activity_date = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    contact_info = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    
    class Meta:
        ordering = ['-last_activity_date']
    
    def __str__(self):
        return self.title
    
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def save(self, *args, **kwargs):
        if self.is_expired():
            self.is_active = False
        super().save(*args, **kwargs)


class Comment(models.Model):
    advertisement = models.ForeignKey(Advertisement, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='noticeboard_comments')
    content = models.TextField()
    created_date = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    was_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_date']
    
    def __str__(self):
        return f'Comment by {self.author.username} on {self.advertisement.title}'
    
    def save(self, *args, **kwargs):
        # Save the comment first
        super().save(*args, **kwargs)
        
        # Then update advertisement's last activity date
        if self.advertisement_id:
            Advertisement.objects.filter(pk=self.advertisement_id).update(
                last_activity_date=timezone.now()
            )