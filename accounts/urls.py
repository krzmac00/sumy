from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from . import views
from .views import UserProfileView, UpdateUserProfileView, PublicUserProfileView, ProfilePictureUploadView, UserSearchView, CustomTokenObtainPairView

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    
    # User registration and activation
    path('register/', views.RegisterView.as_view(), name='register'),
    path('activate/<str:token>/', views.ActivateAccountView.as_view(), name='activate_account'),
    
    # Password management
    path('change-password/', views.PasswordChangeView.as_view(), name='change_password'),
    path('verify-password/<str:token>/', views.VerifyPasswordChangeView.as_view(), name='verify_password'),
    
    # User profile and management
    path('me/', views.UserDetailView.as_view(), name='user_detail'),
    path('change-role/<int:user_id>/', views.ChangeUserRoleView.as_view(), name='change_role'),

    # User profile bio view and update
    path('profile/', UserProfileView.as_view(), name='my-profile'),
    path('profile/update/', UpdateUserProfileView.as_view(), name='update-profile'),
    path('profile/<int:user_id>/', UserProfileView.as_view(), name='user-profile'),
    
    # Public user profile
    path('users/<int:user_id>/profile/', PublicUserProfileView.as_view(), name='public-user-profile'),
    
    # Profile picture upload
    path('profile-picture/', ProfilePictureUploadView.as_view(), name='profile-picture-upload'),
    
    # User search
    path('users/search/', UserSearchView.as_view(), name='user-search'),
]