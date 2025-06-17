"""
Django settings configuration for pytest
"""
import os
import sys
from pathlib import Path

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent

# Add project to Python path
sys.path.insert(0, str(BASE_DIR))

# Configure Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sumy.settings')

# Import Django settings
from sumy.settings import *  # noqa

# Override database for testing
DATABASES['default'] = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'test_sumy',
    'USER': 'postgres',
    'PASSWORD': 'postgres',
    'HOST': 'localhost',
    'PORT': '5432',
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Test-specific settings
DEBUG = True
ALLOWED_HOSTS = ['*']

# Disable cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Media files for tests
MEDIA_ROOT = BASE_DIR / 'test_media'
MEDIA_URL = '/media/'