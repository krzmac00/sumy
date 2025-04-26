from django.shortcuts import render, HttpResponse
from rest_framework import generics, filters
from .post import Post, Thread
from .post import PostSerializer, ThreadSerializer

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
