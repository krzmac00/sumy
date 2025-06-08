from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EventViewSet, home, event_list, add_event,
    PostListCreateAPIView, PostRetrieveUpdateDestroyAPIView,
    ThreadListCreateAPIView, ThreadRetrieveUpdateDestroyAPIView,
    create_thread_with_post, vote_thread, vote_post,
    fetch_and_delete_emails, create_threads_from_emails
)
from mainapp import views

# Setup DRF router for EventViewSet
router = DefaultRouter()
router.register(r'events', EventViewSet)
# router.register(r'schedule-plans', SchedulePlanViewSet, basename='scheduleplan')

urlpatterns = [
    # Home page
    path('', home, name='home'),

    # Event-related views
    path('list', event_list, name='event_list'),
    path('add', views.add_event, name='add_event'),
    path('save-calendar/', EventViewSet.as_view({'post': 'save_calendar'}), name='save-calendar'),
    path('events/bulk/', EventViewSet.as_view({'post': 'bulk_create'}), name='event-bulk-create'),
    path('events/save-as-plan/', EventViewSet.as_view({'post': 'save_as_plan'})),
    path('admin/create-plan/', views.create_plan, name='create-plan'),
    path('plans/', views.plans_list, name='plans-list'),
    path('plans/<int:pk>/apply/', views.SchedulePlanViewSet.as_view({'post': 'apply'}), name='apply-plan'),

    # Post endpoints
    path('posts/', PostListCreateAPIView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostRetrieveUpdateDestroyAPIView.as_view(), name='post-detail'),

    # Thread endpoints
    path('threads/', ThreadListCreateAPIView.as_view(), name='thread-list-create'),
    path('threads/<int:pk>/', ThreadRetrieveUpdateDestroyAPIView.as_view(), name='thread-detail'),
    path('create-thread/', create_thread_with_post, name='create-thread-with-post'),
    path('api/email/fetch-delete/', fetch_and_delete_emails, name='fetch-delete-emails'),
    path('api/email/create/', create_threads_from_emails, name='create-threads-from-emails'),

    # Voting endpoints
    path('threads/<int:thread_id>/vote/', vote_thread, name='vote-thread'),
    path('posts/<int:post_id>/vote/', vote_post, name='vote-post'),

    # Include the router URLs for EventViewSet
    path('', include(router.urls)),
]