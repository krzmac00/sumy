from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .post import Vote, Post, Thread


@receiver(post_save, sender=Vote)
def update_vote_count_on_save(sender, instance, created, **kwargs):
    """Update vote count when a vote is created or updated"""
    if instance.thread:
        instance.thread.update_vote_count()
    if instance.post:
        instance.post.update_vote_count()


@receiver(post_delete, sender=Vote)
def update_vote_count_on_delete(sender, instance, **kwargs):
    """Update vote count when a vote is deleted"""
    try:
        if instance.thread:
            instance.thread.update_vote_count()
    except Thread.DoesNotExist:
        # Thread might be in the process of being deleted
        pass
    
    try:
        if instance.post:
            instance.post.update_vote_count()
    except Post.DoesNotExist:
        # Post might be in the process of being deleted
        pass


@receiver(post_save, sender=Post)
def update_thread_counts_on_post_save(sender, instance, created, **kwargs):
    """Update thread post count and last activity when a post is created"""
    if created and instance.thread:
        instance.thread.update_post_count()
        instance.thread.save(update_fields=['last_activity_date'])


@receiver(post_delete, sender=Post)
def update_thread_counts_on_post_delete(sender, instance, **kwargs):
    """Update thread post count when a post is deleted"""
    try:
        if instance.thread:
            instance.thread.update_post_count()
    except Thread.DoesNotExist:
        # Thread might be in the process of being deleted
        pass