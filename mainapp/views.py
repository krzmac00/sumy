from django.shortcuts import render, redirect, HttpResponse
from rest_framework import viewsets, generics, filters, status, permissions
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
from datetime import date, datetime, time
import imaplib
import email
from email.header import decode_header
from django_filters.rest_framework import DjangoFilterBackend
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
from django.contrib.admin.views.decorators import staff_member_required

from .post import Post, Thread, PostSerializer, ThreadSerializer, Vote, VoteSerializer
from .post import vote_on_thread, vote_on_post
from .models import Event
from .serializers import EventSerializer
from .forms import EventForm
from .post import create_thread
from .permissions import IsOwnerOrReadOnly
from .filters import ThreadFilter

# ---------- COMMON HOME ----------
def home(request):
    return HttpResponse("Hello World!")

class SchedulePlanViewSet(viewsets.ModelViewSet):
    queryset = SchedulePlan.objects.filter(is_active=True).order_by('-created_at')
    serializer_class = SchedulePlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SchedulePlan.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(administrator=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        Event.objects.filter(schedule_plan=instance).delete()
        return super().destroy(request, *args, **kwargs)
        

class PublicSchedulePlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SchedulePlan.objects.all().order_by('-created_at')
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
        queryset = Event.objects.all().order_by('-start_date', '-id')

        schedule_plan_id = self.request.query_params.get('schedule_plan')

        if schedule_plan_id:
            queryset = queryset.filter(schedule_plan=schedule_plan_id)
        else:
            queryset = queryset.filter(schedule_plan__isnull=True, user=self.request.user)

        return queryset
    
    def get_object(self):
        obj = Event.objects.get(pk=self.kwargs['pk'])

        return obj

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
    #przypisanie eventu do kontretnego uzytkownika
    if not request.user.is_superuser:
        events = events.filter(user=request.user)

    #czy lepiej tak? bo mam datefield()
    events_data = [{"title": event.title, "date": event.start_date} for event in events]
    # events_data = [{"title": event.title, "date": event.date} for event in events]
    return Response(events_data)
    
@login_required
def add_event(request):
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            event.profile = request.user
            event.user = request.user
            event.save()
            return redirect('event_list')
    else:
        form = EventForm()
    return render(request, 'add_event.html', {'form': form})

@login_required
def event_list(request):
    events = Event.objects.filter(user=request.user).order_by('start_date')
    available_plans = SchedulePlan.objects.filter(administrator=request.user)
    return render(request, 'event_list.html', {
        'events': events,
        'available_plans': available_plans,
        'category_colors': CATEGORY_COLORS
    })

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


# ---------- POST SECTION ----------
class PostListCreateAPIView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

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
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ThreadFilter
    ordering_fields = ['created_date', 'last_activity_date', 'vote_count_cache', 'post_count', 'title']
    ordering = ['-last_activity_date']  # Default ordering
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Thread.objects.all()
        user = self.request.user

        # Role-based filtering
        if user.is_authenticated and user.role == 'lecturer':
            queryset = queryset.filter(visible_for_teachers=True)

        # Apply blacklist filter
        apply_blacklist = self.request.query_params.get("blacklist", "on") != "off"

        if apply_blacklist and user.is_authenticated:
            blacklist = getattr(user, 'blacklist', [])
            if isinstance(blacklist, str):
                try:
                    import json
                    blacklist = json.loads(blacklist)
                except Exception:
                    blacklist = []

            for phrase in blacklist:
                queryset = queryset.exclude(
                    Q(title__icontains=phrase) | Q(content__icontains=phrase)
                )

        return queryset

class ThreadRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Thread.objects.select_related('author').all()
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

        # Determine if the post is anonymous
        is_anonymous = data.get('is_anonymous', False)
        user = request.user if request.user.is_authenticated and not is_anonymous else None
        nickname = data.get('nickname', 'Anonymous User') if is_anonymous else None

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
            thread_data = ThreadSerializer(thread, context={'request': request}).data

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
    
    success, message, vote_count, current_user_vote = vote_on_thread(request.user, thread_id, vote_type)
    
    if success:
        return Response({
            'message': message,
            'vote_count': vote_count,
            'user_vote': current_user_vote
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
    
    success, message, vote_count, current_user_vote = vote_on_post(request.user, post_id, vote_type)
    
    if success:
        return Response({
            'message': message,
            'vote_count': vote_count,
            'user_vote': current_user_vote
        }, status=status.HTTP_200_OK)
    else:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fetch_and_delete_emails(request):
    EMAIL = "plwftims@gmail.com"
    PASSWORD = "fdnj bnbg rszz jzmc "
    IMAP_SERVER = "imap.gmail.com"
    IMAP_PORT = 993

    results = []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(EMAIL, PASSWORD)
        mail.select("inbox")
        status, messages = mail.search(None, "ALL")

        if status != "OK":
            return Response({"error": "Błąd przy wyszukiwaniu e-maili"}, status=500)

        email_ids = messages[0].split()
        for email_id in email_ids:
            status, msg_data = mail.fetch(email_id, "(RFC822)")
            if status != "OK":
                continue

            msg = email.message_from_bytes(msg_data[0][1])
            subject, encoding = decode_header(msg.get("Subject"))[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or "utf-8")

            from_ = msg.get("From")
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain" and part.get_payload(decode=True):
                        body = part.get_payload(decode=True).decode(errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode(errors="ignore")

            results.append({
                "subject": subject,
                "from": from_,
                "body": body.strip()
            })

            mail.store(email_id, '+FLAGS', '\\Deleted')

        mail.expunge()
        mail.logout()

        return Response({"emails": results})

    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_threads_from_emails(request):
    try:
        emails = request.data.get('emails', [])
        if not emails:
            return Response({'info': 'Brak e-maili do przetworzenia'}, status=status.HTTP_200_OK)
        created_threads = []
        user = request.user if request.user.is_authenticated else None

        with transaction.atomic():
            for email_data in emails:
                subject = email_data.get('subject')
                body = email_data.get('body')
                body = clean_email_body(body)
                sender = email_data.get('from')
                if not sender.endswith('p.lodz.pl>'):
                    continue
                if not subject or not body or not sender:
                    continue
                nickname = sender
                is_anonymous = True

                exists = Thread.objects.filter(
                    title=subject,
                    content=body,
                    nickname=nickname,
                    is_anonymous=True,
                ).exists()
                if exists:
                    continue
                if user.email and user.email[0].isdigit():
                    visible_for_teachers_var = False
                else:
                    visible_for_teachers_var = True
                thread_id = create_thread(
                    title=subject,
                    content=body,
                    category="other",
                    nickname=nickname,
                    visible_for_teachers=visible_for_teachers_var,
                    can_be_answered=False,
                    user=user,
                    is_anonymous=is_anonymous
                )
                thread = Thread.objects.get(id=thread_id)
                created_threads.append(ThreadSerializer(thread).data)

        return Response({"created_threads": created_threads}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def clean_email_body(body: str) -> str:
    separator = "_______________________________"
    pos = body.find(separator)
    if pos != -1:
        return body[:pos].strip()