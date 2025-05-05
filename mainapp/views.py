from django.shortcuts import render, HttpResponse
from rest_framework import generics, filters
from .post import Post, Thread
from .post import PostSerializer, ThreadSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .post import create_thread

class PostListCreateAPIView(generics.ListCreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
class PostRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    def perform_update(self, serializer):
        # Ustawiamy `was_edited` na True przed zapisaniem obiektu
        serializer.save(was_edited=True)

class ThreadListCreateAPIView(generics.ListCreateAPIView):
    queryset = Thread.objects.select_related('post').all()
    serializer_class = ThreadSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['last_activity_date', 'post__date']
    ordering = ['-last_activity_date']
class ThreadRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Thread.objects.select_related('post').all()
    serializer_class = ThreadSerializer

def home(request):
    return HttpResponse("Hello World!")

@api_view(['POST'])
def create_thread_with_post(request):
    """
    Create a thread along with its associated post in a single request
    """
    try:
        # Extract data from request
        data = request.data
        
        # Validate required fields
        required_fields = ['nickname', 'content', 'category', 'title']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Missing required field: {field}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create thread and post in a transaction
        with transaction.atomic():
            thread_id = create_thread(
                nickname=data['nickname'],
                content=data['content'],
                category=data['category'],
                title=data['title'],
                visibleforteachers=data.get('visible_for_teachers', False),
                canbeanswered=data.get('can_be_answered', True)
            )
            
            # Get the created thread
            thread = Thread.objects.select_related('post').get(post_id=thread_id)
            thread_data = ThreadSerializer(thread).data
            
            return Response(thread_data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )