from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from .models import Advertisement, Comment

User = get_user_model()


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'first_name', 'last_name']


class CommentSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_view = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'advertisement', 'author', 'content', 
            'created_date', 'is_public', 'was_edited',
            'can_edit', 'can_view'
        ]
        read_only_fields = ['created_date', 'was_edited', 'advertisement']
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.author == request.user
    
    def get_can_view(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.is_public
        
        # Author can always see their own comment
        if obj.author == request.user:
            return True
        
        # Advertisement owner can see all comments
        if obj.advertisement.author == request.user:
            return True
        
        # Others can only see public comments
        return obj.is_public
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Mark as edited if content changes
        if 'content' in validated_data and validated_data['content'] != instance.content:
            validated_data['was_edited'] = True
        return super().update(instance, validated_data)


class AdvertisementSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Advertisement
        fields = [
            'id', 'title', 'content', 'category', 'author',
            'created_date', 'last_activity_date', 'is_active',
            'expires_at', 'contact_info', 'price', 'location',
            'comments_count', 'is_expired', 'can_edit'
        ]
        read_only_fields = ['created_date', 'last_activity_date']
    
    def get_comments_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.comments.filter(is_public=True).count()
        
        # If user is the advertisement author, show all comments
        if obj.author == request.user:
            return obj.comments.count()
        
        # Otherwise, show public comments + user's own comments
        return obj.comments.filter(
            models.Q(is_public=True) | models.Q(author=request.user)
        ).distinct().count()
    
    def get_is_expired(self, obj):
        return obj.is_expired()
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.author == request.user or request.user.is_staff
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future.")
        return value


class AdvertisementDetailSerializer(AdvertisementSerializer):
    comments = serializers.SerializerMethodField()
    
    class Meta(AdvertisementSerializer.Meta):
        fields = AdvertisementSerializer.Meta.fields + ['comments']
    
    def get_comments(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            # Unauthenticated users see only public comments
            comments = obj.comments.filter(is_public=True)
        elif obj.author == request.user:
            # Advertisement owner sees all comments
            comments = obj.comments.all()
        else:
            # Other authenticated users see public comments + their own
            comments = obj.comments.filter(
                models.Q(is_public=True) | models.Q(author=request.user)
            ).distinct()
        
        return CommentSerializer(comments, many=True, context=self.context).data