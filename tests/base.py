from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
import json
from datetime import datetime
from .conftest import TestDocMixin, CustomAssertions

User = get_user_model()


class BaseTestCase(TestCase, TestDocMixin, CustomAssertions):
    """Base test case with common utilities"""
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.start_time = datetime.now()
    
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        duration = (datetime.now() - cls.start_time).total_seconds()
        print(f"\n{cls.__name__} completed in {duration:.2f}s")
    
    def setUp(self):
        """Set up test data"""
        self.test_user = User.objects.create_user(
            email='test123456@edu.p.lodz.pl',
            password='testpass123',
            first_name='Test',
            last_name='User',
            is_active=True
        )
        self.client.force_login(self.test_user)
    
    def assertJsonEqual(self, response_data, expected_data, exclude_keys=None):
        """Assert JSON data equality with optional key exclusion"""
        if exclude_keys:
            for key in exclude_keys:
                response_data.pop(key, None)
                expected_data.pop(key, None)
        
        self.assertEqual(
            json.dumps(response_data, sort_keys=True),
            json.dumps(expected_data, sort_keys=True)
        )
    
    def assertResponseContains(self, response, text, status_code=200):
        """Assert response contains text and has expected status"""
        self.assertEqual(response.status_code, status_code)
        self.assertContains(response, text, status_code=status_code)
    
    def assertResponseNotContains(self, response, text, status_code=200):
        """Assert response does not contain text"""
        self.assertEqual(response.status_code, status_code)
        self.assertNotContains(response, text, status_code=status_code)


class BaseAPITestCase(APITestCase, TestDocMixin, CustomAssertions):
    """Base API test case with JWT authentication"""
    
    def setUp(self):
        """Set up API test data"""
        self.test_user = User.objects.create_user(
            email='api_test@edu.p.lodz.pl',
            password='testpass123',
            first_name='API',
            last_name='Test',
            is_active=True
        )
        self.authenticate()
    
    def authenticate(self, user=None):
        """Authenticate the test client"""
        if user is None:
            user = self.test_user
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.access_token = str(refresh.access_token)
        self.refresh_token = str(refresh)
    
    def logout(self):
        """Remove authentication"""
        self.client.credentials()
    
    def assertPaginatedResponse(self, response, expected_count=None):
        """Assert response is properly paginated"""
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check pagination structure
        self.assertIn('results', data)
        self.assertIn('count', data)
        self.assertIn('next', data)
        self.assertIn('previous', data)
        
        if expected_count is not None:
            self.assertEqual(data['count'], expected_count)
        
        return data
    
    def assertValidationError(self, response, field=None, message=None):
        """Assert validation error response"""
        self.assertEqual(response.status_code, 400)
        data = response.json()
        
        if field:
            self.assertIn(field, data)
            if message:
                if isinstance(data[field], list):
                    self.assertIn(message, data[field][0])
                else:
                    self.assertIn(message, data[field])
        
        return data


class BaseTransactionTestCase(TransactionTestCase, TestDocMixin):
    """Base transaction test case for tests requiring transactions"""
    
    def setUp(self):
        """Set up transaction test data"""
        self.test_user = User.objects.create_user(
            email='transaction_test@edu.p.lodz.pl',
            password='testpass123',
            first_name='Transaction',
            last_name='Test'
        )


class PerformanceTestMixin:
    """Mixin for performance testing"""
    
    def assertQueryCount(self, expected_count, func, *args, **kwargs):
        """Assert number of database queries"""
        from django.test.utils import override_settings
        from django.db import connection
        from django.test import TransactionTestCase
        
        with self.assertNumQueries(expected_count):
            result = func(*args, **kwargs)
        return result
    
    def assertResponseTime(self, view_func, max_time=1.0, *args, **kwargs):
        """Assert view response time is under threshold"""
        import time
        
        start = time.time()
        response = view_func(*args, **kwargs)
        duration = time.time() - start
        
        self.assertLess(
            duration, max_time,
            f"Response took {duration:.2f}s, expected less than {max_time}s"
        )
        return response


class MockTestMixin:
    """Mixin for common mocking patterns"""
    
    def mock_datetime_now(self, target_datetime):
        """Mock datetime.now() for testing"""
        from unittest.mock import patch
        return patch('django.utils.timezone.now', return_value=target_datetime)
    
    def mock_external_service(self, service_path, return_value=None, side_effect=None):
        """Mock external service calls"""
        from unittest.mock import patch, Mock
        
        mock = Mock()
        if return_value is not None:
            mock.return_value = return_value
        if side_effect is not None:
            mock.side_effect = side_effect
        
        return patch(service_path, mock)