from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EndpointUsageViewSet, EndpointRequestViewSet,
    SearchQueryViewSet, UserSearchHistoryViewSet,
    AnalyticsDashboardView
)
from .search_views import (
    UserSearchView, ThreadSearchView, MultiSearchView,
    SearchSuggestionsView, SearchHistoryView
)

router = DefaultRouter()
router.register(r'endpoint-usage', EndpointUsageViewSet)
router.register(r'endpoint-requests', EndpointRequestViewSet)
router.register(r'search-queries', SearchQueryViewSet)
router.register(r'search-history', UserSearchHistoryViewSet, basename='searchhistory')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    
    # Search endpoints
    path('search/users/', UserSearchView.as_view(), name='search-users'),
    path('search/threads/', ThreadSearchView.as_view(), name='search-threads'),
    path('search/multi/', MultiSearchView.as_view(), name='search-multi'),
    path('search/suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
    path('search/history/', SearchHistoryView.as_view(), name='search-history'),
]