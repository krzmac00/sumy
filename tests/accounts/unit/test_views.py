import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from tests.base import BaseAPITestCase
from tests.factories import UserFactory
import json

User = get_user_model()


class TestAuthenticationViews(BaseAPITestCase):
    """Test authentication related views"""
    
    def setUp(self):
        super().setUp()
        self.login_url = reverse('accounts:token_obtain_pair')
        self.register_url = reverse('accounts:register')
        self.logout_url = reverse('accounts:logout')
        self.token_refresh_url = reverse('accounts:token_refresh')
    
    @BaseAPITestCase.doc
    def test_user_registration_success(self):
        """
        Test successful user registration
        
        Verifies:
        - User can register with valid data
        - Profile is created automatically
        - Response contains user data and tokens
        """
        # Remove authentication for registration test
        self.client.credentials()
        
        data = {
            'email': '999999@edu.p.lodz.pl',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        # activation_link is only in DEBUG mode
        
        # Verify user was created
        user = User.objects.get(email='999999@edu.p.lodz.pl')
        self.assertEqual(user.first_name, 'New')
        self.assertEqual(user.last_name, 'User')
        self.assertFalse(user.is_active)  # User needs to activate account
        
        # Verify user role is set
        self.assertEqual(user.role, 'student')
    
    @BaseAPITestCase.doc
    def test_registration_invalid_email_format(self):
        """
        Test registration with invalid email format
        
        Verifies:
        - Non-university emails are rejected
        - Proper error message is returned
        """
        # Remove authentication for registration test
        self.client.credentials()
        
        data = {
            'email': 'invalid@gmail.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertValidationError(response, 'email')
        self.assertIn('university email', response.data['email'][0].lower())
    
    @BaseAPITestCase.doc
    def test_registration_password_mismatch(self):
        """
        Test registration with mismatched passwords
        
        Verifies:
        - Password confirmation is enforced
        - Proper error message is returned
        """
        # Remove authentication for registration test
        self.client.credentials()
        
        data = {
            'email': 'test@edu.p.lodz.pl',
            'password': 'Pass123!',
            'password2': 'DifferentPass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertValidationError(response, 'password')
        self.assertIn('match', response.data['password'][0].lower())
    
    @BaseAPITestCase.doc
    def test_registration_duplicate_email(self):
        """
        Test registration with existing email
        
        Verifies:
        - Duplicate emails are rejected
        - Proper error message is returned
        """
        # Remove authentication for registration test
        self.client.credentials()
        
        # Create existing user
        UserFactory(email='existing@edu.p.lodz.pl')
        
        data = {
            'email': 'existing@edu.p.lodz.pl',
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertValidationError(response, 'email')
        self.assertIn('already', response.data['email'][0].lower())
    
    @BaseAPITestCase.doc
    def test_login_success(self):
        """
        Test successful login
        
        Verifies:
        - User can login with correct credentials
        - JWT tokens are returned
        - User data is included in response
        """
        user = UserFactory(email='login@edu.p.lodz.pl')
        user.set_password('TestPass123!')
        user.save()
        
        data = {
            'email': 'login@edu.p.lodz.pl',
            'password': 'TestPass123!'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'login@edu.p.lodz.pl')
    
    @BaseAPITestCase.doc
    def test_login_invalid_credentials(self):
        """
        Test login with invalid credentials
        
        Verifies:
        - Invalid credentials are rejected
        - Proper error message is returned
        """
        user = UserFactory(email='test@edu.p.lodz.pl')
        user.set_password('CorrectPass123!')
        user.save()
        
        data = {
            'email': 'test@edu.p.lodz.pl',
            'password': 'WrongPass123!'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('detail', response.data)
    
    @BaseAPITestCase.doc
    def test_login_inactive_user(self):
        """
        Test login with inactive user
        
        Verifies:
        - Inactive users cannot login
        - Proper error message is returned
        """
        user = UserFactory(email='inactive@edu.p.lodz.pl', is_active=False)
        user.set_password('Pass123!')
        user.save()
        
        data = {
            'email': 'inactive@edu.p.lodz.pl',
            'password': 'Pass123!'
        }
        
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @BaseAPITestCase.doc
    def test_token_refresh(self):
        """
        Test JWT token refresh
        
        Verifies:
        - Refresh token can be used to get new access token
        - New access token is valid
        """
        user = UserFactory()
        refresh = RefreshToken.for_user(user)
        
        data = {'refresh': str(refresh)}
        
        response = self.client.post(self.token_refresh_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        
        # Verify new access token works
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        user_url = reverse('accounts:user_detail')
        user_response = self.client.get(user_url)
        self.assertEqual(user_response.status_code, status.HTTP_200_OK)
    
    @BaseAPITestCase.doc
    def test_logout(self):
        """
        Test user logout
        
        Verifies:
        - Authenticated user can logout
        - Refresh token is blacklisted
        """
        # Create and authenticate a fresh user for this test
        user = UserFactory(email='logout_test@edu.p.lodz.pl', is_active=True)
        user.set_password('TestPass123!')
        user.save()
        
        # Login to get tokens
        login_data = {
            'email': 'logout_test@edu.p.lodz.pl',
            'password': 'TestPass123!'
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Set authentication header
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        data = {'refresh_token': refresh_token}
        
        response = self.client.post(self.logout_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify refresh token is blacklisted
        refresh_response = self.client.post(
            self.token_refresh_url, 
            {'refresh': refresh_token}, 
            format='json'
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestUserViews(BaseAPITestCase):
    """Test user related views"""
    
    def setUp(self):
        super().setUp()
        self.me_url = reverse('accounts:user_detail')
        self.profile_url = reverse('accounts:my-profile')
        self.search_url = reverse('accounts:user-search')
    
    @BaseAPITestCase.doc
    def test_user_search_authenticated(self):
        """
        Test user search for authenticated users
        
        Verifies:
        - Authenticated users can search for users
        - Search results match query
        - User data is included
        """
        # Create some users
        UserFactory(email='123456@edu.p.lodz.pl', first_name='John', last_name='Doe')
        UserFactory(email='234567@edu.p.lodz.pl', first_name='Jane', last_name='Smith')
        
        response = self.client.get(self.search_url, {'q': 'John'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 1)
        
        # Check user structure
        user = response.data[0]
        self.assertIn('id', user)
        self.assertIn('index_number', user)
        self.assertIn('first_name', user)
        self.assertIn('last_name', user)
        self.assertEqual(user['first_name'], 'John')
    
    @BaseAPITestCase.doc
    def test_user_search_unauthenticated(self):
        """
        Test user search requires authentication
        
        Verifies:
        - Unauthenticated users cannot search users
        """
        self.logout()
        
        response = self.client.get(self.search_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @BaseAPITestCase.doc
    def test_me_endpoint(self):
        """
        Test viewing own user data
        
        Verifies:
        - Users can view their own data via 'me' endpoint
        - All relevant fields are included
        """
        response = self.client.get(self.me_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.test_user.email)
        self.assertEqual(response.data['first_name'], self.test_user.first_name)
        self.assertEqual(response.data['last_name'], self.test_user.last_name)
        self.assertEqual(response.data['role'], self.test_user.role)
    
    @BaseAPITestCase.doc
    def test_user_search_by_name(self):
        """
        Test user search functionality
        
        Verifies:
        - Can search users by name
        - Search is case insensitive
        - Returns matching results
        """
        # Create users with specific names
        UserFactory(email='111111@edu.p.lodz.pl', first_name='John', last_name='Smith')
        UserFactory(email='222222@edu.p.lodz.pl', first_name='Jane', last_name='Doe')
        UserFactory(email='333333@edu.p.lodz.pl', first_name='Johnny', last_name='Walker')
        
        # Search for "john"
        response = self.client.get(self.search_url, {'q': 'john'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        # Filter to just the users we created
        johns = [r for r in response.data if r['first_name'].lower().startswith('john')]
        self.assertGreaterEqual(len(johns), 2)  # At least John Smith and Johnny Walker
        
        names = [
            f"{r['first_name']} {r['last_name']}" 
            for r in johns
        ]
        
        # Check that our specific users are in the results
        self.assertTrue(any('John Smith' in n for n in names))
        self.assertTrue(any('Johnny Walker' in n for n in names))


# Removed TestUserViewSet class - functionality covered in TestUserViews