from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet
from . import views

router = DefaultRouter()
router.register(r'events', EventViewSet)
# router.register(r'schedule-plans', SchedulePlanViewSet, basename='scheduleplan')

urlpatterns = [
    path('', include(router.urls)),
    path('home', views.home, name='home'),
    path('list', views.event_list, name='event_list'),
    path('add', views.add_event, name='add_event'),
    path('save-calendar', EventViewSet.as_view({'post': 'save_calendar'}), name='save-calendar'),
    path('events/bulk/', EventViewSet.as_view({'post': 'bulk_create'}), name='event-bulk-create'),
    path('events/save-as-plan/', EventViewSet.as_view({'post': 'save_as_plan'})),
    path('create-plan/', views.create_plan, name='create-plan'),
    path('plans/', views.plans_list, name='plans-list'),
    path('plans/<int:pk>/apply/', views.SchedulePlanViewSet.as_view({'post': 'apply'}), name='apply-plan'),
] + router.urls