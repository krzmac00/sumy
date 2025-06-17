"""
Quick test to verify test setup is working correctly
"""
import os
import django

# Configure Django before imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pytest_django_settings')
django.setup()

import pytest
from django.contrib.auth import get_user_model
from tests.factories import UserFactory, ThreadFactory
from tests.base import BaseTestCase

User = get_user_model()


class TestSetupVerification(BaseTestCase):
    """Verify test infrastructure is working"""
    
    def test_database_connection(self):
        """Test database is accessible"""
        user_count = User.objects.count()
        self.assertIsInstance(user_count, int)
    
    def test_factory_creation(self):
        """Test factories work correctly"""
        user = UserFactory()
        self.assertIsInstance(user, User)
        self.assertTrue(user.email.endswith('@edu.p.lodz.pl'))
    
    def test_authentication(self):
        """Test authentication works"""
        self.assertIsNotNone(self.test_user)
        # Force login should work
        self.client.force_login(self.test_user)
        # Check that we can access authenticated endpoints
        response = self.client.get('/api/')
        self.assertNotEqual(response.status_code, 401)


@pytest.mark.django_db
def test_pytest_works():
    """Basic pytest verification"""
    assert True
    
    # Test Django ORM works
    user = UserFactory()
    assert user.id is not None


def test_imports():
    """Test all required imports work"""
    import django
    import rest_framework
    import factory
    import pytest
    import plotly
    
    # All imports successful if we get here
    assert True