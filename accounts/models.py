from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import ArrayField
from django.core.validators import FileExtensionValidator
import re
import os
from uuid import uuid4


def profile_picture_path(instance, filename):
    """Generate unique path for profile pictures"""
    # Always save as .jpg since we convert to JPEG
    filename = f'{uuid4()}.jpg'
    return os.path.join('profile_pictures', str(instance.id), filename)


def profile_thumbnail_path(instance, filename):
    """Generate unique path for profile thumbnails"""
    # Always save as .jpg since we convert to JPEG
    filename = f'{uuid4()}_thumb.jpg'
    return os.path.join('profile_pictures', str(instance.id), 'thumbnails', filename)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # Check if login is already provided
        login = extra_fields.pop('login', None)
        
        # Only generate login from email if not explicitly provided
        if not login:
            if email.endswith('@edu.p.lodz.pl'):
                username_part = email.split('@')[0]
                if username_part.isdigit():
                    # Student
                    login = username_part
                    extra_fields.setdefault('role', 'student')
                else:
                    # Default case for @edu.p.lodz.pl (shouldn't happen for lecturers now)
                    login = username_part
            elif email.endswith('@p.lodz.pl'):
                username_part = email.split('@')[0]
                # Lecturer - extract first_name.last_name
                match = re.match(r'^([a-zA-Z]+)\.([a-zA-Z]+)$', username_part)
                if match:
                    login = username_part
                    extra_fields.setdefault('role', 'lecturer')
                else:
                    # Default case
                    login = username_part
            else:
                # Default fallback for non-university emails
                login = email.split('@')[0]
        
        user = self.model(email=email, login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('admin', 'Admin'),
    )
    
    email = models.EmailField(_('email address'), unique=True)
    login = models.CharField(_('login'), max_length=150, unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    role = models.CharField(_('role'), max_length=20, choices=ROLES, default='student')
    blacklist = ArrayField(
        base_field=models.CharField(max_length=511),
        default=list,
        blank=True,
        verbose_name='blacklist'
    )
    
    # Profile picture fields
    profile_picture = models.ImageField(
        upload_to=profile_picture_path,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif', 'webp'])],
        blank=True,
        null=True,
        verbose_name='profile picture'
    )
    profile_thumbnail = models.ImageField(
        upload_to=profile_thumbnail_path,
        blank=True,
        null=True,
        verbose_name='profile thumbnail'
    )
    profile_picture_uploaded_at = models.DateTimeField(blank=True, null=True)
    profile_picture_file_size = models.PositiveIntegerField(blank=True, null=True)

    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=False,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        
    def __str__(self):
        return self.email
        
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
        
    def get_short_name(self):
        return self.first_name


class EmailActivationToken(models.Model):
    user = models.ForeignKey(User, related_name='activation_tokens', on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Token for {self.user.email}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Profile of {self.user.email}"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()