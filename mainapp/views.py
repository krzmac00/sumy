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
    ordering_fields = ['last_activity_date', 'post__date']
    ordering = ['-last_activity_date']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Thread.objects.all()
        user = self.request.user

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
                    Q(title__contains=phrase) | Q(content__contains=phrase)
                )

        # Apply date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                # Parse the date and filter threads created on or after this date
                from_date = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_date__gte=from_date)
            except ValueError:
                pass  # Invalid date format, ignore filter
                
        if date_to:
            try:
                # Parse the date and filter threads created on or before this date
                # Add one day to include the entire day
                to_date = datetime.strptime(date_to, '%Y-%m-%d').date()
                to_datetime = datetime.combine(to_date, time.max)
                queryset = queryset.filter(created_date__lte=to_datetime)
            except ValueError:
                pass  # Invalid date format, ignore filter

        return queryset

class ThreadRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Thread.objects.select_related('post').all()
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
        required_fields = ['nickname', 'content', 'category', 'title']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'Missing required field: {field}'}, status=status.HTTP_400_BAD_REQUEST)

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
                thread_id = create_thread(
                    title=subject,
                    content=body,
                    category="other",
                    nickname=nickname,
                    visible_for_teachers=True,
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