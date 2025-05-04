from django.urls import path
from .views import BuildingListView, BuildingDetailView, search_view, autocomplete_view

urlpatterns = [
    path('buildings/', BuildingListView.as_view(), name='building-list'),
    path('buildings/<int:pk>/', BuildingDetailView.as_view(), name='building-detail'),
    path('search/', search_view, name='search'),
    path('autocomplete/', autocomplete_view, name='autocomplete'),

]

# from django.urls import path
# from . import views
#
# urlpatterns = [
#     path('buildings/', views.BuildingListView.as_view(), name='building-list'),
#     path('buildings/<int:building_id>/floors/', views.FloorListView.as_view(), name='floor-list'),
#     path('floors/<int:floor_id>/rooms/', views.RoomListView.as_view(), name='room-list'),
#     path('search/', views.SearchView.as_view(), name='map-search'),
# ]
