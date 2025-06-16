from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdvertisementViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'advertisements', AdvertisementViewSet, basename='advertisement')
router.register(r'comments', CommentViewSet, basename='comment')

app_name = 'noticeboard'

urlpatterns = [
    path('', include(router.urls)),
]