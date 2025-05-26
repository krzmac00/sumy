from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets, generics, filters, status, permissions
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from datetime import date, datetime

from .post import Post, Thread, PostSerializer, ThreadSerializer, Vote, VoteSerializer
from .post import vote_on_thread, vote_on_post
from .models import Event
from .serializers import EventSerializer
from .forms import EventForm
from .post import create_thread
from .permissions import IsOwnerOrReadOnly

# ---------- COMMON HOME ----------
def home(request):
    return HttpResponse("Hello World!")  # or keep "Jesteś na stronie głównej" if you prefer

# ---------- EVENT SECTION ----------
class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category']
    ordering_fields = ['date', 'time']

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = date.today()
        events = self.queryset.filter(date=today)
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category = request.query_params.get('category')
        if category:
            events = self.queryset.filter(category=category)
        else:
            events = self.queryset.none()
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        profile_id = self.request.query_params.get('profile_id')
        if profile_id:
            return Event.objects.filter(profile_id=profile_id)
        return Event.objects.all()

@api_view(['GET'])
def get_events_for_month(request):
    year = int(request.query_params.get('year', datetime.now().year))
    month = int(request.query_params.get('month', datetime.now().month))
    events = Event.objects.filter(date__year=year, date__month=month)
    events_data = [{"title": event.title, "date": event.date} for event in events]
    return Response(events_data)

def add_event(request):
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            event.profile = request.user
            event.save()
            return redirect('event_list')
    else:
        form = EventForm()
    return render(request, 'add_event.html', {'form': form})

def event_list(request):
    events = Event.objects.all().order_by('start_date', 'start_time')
    CATEGORY_COLORS = {}  # Define this or import if needed
    return render(request, 'event_list.html', {
        'events': events,
        'category_colors': CATEGORY_COLORS
    })

# ---------- POST SECTION ----------
class PostListCreateAPIView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    # No permission class needed here since we want to allow anyone to create posts
    # But users can only edit/delete their own posts (handled in PostRetrieveUpdateDestroyAPIView)

    def create(self, request, *args, **kwargs):
        try:
            print("Post creation request data:", request.data)

            # Make a mutable copy of the request data
            request_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

            # Ensure nickname is not blank
            if 'nickname' not in request_data or not request_data['nickname']:
                request_data['nickname'] = 'Anonymous User'

            # Get replying_to ids if present and remove from request data temporarily
            replying_to_ids = request_data.get('replying_to', [])
            if 'replying_to' in request_data:
                del request_data['replying_to']

            # Create serializer without replying_to
            serializer = self.get_serializer(data=request_data)

            if not serializer.is_valid():
                print("Serializer validation errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Add user and is_anonymous
            user = request.user if request.user.is_authenticated else None
            is_anonymous = request_data.get('is_anonymous', False)

            # Save the post
            post = serializer.save(user=user, is_anonymous=is_anonymous)

            # Add replying_to after post is created
            if replying_to_ids:
                # Convert string IDs to integers if needed
                if isinstance(replying_to_ids, list):
                    try:
                        replying_to_ids = [int(id) for id in replying_to_ids]
                    except (ValueError, TypeError):
                        pass  # Keep original if conversion fails
                post.replying_to.set(replying_to_ids)

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            print(f"Error creating post: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        is_anonymous = self.request.data.get('is_anonymous', False)
        serializer.save(user=user, is_anonymous=is_anonymous)

class PostRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def perform_update(self, serializer):
        serializer.save(was_edited=True)

# ---------- THREAD SECTION ----------
class ThreadListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ThreadSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['last_activity_date', 'date']
    ordering = ['-last_activity_date']

    def get_queryset(self):
        queryset = Thread.objects.all()
        user = self.request.user

        apply_blacklist = self.request.query_params.get("blacklist",
                                                        "on") != "off"

        if apply_blacklist:
            blacklist = getattr(user, 'blacklist', [])
            if isinstance(blacklist, str):
                try:
                    import json
                    blacklist = json.loads(blacklist)
                except Exception:
                    blacklist = []

            for phrase in blacklist:
                queryset = queryset.exclude(
                    Q(title__contains=phrase) | Q(content__contains=phrase)
                )

        return queryset

class ThreadRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_object(self):
        obj = super().get_object()
        # For permissions, we need to check if the requester is the thread author
        # This is a workaround since Thread model's primary key is from Post model
        # and the actual author is in thread_author field
        self.check_object_permissions(self.request, obj)
        return obj

    def check_object_permissions(self, request, obj):
        # For safe methods, allow anyone
        if request.method in permissions.SAFE_METHODS:
            return

        # For write methods, check if the user is the thread author
        if not request.user.is_authenticated:
            self.permission_denied(request)
            
        if obj.author and obj.author != request.user:
            self.permission_denied(
                request,
                message="You do not have permission to modify this thread. Only the thread creator can modify it."
            )

@api_view(['POST'])
def create_thread_with_post(request):
    try:
        data = request.data
        required_fields = ['content', 'category', 'title']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing required field: {field}'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine if anonymous post or authenticated user post
        is_anonymous = data.get('is_anonymous', False)
        user = request.user if request.user.is_authenticated else None
        
        # Need nickname for anonymous posts
        if is_anonymous and 'nickname' not in data:
            return Response({'error': 'Nickname required for anonymous posts'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use user name as default nickname if not anonymous
        nickname = data.get('nickname', '')
        if not is_anonymous and user and not nickname:
            if user.role == 'student':
                nickname = f"{user.first_name} {user.last_name} {user.login}"
            else:
                nickname = f"{user.first_name} {user.last_name}"
            
        with transaction.atomic():
            thread_id = create_thread(
                title=data['title'],
                content=data['content'],
                category=data['category'],
                nickname=nickname,
                visible_for_teachers=data.get('visible_for_teachers', False),
                can_be_answered=data.get('can_be_answered', True),
                user=user,
                is_anonymous=is_anonymous
            )
            thread = Thread.objects.get(id=thread_id)
            thread_data = ThreadSerializer(thread).data

            return Response(thread_data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# ---------- VOTING SECTION ----------
@api_view(['POST'])
def vote_thread(request, thread_id):
    """Vote on a thread (upvote or downvote)"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    vote_type = request.data.get('vote_type')
    if vote_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid vote type. Must be "upvote" or "downvote"'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    success, message, vote_count = vote_on_thread(request.user, thread_id, vote_type)
    
    if success:
        return Response({
            'message': message,
            'vote_count': vote_count,
            'user_vote': vote_type if 'withdrawn' not in message else None
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def vote_post(request, post_id):
    """Vote on a post (upvote or downvote)"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    vote_type = request.data.get('vote_type')
    if vote_type not in ['upvote', 'downvote']:
        return Response({'error': 'Invalid vote type. Must be "upvote" or "downvote"'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    success, message, vote_count = vote_on_post(request.user, post_id, vote_type)
    
    if success:
        return Response({
            'message': message,
            'vote_count': vote_count,
            'user_vote': vote_type if 'withdrawn' not in message else None
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
    