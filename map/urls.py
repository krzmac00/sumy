from django.urls import path
from .views import BuildingListView, BuildingDetailView, search_view, autocomplete_view, BuildingByTypeView

app_name = 'map'

urlpatterns = [
    path('buildings/', BuildingListView.as_view(), name='building-list'),
    path('buildings/<int:pk>/', BuildingDetailView.as_view(), name='building-detail'),
    path('search/', search_view, name='search'),
    path('autocomplete/', autocomplete_view, name='autocomplete'),
    path('buildings/by-type/<str:type_name>/', BuildingByTypeView.as_view(), name='buildings-by-type'),

]
