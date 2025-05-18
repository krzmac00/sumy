from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth import update_session_auth_hash

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from .serializers import UserSerializer, RegisterSerializer, PasswordChangeSerializer, UserProfileSerializer
from .tokens import generate_activation_token, validate_activation_token
from .emails import send_activation_email, send_password_verification_email

User = get_user_model()


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
            serializer = UserProfileSerializer(profile)
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