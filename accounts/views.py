from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.db.models import Q
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import UserSerializer, RegisterSerializer, PasswordChangeSerializer, UserProfileSerializer, \
    UserSearchSerializer, PublicUserSerializer
from .tokens import generate_activation_token, validate_activation_token
from .emails import send_activation_email, send_password_verification_email
try:
    from .utils import validate_image_file, process_profile_picture, delete_old_profile_pictures
except ImportError:
    # Fallback if Pillow is not available
    from .utils_simple import validate_image_file_simple as validate_image_file, process_profile_picture_simple as process_profile_picture
    from .utils import delete_old_profile_pictures

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view that returns user data along with tokens"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user from email
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                serializer = UserSerializer(user)
                response.data['user'] = serializer.data
            except User.DoesNotExist:
                pass
                
        return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate activation token
        token = generate_activation_token(user)
        
        # Generate activation link
        activation_link = f"{request.scheme}://{request.get_host()}/api/accounts/activate/{token}/"
        
        # Send activation email
        try:
            send_activation_email(user, activation_link)
        except Exception as e:
            # Log the error but don't expose it in the response
            print(f"Error sending activation email: {e}")
        
        # For development, return the activation link
        if settings.DEBUG:
            return Response({
                "message": "User registered successfully. Please check your email to activate your account.",
                "activation_link": activation_link  # Only in DEBUG mode
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "User registered successfully. Please check your email to activate your account."
            }, status=status.HTTP_201_CREATED)


class ActivateAccountView(APIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, token):
        # Validate token and get user
        user = validate_activation_token(token)
        
        if user is not None:
            # Activate the user
            user.is_active = True
            user.save()
            
            return Response({
                "message": "Account activated successfully. You can now log in."
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "Invalid or expired activation token."
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordChangeView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Update session
            update_session_auth_hash(request, user)
            
            # Generate token for email verification
            token = generate_activation_token(user)
            verification_link = f"{request.scheme}://{request.get_host()}/api/accounts/verify-password/{token}/"
            
            # Send verification email
            try:
                send_password_verification_email(user, verification_link)
            except Exception as e:
                # Log the error but don't expose it in the response
                print(f"Error sending password verification email: {e}")
            
            # For development, return the verification link
            if settings.DEBUG:
                return Response({
                    "message": "Password changed successfully. Please verify the change through your email.",
                    "verification_link": verification_link  # Only in DEBUG mode
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "message": "Password changed successfully. Please verify the change through your email."
                }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyPasswordChangeView(APIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, token):
        # This view simply confirms that the user has verified their password change
        # The actual password change happened in PasswordChangeView
        user = validate_activation_token(token)
        
        if user is not None:
            return Response({
                "message": "Password change verified successfully."
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "message": "Invalid or expired verification token."
            }, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

    def put(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)



class ChangeUserRoleView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, user_id):
        # Check if the requesting user is an admin
        if request.user.role != 'admin':
            return Response(
                {"detail": "Only admin users can change roles."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate role
        new_role = request.data.get('role')
        if new_role not in [role[0] for role in User.ROLES]:
            return Response(
                {"role": f"Invalid role. Choose from {[role[0] for role in User.ROLES]}."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update role
        user.role = new_role
        user.save()
        
        return Response({
            "message": f"User role updated to {new_role}."
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        try:
            # Get the token
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Create a RefreshToken instance
            token = RefreshToken(refresh_token)
            
            # Add the token to the blacklist
            token.blacklist()
            
            # Clear the session if available
            if hasattr(request, 'session'):
                request.session.flush()
                
            return Response(
                {"detail": "Successfully logged out."}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {"detail": "Invalid token or an error occurred."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        try:
            if user_id:
                user = User.objects.get(id=user_id)
            else:
                user = request.user

            profile = user.profile
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class UpdateUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        profile = request.user.profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicUserProfileView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            serializer = PublicUserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)


class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Upload a new profile picture"""
        user = request.user
        file = request.FILES.get('profile_picture')
        
        if not file:
            return Response(
                {"error": "No file provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the image file
        errors = validate_image_file(file)
        if errors:
            return Response(
                {"errors": errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delete old profile pictures
            delete_old_profile_pictures(user)
            
            # Process the new image
            profile_file, thumb_file = process_profile_picture(file)
            
            # Generate unique filenames
            import uuid
            unique_id = str(uuid.uuid4())[:8]
            
            # Save the processed images
            user.profile_picture.save(f'profile_{user.id}_{unique_id}.jpg', profile_file, save=False)
            user.profile_thumbnail.save(f'thumb_{user.id}_{unique_id}.jpg', thumb_file, save=False)
            
            # Update metadata
            user.profile_picture_uploaded_at = timezone.now()
            user.profile_picture_file_size = file.size
            user.save()
            
            # Return updated user data
            serializer = UserSerializer(user)
            return Response({
                "message": "Profile picture uploaded successfully",
                "user": serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to process image: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Delete the user's profile picture"""
        user = request.user
        
        try:
            # Delete profile pictures
            delete_old_profile_pictures(user)
            
            # Clear the fields
            user.profile_picture = None
            user.profile_thumbnail = None
            user.profile_picture_uploaded_at = None
            user.profile_picture_file_size = None
            user.save()
            
            return Response({
                "message": "Profile picture deleted successfully"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to delete profile picture: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NoPagination(PageNumberPagination):
    page_size = None

class UserSearchView(ListAPIView):
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NoPagination #wyłączamy paginacje żeby zmienić formę outputu

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        qs = User.objects.filter(
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q) |
            Q(email__startswith=q)   # pasuje do numeru indeksu
        ).order_by('first_name')[:10]
        return qs