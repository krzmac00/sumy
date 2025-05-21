from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import api_view, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
from rest_framework.response import Response
from datetime import date
from .models import Event
from .constants import CATEGORY_COLORS
from .forms import EventForm
from .serializers import EventSerializer
from django.http import HttpResponse
from rest_framework.decorators import api_view
from django.shortcuts import render, redirect


def home(request):
    return HttpResponse("Jesteś na stronie głównej")

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
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
        if self.request.user.is_authenticated:
            return Event.objects.filter(user=self.request.user)
        return Event.objects.none()

    @action(detail=False, methods=['POST'])
    @transaction.atomic
    def save_calendar(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
           Event.objects.filter(user=user).delete() 
           events_data = request.data.get('events', [])
           created_events = []
           for event_data in events_data:
               event_data['user'] = user.id
               serializer = self.get_serializer(data=event_data)
               serializer.is_valid(raise_exception=True)  
               serializer.save()
               created_events.append(serializer.data)
           return Response(created_events, status=status.HTTP_201_CREATED)
        except Exception as e: 
           return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['POST'])
    @transaction.atomic
    def bulk_create(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        
        try:
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_events_for_month(request):
    year = int(request.query_params.get('year', datetime.now().year))
    month = int(request.query_params.get('month', datetime.now().month))
    events = Event.objects.filter(start_date__year=year, start_date__month=month)
    events_data = [{"title": event.title, "date": event.date} for event in events]
    if not request.user.is_superuser:
        events = events.filter(user=request.user)
    return Response(events_data)
    
# @login_required
def add_event(request):
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            # event.profile = request.user
            event.user = request.user
            event.save()
            return redirect('event_list')
    else:
        form = EventForm()
    return render(request, 'add_event.html', {'form': form})


def event_list(request):
    events = Event.objects.all().order_by('start_date', 'start_time')
    return render(request, 'event_list.html', {
        'events': events,
        'category_colors': CATEGORY_COLORS
    })

