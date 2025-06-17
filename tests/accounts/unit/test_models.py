import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from tests.base import BaseTestCase
from tests.factories import UserFactory

User = get_user_model()


class TestUserModel(BaseTestCase):
    """Test User model functionality"""
    
    @BaseTestCase.doc
    def test_create_user_with_email(self):
        """
        Test creating a user with email authentication
        
        Verifies:
        - User can be created with valid university email
        - Password is properly hashed
        - User is inactive by default (needs activation)
        - Username is derived from email
        """
        user = User.objects.create_user(
            email='123456@edu.p.lodz.pl',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        
        self.assertEqual(user.email, '123456@edu.p.lodz.pl')
        self.assertEqual(user.username, '123456')
        self.assertTrue(user.check_password('testpass123'))
        self.assertFalse(user.is_active)  # Users need activation
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    @BaseTestCase.doc
    def test_create_lecturer_user(self):
        """
        Test creating a lecturer user
        
        Verifies:
        - Lecturer email format is accepted
        - is_staff flag is properly set
        """
        user = User.objects.create_user(
            email='jan.kowalski@p.lodz.pl',
            password='lecturepass123',
            first_name='Jan',
            last_name='Kowalski',
            is_staff=True
        )
        
        self.assertEqual(user.email, 'jan.kowalski@p.lodz.pl')
        self.assertTrue(user.is_staff)
        self.assertEqual(user.get_user_type(), 'lecturer')
    
    @BaseTestCase.doc
    def test_email_uniqueness(self):
        """
        Test email uniqueness constraint
        
        Verifies:
        - Cannot create two users with same email
        - Proper error is raised
        """
        User.objects.create_user(
            email='unique@edu.p.lodz.pl',
            password='pass123'
        )
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email='unique@edu.p.lodz.pl',
                password='pass456'
            )
    
    @BaseTestCase.doc
    def test_user_full_name(self):
        """
        Test user full name property
        
        Verifies:
        - Full name is properly formatted
        - Handles missing first or last name
        """
        user = UserFactory(first_name='John', last_name='Doe')
        self.assertEqual(user.get_full_name(), 'John Doe')
        
        user.first_name = ''
        self.assertEqual(user.get_full_name(), 'Doe')
        
        user.first_name = 'John'
        user.last_name = ''
        self.assertEqual(user.get_full_name(), 'John')
    
    @BaseTestCase.doc
    def test_user_str_representation(self):
        """
        Test user string representation
        
        Verifies:
        - __str__ returns email
        """
        user = UserFactory(email='test@edu.p.lodz.pl')
        self.assertEqual(str(user), 'test@edu.p.lodz.pl')
    
    @BaseTestCase.doc 
    def test_superuser_creation(self):
        """
        Test superuser creation
        
        Verifies:
        - Superuser has all permissions
        - is_staff and is_superuser are True
        """
        superuser = User.objects.create_superuser(
            email='admin@p.lodz.pl',
            password='adminpass123'
        )
        
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)


    @BaseTestCase.doc
    def test_user_role_field(self):
        """
        Test user role field functionality
        
        Verifies:
        - Students have student role
        - Lecturers have lecturer role
        - Admin users have admin role
        """
        student = UserFactory(email='123456@edu.p.lodz.pl')
        self.assertEqual(student.role, 'student')
        
        lecturer = UserFactory(email='jan.kowalski@p.lodz.pl', is_staff=True)
        self.assertEqual(lecturer.role, 'lecturer')
        
        admin = User.objects.create_superuser(
            email='admin@p.lodz.pl',
            password='adminpass123'
        )
        self.assertEqual(admin.role, 'admin')
    
    @BaseTestCase.doc
    def test_user_blacklist_field(self):
        """
        Test user blacklist functionality
        
        Verifies:
        - Blacklist is empty by default
        - Can add users to blacklist
        """
        user = UserFactory()
        self.assertEqual(user.blacklist, [])
        
        # Add users to blacklist
        user.blacklist = ['user1@edu.p.lodz.pl', 'user2@edu.p.lodz.pl']
        user.save()
        
        user.refresh_from_db()
        self.assertEqual(len(user.blacklist), 2)
        self.assertIn('user1@edu.p.lodz.pl', user.blacklist)


@pytest.mark.django_db
class TestUserManager:
    """Test custom user manager"""
    
    def test_create_user_without_email(self):
        """Test that creating user without email raises error"""
        with pytest.raises(ValueError, match="The Email field must be set"):
            User.objects.create_user(email='', password='pass123')
    
    def test_create_user_normalizes_email(self):
        """Test email normalization"""
        user = User.objects.create_user(
            email='TEST@EDU.P.LODZ.PL',
            password='pass123'
        )
        assert user.email == 'TEST@edu.p.lodz.pl'
    
    def test_create_superuser_flags(self):
        """Test superuser requires staff and superuser flags"""
        with pytest.raises(ValueError, match="Superuser must have is_staff=True"):
            User.objects.create_superuser(
                email='admin@p.lodz.pl',
                password='pass123',
                is_staff=False
            )
        
        with pytest.raises(ValueError, match="Superuser must have is_superuser=True"):
            User.objects.create_superuser(
                email='admin@p.lodz.pl',
                password='pass123',
                is_superuser=False
            )