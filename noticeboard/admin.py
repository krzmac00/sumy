from django.contrib import admin
from .models import Advertisement, Comment


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'created_date', 'is_active', 'expires_at']
    list_filter = ['category', 'is_active', 'created_date', 'expires_at']
    search_fields = ['title', 'content', 'author__username']
    readonly_fields = ['created_date', 'last_activity_date']
    

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['advertisement', 'author', 'is_public', 'created_date', 'was_edited']
    list_filter = ['is_public', 'was_edited', 'created_date']
    search_fields = ['content', 'author__username', 'advertisement__title']
    readonly_fields = ['created_date']