"""
Minimal test to verify basic functionality
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_user_creation():
    """Test that we can create a user"""
    user = User.objects.create_user(
        email='test999@edu.p.lodz.pl',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    assert user.id is not None
    assert user.email == 'test999@edu.p.lodz.pl'
    assert user.login == 'test999'
    assert user.role == 'student'


@pytest.mark.django_db
def test_lecturer_creation():
    """Test that we can create a lecturer"""
    user = User.objects.create_user(
        email='john.doe@p.lodz.pl',
        password='testpass123',
        first_name='John',
        last_name='Doe',
        is_staff=True
    )
    assert user.id is not None
    assert user.email == 'john.doe@p.lodz.pl'
    assert user.login == 'john.doe'
    assert user.role == 'lecturer'


@pytest.mark.django_db
def test_thread_creation():
    """Test that we can create a thread"""
    from mainapp.models import Thread
    
    user = User.objects.create_user(
        email='thread_test@edu.p.lodz.pl',
        password='testpass123'
    )
    
    thread = Thread.objects.create(
        title="Test Thread",
        content="Test content",
        author=user,
        category='academic'
    )
    
    assert thread.id is not None
    assert thread.title == "Test Thread"
    assert thread.author == user