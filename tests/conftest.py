import pytest
import json
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

# Configure Django settings before any Django imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sumy.settings')

import django
django.setup()

from django.conf import settings
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class TestDocMixin:
    """Mixin to add documentation to test methods"""
    
    @classmethod
    def doc(cls, test_method):
        """Decorator to add documentation to test methods"""
        def wrapper(*args, **kwargs):
            # Extract docstring and format it
            if test_method.__doc__:
                doc_lines = test_method.__doc__.strip().split('\n')
                print(f"\n{'='*60}")
                print(f"TEST: {test_method.__name__}")
                print(f"{'='*60}")
                for line in doc_lines:
                    print(f"  {line.strip()}")
                print(f"{'='*60}\n")
            return test_method(*args, **kwargs)
        
        wrapper.__name__ = test_method.__name__
        wrapper.__doc__ = test_method.__doc__
        return wrapper


# Fixtures
@pytest.fixture(scope='session')
def django_db_setup():
    """Override django_db_setup to use test database"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'test_sumy',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
        'ATOMIC_REQUESTS': False,
    }


@pytest.fixture
def api_client():
    """Provide an API client for testing"""
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Provide an authenticated API client"""
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def test_user(db):
    """Create a test user"""
    return User.objects.create_user(
        email='123456@edu.p.lodz.pl',
        password='testpass123',
        first_name='Test',
        last_name='User',
        is_active=True
    )


@pytest.fixture
def test_lecturer(db):
    """Create a test lecturer user"""
    return User.objects.create_user(
        email='jan.kowalski@p.lodz.pl',
        password='testpass123',
        first_name='Jan',
        last_name='Kowalski',
        is_active=True,
        is_staff=True
    )


@pytest.fixture
def test_admin(db):
    """Create a test admin user"""
    return User.objects.create_superuser(
        email='admin@p.lodz.pl',
        password='adminpass123',
        first_name='Admin',
        last_name='User'
    )


@pytest.fixture
def mock_email(monkeypatch):
    """Mock email sending"""
    mock_send = Mock()
    monkeypatch.setattr('django.core.mail.send_mail', mock_send)
    return mock_send


@pytest.fixture
def clear_cache():
    """Clear cache before and after tests"""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def freeze_time():
    """Fixture to freeze time for testing"""
    def _freeze_time(dt):
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = dt
            yield dt
    return _freeze_time


@pytest.fixture
def mock_external_api():
    """Mock external API calls"""
    with patch('requests.get') as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'status': 'success'}
        mock_get.return_value = mock_response
        yield mock_get


@pytest.fixture
def performance_tracker():
    """Track performance metrics during tests"""
    import time
    
    class PerformanceTracker:
        def __init__(self):
            self.metrics = {}
        
        def start(self, name):
            self.metrics[name] = {'start': time.time()}
        
        def end(self, name):
            if name in self.metrics:
                self.metrics[name]['end'] = time.time()
                self.metrics[name]['duration'] = self.metrics[name]['end'] - self.metrics[name]['start']
        
        def get_duration(self, name):
            return self.metrics.get(name, {}).get('duration', 0)
        
        def report(self):
            for name, data in self.metrics.items():
                if 'duration' in data:
                    print(f"{name}: {data['duration']:.3f}s")
    
    return PerformanceTracker()


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests that measure performance"
    )


# Test database setup helpers
def create_test_data():
    """Helper to create common test data"""
    from mainapp.models import Thread, Event, Post
    from noticeboard.models import Notice
    from news.models import NewsItem
    
    # Create users
    users = []
    for i in range(5):
        user = User.objects.create_user(
            email=f'user{i}@edu.p.lodz.pl',
            password='testpass123',
            first_name=f'User{i}',
            last_name='Test',
            is_active=True
        )
        users.append(user)
    
    # Create threads
    threads = []
    categories = ['academic', 'lifestyle', 'events', 'technology', 'other']
    for i in range(10):
        thread = Thread.objects.create(
            title=f'Test Thread {i}',
            content=f'Content for test thread {i}',
            author=users[i % 5],
            category=categories[i % 5]
        )
        threads.append(thread)
    
    # Create posts
    for thread in threads[:5]:
        for j in range(3):
            Post.objects.create(
                thread=thread,
                content=f'Reply {j} to {thread.title}',
                author=users[j % 5]
            )
    
    # Create events
    for i in range(5):
        Event.objects.create(
            title=f'Test Event {i}',
            description=f'Description for event {i}',
            start_time=timezone.now() + timedelta(days=i),
            end_time=timezone.now() + timedelta(days=i, hours=2),
            location=f'Room {100 + i}',
            organizer=users[i % 5]
        )
    
    return {
        'users': users,
        'threads': threads
    }


# Custom assertions
class CustomAssertions:
    """Custom assertion methods for testing"""
    
    @staticmethod
    def assert_api_response(response, expected_status=200, expected_keys=None):
        """Assert API response has expected status and keys"""
        assert response.status_code == expected_status, \
            f"Expected status {expected_status}, got {response.status_code}"
        
        if expected_keys:
            data = response.json()
            for key in expected_keys:
                assert key in data, f"Expected key '{key}' not found in response"
    
    @staticmethod
    def assert_datetime_close(dt1, dt2, delta_seconds=1):
        """Assert two datetimes are close to each other"""
        if dt1 and dt2:
            diff = abs((dt1 - dt2).total_seconds())
            assert diff <= delta_seconds, \
                f"Datetimes differ by {diff} seconds, max allowed: {delta_seconds}"