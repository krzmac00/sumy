from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from datetime import datetime
from .models import NewsCategory, NewsItem
from .serializers import NewsCategorySerializer, NewsItemSerializer


class IsLecturerOrAdmin(permissions.BasePermission):
    """Permission class to check if user is lecturer or admin"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['lecturer', 'admin']


class NewsCategoryListView(generics.ListAPIView):
    """List all news categories in hierarchical structure"""
    serializer_class = NewsCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories
    
    def get_queryset(self):
        # Return only root categories, children will be included via serializer
        return NewsCategory.objects.filter(parent=None)


class NewsItemListView(generics.ListAPIView):
    """List all published news items with filtering"""
    serializer_class = NewsItemSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = NewsItem.objects.filter(is_published=True).prefetch_related('categories', 'author')
        
        # Filter by categories
        category_ids = self.request.query_params.getlist('category')
        if category_ids:
            # Include news items that have any of the selected categories
            queryset = queryset.filter(categories__in=category_ids).distinct()
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from)
                queryset = queryset.filter(created_at__gte=date_from)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to)
                queryset = queryset.filter(created_at__lte=date_to)
            except ValueError:
                pass
        
        # Search in title and content
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )
        
        return queryset


class NewsItemCreateView(generics.CreateAPIView):
    """Create news items - only for lecturers and admins"""
    serializer_class = NewsItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsLecturerOrAdmin]
    
    def perform_create(self, serializer):
        # When categories are selected, also add parent categories
        news_item = serializer.save()
        
        # Get all categories including parents
        all_categories = set()
        for category in news_item.categories.all():
            path = category.get_full_path()
            all_categories.update(path)
        
        # Update the categories
        news_item.categories.set(all_categories)


class NewsItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View, update, or delete a news item"""
    serializer_class = NewsItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = NewsItem.objects.all()
    
    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        
        # For update/delete, check if user is author or admin
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if not (obj.author == request.user or request.user.role == 'admin'):
                self.permission_denied(
                    request,
                    message="You don't have permission to modify this news item."
                )
