from django.urls import path
from . import views
from .views import (
    PostListCreateAPIView, PostRetrieveUpdateDestroyAPIView,
    ThreadListCreateAPIView, ThreadRetrieveUpdateDestroyAPIView
)


urlpatterns = [
    path("", views.home, name="home"),

    # Post endpoints
    path('posts/', PostListCreateAPIView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostRetrieveUpdateDestroyAPIView.as_view(), name='post-detail'),
    # Thread endpoints
    path('threads/', ThreadListCreateAPIView.as_view(), name='thread-list-create'),
    path('threads/<int:pk>/', ThreadRetrieveUpdateDestroyAPIView.as_view(), name='thread-detail'),
]

