from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Advertisement, Comment
from .serializers import (
    AdvertisementSerializer, 
    AdvertisementDetailSerializer, 
    CommentSerializer
)
from .permissions import IsOwnerOrReadOnly, IsCommentOwnerOrAdvertisementOwner


class AdvertisementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Advertisement model.
    Only authenticated users can create advertisements.
    Only owners can update/delete their advertisements.
    """
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'location']
    ordering_fields = ['created_date', 'last_activity_date', 'price']
    ordering = ['-last_activity_date']
    filterset_fields = ['category', 'is_active']
    pagination_class = None  # Disable pagination for noticeboard
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action in ['list', 'retrieve']:
            # Allow anyone to view advertisements
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            # Only authenticated users can create
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Only owners can update/delete
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Advertisement.objects.select_related('author')
        
        # Filter out expired advertisements unless viewing own
        if self.request.user.is_authenticated:
            # Show all own advertisements (including expired)
            own_ads = Q(author=self.request.user)
            # Show active non-expired ads from others
            active_ads = Q(is_active=True) & (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
            queryset = queryset.filter(own_ads | active_ads)
        else:
            # Unauthenticated users only see active, non-expired ads
            queryset = queryset.filter(
                is_active=True
            ).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
            )
        
        # Additional filters from query params
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdvertisementDetailSerializer
        return AdvertisementSerializer
    
    @action(detail=True, methods=['get', 'post'], 
            permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, pk=None):
        """
        GET: List comments for an advertisement (filtered by visibility rules)
        POST: Create a new comment on the advertisement
        """
        advertisement = self.get_object()
        
        if request.method == 'GET':
            # Apply visibility filtering
            if advertisement.author == request.user:
                # Ad owner sees all comments
                comments = advertisement.comments.all()
            else:
                # Others see public comments + their own
                comments = advertisement.comments.filter(
                    Q(is_public=True) | Q(author=request.user)
                ).distinct()
            
            serializer = CommentSerializer(
                comments, 
                many=True, 
                context={'request': request}
            )
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = CommentSerializer(
                data=request.data, 
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save(advertisement=advertisement, author=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], 
            permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly])
    def renew(self, request, pk=None):
        """
        Renew/extend the expiration date of an advertisement
        """
        advertisement = self.get_object()
        days_to_extend = request.data.get('days', 30)  # Default 30 days
        
        try:
            days_to_extend = int(days_to_extend)
            if days_to_extend <= 0 or days_to_extend > 90:
                return Response(
                    {'error': 'Days must be between 1 and 90'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Invalid days value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate new expiration date
        if advertisement.expires_at and advertisement.expires_at > timezone.now():
            # Extend from current expiration
            new_expiration = advertisement.expires_at + timezone.timedelta(days=days_to_extend)
        else:
            # Set new expiration from now
            new_expiration = timezone.now() + timezone.timedelta(days=days_to_extend)
        
        advertisement.expires_at = new_expiration
        advertisement.is_active = True
        advertisement.save()
        
        serializer = self.get_serializer(advertisement)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comment model.
    Only authenticated users can interact with comments.
    Visibility rules are enforced through permissions and queryset filtering.
    """
    serializer_class = CommentSerializer
    permission_classes = [IsCommentOwnerOrAdvertisementOwner]
    
    def get_queryset(self):
        # Users can only see comments they have permission to view
        user = self.request.user
        
        # Get all comments where:
        # 1. User is the comment author
        # 2. User is the advertisement owner
        # 3. Comment is public
        return Comment.objects.select_related('author', 'advertisement__author').filter(
            Q(author=user) |
            Q(advertisement__author=user) |
            Q(is_public=True)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=True, methods=['post'], 
            permission_classes=[permissions.IsAuthenticated])
    def toggle_visibility(self, request, pk=None):
        """
        Toggle comment visibility between public and private.
        Only comment author can toggle visibility.
        """
        comment = self.get_object()
        
        if comment.author != request.user:
            return Response(
                {'error': 'Only comment author can change visibility'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        comment.is_public = not comment.is_public
        comment.save()
        
        serializer = self.get_serializer(comment)
        return Response(serializer.data)