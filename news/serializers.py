from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import NewsCategory, NewsItem

User = get_user_model()


class NewsCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    full_path = serializers.SerializerMethodField()
    
    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug', 'parent', 'category_type', 'children', 'full_path', 'order']
        
    def get_children(self, obj):
        children = obj.children.all()
        return NewsCategorySerializer(children, many=True).data
    
    def get_full_path(self, obj):
        return [{'id': cat.id, 'name': cat.name, 'slug': cat.slug} for cat in obj.get_full_path()]


class NewsItemAuthorSerializer(serializers.ModelSerializer):
    """Serializer for news item authors"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'role', 'display_name']
        
    def get_display_name(self, obj):
        return f"{obj.first_name} {obj.last_name}" if obj.first_name and obj.last_name else obj.login


class NewsItemSerializer(serializers.ModelSerializer):
    author = NewsItemAuthorSerializer(read_only=True)
    categories = NewsCategorySerializer(many=True, read_only=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=NewsCategory.objects.all(),
        write_only=True,
        source='categories'
    )
    all_categories = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = NewsItem
        fields = [
            'id', 'title', 'content', 'author', 'categories', 'category_ids',
            'all_categories', 'created_at', 'updated_at', 'is_published',
            'event_date', 'event_location', 'can_edit'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
        
    def get_all_categories(self, obj):
        """Get all categories including parent categories"""
        all_cats = obj.get_all_categories()
        return NewsCategorySerializer(all_cats, many=True).data
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.author == request.user or request.user.role == 'admin'
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)