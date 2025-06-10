from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import date
from .models import *
from .constants import CATEGORY_COLORS
from .forms import EventForm
from .serializers import *
from django.http import HttpResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.db import transaction
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from datetime import timedelta


def home(request):
    return HttpResponse("Jesteś na stronie głównej")

class SchedulePlanViewSet(viewsets.ModelViewSet):
    queryset = SchedulePlan.objects.filter(is_active=True)
    serializer_class = SchedulePlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SchedulePlan.objects.all()
        return super().get_queryset().filter(
            Q(participants=self.request.user) | Q(administrator=self.request.user)
        )

    @action(detail=True, methods=['post'], serializer_class=ApplyPlanSerializer)
    def apply(self, request, pk=None):

        plan = self.get_object()
        serializer = ApplyPlanSerializer(data=request.data)
        #serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if AppliedPlan.objects.filter(user=request.user, plan=plan).exists():
            return Response(
                {'detail': 'Plan is already applied'},
                status=status.HTTP_400_BAD_REQUEST
            )

        applied_plan = AppliedPlan.objects.create(
            user=request.user,
            plan=plan,
            **serializer.validated_data
        )

        start_date = serializer.validated_data['start_date']
        events = []
        
        for schedule_event in plan.events.all():
            days_ahead = (schedule_event.day_of_week - start_date.weekday() + 7) % 7
            event_date = start_date + timedelta(days=days_ahead)
            
            events.append(Event(
                user=request.user,
                title=schedule_event.title,
                start_date=timezone.make_aware(
                    timezone.datetime.combine(event_date, schedule_event.start_time)
                ),
                end_date=timezone.make_aware(
                    timezone.datetime.combine(event_date, schedule_event.end_time)
                ),
                category='timetable',
                schedule_plan=plan,
                room=schedule_event.room,
                teacher=schedule_event.teacher
            ))

        Event.objects.bulk_create(events)
        
        return Response(
            {'status': 'Plan applied successfully'},
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'], url_path='add-by-code')
    def add_plan_by_code(self, request):
        code = request.data.get('code')
        plan = get_object_or_404(SchedulePlan, code=code)
        
        if AppliedPlan.objects.filter(user=request.user, plan=plan).exists():
            return Response(
                {'detail': 'Plan już został dodany'},
                status=status.HTTP_400_BAD_REQUEST
            )

        AppliedPlan.objects.create(user=request.user, plan=plan)
        return Response({'status': 'Plan dodany pomyślnie'})

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionDenied("Only administrators can create plans")
        serializer.save(administrator=self.request.user)
        

class PublicSchedulePlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SchedulePlan.objects.all()
    serializer_class = SchedulePlanSerializer
    permission_classes = [IsAuthenticated]

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

    @action(detail=False, methods=['POST'])
    def save_as_plan(self, request):
        serializer = SchedulePlanCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        plan = serializer.save()
        return Response(SchedulePlanSerializer(plan).data, status=201)

    

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

from django.contrib.admin.views.decorators import staff_member_required

@staff_member_required
def create_plan(request):
    if request.method == 'POST':
        data = {
            'name': request.POST.get('name'),
            'description': request.POST.get('description'),
            'events': []
        }
        
        event_count = sum(1 for key in request.POST if key.startswith('events.'))
        for i in range(event_count//5):
            data['events'].append({
                'title': request.POST.get(f'events.{i}.title'),
                'day_of_week': request.POST.get(f'events.{i}.day_of_week'),
                'start_time': request.POST.get(f'events.{i}.start_time'),
                'end_time': request.POST.get(f'events.{i}.end_time'),
                'room': request.POST.get(f'events.{i}.room'),
                'teacher': request.POST.get(f'events.{i}.teacher')
            })
        
        response = SchedulePlanViewSet.as_view({'post': 'create'})(request)
        return redirect('plans-list')
    
    return render(request, 'create_plan.html')

@login_required
def plans_list(request):
    plans = SchedulePlan.objects.filter(Q(administrator=request.user))
    return render(request, 'plans/list.html', {'plans': plans})

@staff_member_required
def admin_create_plan(request):
    return render(request, 'admin/create_plan.html')

def event_list(request):
    events = Event.objects.filter(user=request.user)
    available_plans = SchedulePlan.objects.filter(
        Q(administrator=request.user)
    )
    return render(request, 'event_list.html', {
        'events': events,
        'available_plans': available_plans,
        'category_colors': CATEGORY_COLORS
    })

