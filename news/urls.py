from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.NewsCategoryListView.as_view(), name='news-category-list'),
    path('items/', views.NewsItemListView.as_view(), name='news-item-list'),
    path('items/create/', views.NewsItemCreateView.as_view(), name='news-item-create'),
    path('items/<int:pk>/', views.NewsItemDetailView.as_view(), name='news-item-detail'),
]