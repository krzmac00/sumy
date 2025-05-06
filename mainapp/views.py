from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db import transaction
from datetime import date, datetime

from .models import Event, Post, Thread
from .serializers import EventSerializer, PostSerializer, ThreadSerializer
from .forms import EventForm
from .post import create_thread

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

class PostRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def perform_update(self, serializer):
        serializer.save(was_edited=True)

# ---------- THREAD SECTION ----------
class ThreadListCreateAPIView(generics.ListCreateAPIView):
    queryset = Thread.objects.select_related('post').all()
    serializer_class = ThreadSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['last_activity_date', 'post__date']
    ordering = ['-last_activity_date']

class ThreadRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Thread.objects.select_related('post').all()
    serializer_class = ThreadSerializer

@api_view(['POST'])
def create_thread_with_post(request):
    try:
        data = request.data
        required_fields = ['nickname', 'content', 'category', 'title']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing required field: {field}'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            thread_id = create_thread(
                nickname=data['nickname'],
                content=data['content'],
                category=data['category'],
                title=data['title'],
                visibleforteachers=data.get('visible_for_teachers', False),
                canbeanswered=data.get('can_be_answered', True)
            )
            thread = Thread.objects.select_related('post').get(post_id=thread_id)
            thread_data = ThreadSerializer(thread).data

            return Response(thread_data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    