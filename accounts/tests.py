from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import re
from .models import EmailActivationToken
from .tokens import generate_activation_token

User = get_user_model()


class UserModelTests(TestCase):
    
    def test_create_student_user(self):
        """Test creating a student user from email."""
        user = User.objects.create_user(
            email='123456@edu.p.lodz.pl',
            password='testpass123',
            first_name='Student',
            last_name='Test'
        )
        
        self.assertEqual(user.email, '123456@edu.p.lodz.pl')
        self.assertEqual(user.login, '123456')
        self.assertEqual(user.role, 'student')
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertTrue(user.check_password('testpass123'))
    
    def test_create_lecturer_user(self):
        """Test creating a lecturer user from email."""
        user = User.objects.create_user(
            email='jan.kowalski@edu.p.lodz.pl',
            password='testpass123',
            first_name='Jan',
            last_name='Kowalski'
        )
        
        self.assertEqual(user.email, 'jan.kowalski@edu.p.lodz.pl')
        self.assertEqual(user.login, 'jan.kowalski')
        self.assertEqual(user.role, 'lecturer')
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_staff)
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@edu.p.lodz.pl',
            password='testpass123',
            first_name='Admin',
            last_name='User'
        )
        
        self.assertEqual(user.email, 'admin@edu.p.lodz.pl')
        self.assertEqual(user.role, 'admin')
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)


class RegistrationAPITests(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
    
    def test_register_valid_student_user(self):
        """Test registering a valid student user."""
        payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'StrongP@ssword123',
            'password2': 'StrongP@ssword123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.post(self.register_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=payload['email']).exists())
        
        # Verify user is created with correct attributes
        user = User.objects.get(email=payload['email'])
        self.assertEqual(user.login, '123456')
        self.assertEqual(user.role, 'student')
        self.assertFalse(user.is_active)
    
    def test_register_valid_lecturer_user(self):
        """Test registering a valid lecturer user."""
        payload = {
            'email': 'jan.kowalski@edu.p.lodz.pl',
            'password': 'StrongP@ssword123',
            'password2': 'StrongP@ssword123',
            'first_name': 'Jan',
            'last_name': 'Kowalski'
        }
        
        response = self.client.post(self.register_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=payload['email']).exists())
        
        # Verify user is created with correct attributes
        user = User.objects.get(email=payload['email'])
        self.assertEqual(user.login, 'jan.kowalski')
        self.assertEqual(user.role, 'lecturer')
        self.assertFalse(user.is_active)
    
    def test_register_invalid_email(self):
        """Test that registration fails with non-university email."""
        payload = {
            'email': 'test@gmail.com',
            'password': 'StrongP@ssword123',
            'password2': 'StrongP@ssword123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.post(self.register_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=payload['email']).exists())
    
    def test_register_invalid_student_email_format(self):
        """Test that registration fails with invalid student email format."""
        payload = {
            'email': 'invalid@edu.p.lodz.pl',  # Not numeric
            'password': 'StrongP@ssword123',
            'password2': 'StrongP@ssword123',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.post(self.register_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=payload['email']).exists())
    
    def test_register_password_mismatch(self):
        """Test that registration fails when passwords don't match."""
        payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'StrongP@ssword123',
            'password2': 'DifferentP@ssword',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        
        response = self.client.post(self.register_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email=payload['email']).exists())


class ActivationTests(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        # Create an inactive user
        self.user = User.objects.create_user(
            email='123456@edu.p.lodz.pl',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        # Generate activation token
        self.token = generate_activation_token(self.user)
        self.activation_url = reverse('activate_account', args=[self.token])
    
    def test_activate_valid_token(self):
        """Test activating account with valid token."""
        response = self.client.get(self.activation_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh user from db
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        
        # Check token is marked as used
        token_obj = EmailActivationToken.objects.get(token=self.token)
        self.assertTrue(token_obj.is_used)
    
    def test_activate_invalid_token(self):
        """Test activating account with invalid token."""
        invalid_url = reverse('activate_account', args=['invalidtoken123'])
        response = self.client.get(invalid_url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Refresh user from db
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)


class AuthenticationTests(TestCase):
    
    def setUp(self):
        self.client = APIClient()
        # Create an active user
        self.user = User.objects.create_user(
            email='123456@edu.p.lodz.pl',
            password='testpass123',
            first_name='Test',
            last_name='User',
            is_active=True
        )
        self.token_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.logout_url = reverse('logout')
        self.me_url = reverse('user_detail')
    
    def test_login_valid_credentials(self):
        """Test login with valid credentials."""
        payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.token_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'wrongpass'
        }
        
        response = self.client.post(self.token_url, payload)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_refresh_token(self):
        """Test refreshing token."""
        # First login to get tokens
        login_payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'testpass123'
        }
        login_response = self.client.post(self.token_url, login_payload)
        refresh_token = login_response.data['refresh']
        
        # Then use refresh token
        refresh_payload = {
            'refresh': refresh_token
        }
        response = self.client.post(self.refresh_url, refresh_payload)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_user_detail(self):
        """Test accessing user details with token authentication."""
        # First login to get tokens
        login_payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'testpass123'
        }
        login_response = self.client.post(self.token_url, login_payload)
        token = login_response.data['access']
        
        # Then access user details
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(self.me_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], '123456@edu.p.lodz.pl')
        self.assertEqual(response.data['login'], '123456')
        self.assertEqual(response.data['role'], 'student')
    
    def test_logout(self):
        """Test logout blacklists token."""
        # First login to get tokens
        login_payload = {
            'email': '123456@edu.p.lodz.pl',
            'password': 'testpass123'
        }
        login_response = self.client.post(self.token_url, login_payload)
        token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Then logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        logout_payload = {
            'refresh_token': refresh_token
        }
        response = self.client.post(self.logout_url, logout_payload)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Try to use refresh token again (should fail as it's blacklisted)
        refresh_payload = {
            'refresh': refresh_token
        }
        refresh_response = self.client.post(self.refresh_url, refresh_payload)
        
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

#User Profile Tests:
class UserProfileAPITests(TestCase):
    def setUp(self):
        # URLs
        self.token_url = reverse('token_obtain_pair')
        self.profile_url = reverse('my-profile')
        self.update_url = reverse('update-profile')

        # Create primary user
        self.user = User.objects.create_user(
            email='user@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            is_active=True
        )
        # Ensure profile exists
        self.user.profile.bio = ''
        self.user.profile.save()

        # Create another user
        self.other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User',
            is_active=True
        )
        # Set custom bio for other user
        self.other_user.profile.bio = 'Other user bio'
        self.other_user.profile.save()
        self.other_profile_url = reverse('user-profile', args=[self.other_user.id])

        # Authenticate primary user and store access token
        self.client = APIClient()
        login_response = self.client.post(self.token_url, {
            'email': 'user@example.com',
            'password': 'testpass123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        access = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

    def test_get_own_profile_unauthenticated(self):
        client = APIClient()
        response = client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_own_profile_success(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check response contains expected fields
        self.assertIn('bio', response.data)
        self.assertEqual(response.data['bio'], self.user.profile.bio)

    def test_get_other_profile_success(self):
        response = self.client.get(self.other_profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('bio', response.data)
        self.assertEqual(response.data['bio'], 'Other user bio')

    def test_get_other_profile_not_found(self):
        url = reverse('user-profile', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_profile_unauthenticated(self):
        client = APIClient()
        response = client.put(self.update_url, {'bio': 'Should not work'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_success(self):
        payload = {'bio': 'New bio content'}
        response = self.client.put(self.update_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Profile updated successfully.')
        # Refresh from db
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'New bio content')

    def test_update_profile_invalid_data(self):
        """
        Test that sending unknown field is ignored and profile remains unchanged."""
        # Sending an unknown field will be ignored
        response = self.client.put(self.update_url, {'unknown_field': 'value'})
        # Should still return 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'Profile updated successfully.')
        # Ensure bio remains unchanged
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, '')
