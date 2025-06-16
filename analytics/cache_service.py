from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
from functools import wraps
import hashlib
import json
import time


class CacheService:
    """Advanced caching service with intelligent invalidation."""
    
    # Cache key prefixes
    PREFIX_USER = 'user'
    PREFIX_THREAD = 'thread'
    PREFIX_POST = 'post'
    PREFIX_NEWS = 'news'
    PREFIX_NOTICE = 'notice'
    PREFIX_SEARCH = 'search'
    PREFIX_LIST = 'list'
    
    # Cache timeouts
    TIMEOUT_SHORT = 60  # 1 minute
    TIMEOUT_MEDIUM = 300  # 5 minutes
    TIMEOUT_LONG = 3600  # 1 hour
    TIMEOUT_DAY = 86400  # 1 day
    
    @staticmethod
    def make_key(*args):
        """Generate a cache key from arguments."""
        key_parts = [str(arg) for arg in args]
        return ':'.join(key_parts)
    
    @staticmethod
    def make_hash_key(data):
        """Generate a hash key for complex data."""
        if isinstance(data, dict):
            data = json.dumps(data, sort_keys=True)
        return hashlib.md5(str(data).encode()).hexdigest()
    
    @classmethod
    def get_or_set(cls, key, callable_or_value, timeout=None):
        """Get from cache or set if not exists."""
        value = cache.get(key)
        if value is None:
            if callable(callable_or_value):
                value = callable_or_value()
            else:
                value = callable_or_value
            cache.set(key, value, timeout or cls.TIMEOUT_MEDIUM)
        return value
    
    @classmethod
    def invalidate_pattern(cls, pattern):
        """Invalidate all keys matching a pattern."""
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(f'{pattern}*')
        else:
            # Fallback for caches without pattern support
            # This is less efficient but works
            keys = cache.keys(f'{pattern}*')
            if keys:
                cache.delete_many(keys)
    
    @classmethod
    def invalidate_user(cls, user_id):
        """Invalidate all caches related to a user."""
        patterns = [
            cls.make_key(cls.PREFIX_USER, user_id),
            cls.make_key(cls.PREFIX_SEARCH, 'user', user_id),
        ]
        for pattern in patterns:
            cls.invalidate_pattern(pattern)
    
    @classmethod
    def invalidate_thread(cls, thread_id):
        """Invalidate all caches related to a thread."""
        patterns = [
            cls.make_key(cls.PREFIX_THREAD, thread_id),
            cls.make_key(cls.PREFIX_LIST, cls.PREFIX_THREAD),
        ]
        for pattern in patterns:
            cls.invalidate_pattern(pattern)
    
    @classmethod
    def invalidate_post(cls, post_id, thread_id=None):
        """Invalidate all caches related to a post."""
        patterns = [
            cls.make_key(cls.PREFIX_POST, post_id),
        ]
        if thread_id:
            patterns.append(cls.make_key(cls.PREFIX_THREAD, thread_id))
        for pattern in patterns:
            cls.invalidate_pattern(pattern)
    
    @classmethod
    def cached_search(cls, search_type, query, filters=None, timeout=None):
        """Cache search results."""
        key_parts = [cls.PREFIX_SEARCH, search_type, query]
        if filters:
            key_parts.append(cls.make_hash_key(filters))
        
        key = cls.make_key(*key_parts)
        return key, timeout or cls.TIMEOUT_SHORT
    
    @classmethod
    def cache_list_response(cls, prefix, params, data, timeout=None):
        """Cache list API responses."""
        key = cls.make_key(cls.PREFIX_LIST, prefix, cls.make_hash_key(params))
        cache.set(key, data, timeout or cls.TIMEOUT_MEDIUM)
        return key
    
    @classmethod
    def get_list_response(cls, prefix, params):
        """Get cached list API response."""
        key = cls.make_key(cls.PREFIX_LIST, prefix, cls.make_hash_key(params))
        return cache.get(key)


def cache_response(timeout=None, key_func=None, vary_on_user=True):
    """
    Decorator to cache view responses.
    
    Args:
        timeout: Cache timeout in seconds
        key_func: Function to generate cache key
        vary_on_user: Whether to vary cache by user
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(request, *args, **kwargs)
            else:
                key_parts = [
                    func.__name__,
                    request.get_full_path(),
                ]
                if vary_on_user and request.user.is_authenticated:
                    key_parts.append(str(request.user.id))
                cache_key = CacheService.make_key(*key_parts)
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Get fresh response
            response = func(self, request, *args, **kwargs)
            
            # Cache successful responses
            if hasattr(response, 'status_code') and 200 <= response.status_code < 300:
                cache.set(cache_key, response, timeout or CacheService.TIMEOUT_MEDIUM)
            
            return response
        return wrapper
    return decorator


def cache_method(timeout=None, key_prefix=None):
    """
    Decorator to cache method results.
    
    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key
            key_parts = [
                key_prefix or func.__name__,
                self.__class__.__name__,
                str(getattr(self, 'pk', id(self))),
            ]
            key_parts.extend(str(arg) for arg in args)
            key_parts.append(CacheService.make_hash_key(kwargs))
            
            cache_key = CacheService.make_key(*key_parts)
            
            # Try to get from cache
            cached = cache.get(cache_key)
            if cached is not None:
                return cached
            
            # Get fresh result
            result = func(self, *args, **kwargs)
            
            # Cache result
            cache.set(cache_key, result, timeout or CacheService.TIMEOUT_MEDIUM)
            
            return result
        return wrapper
    return decorator


class CachedCounter:
    """Efficient counter using cache with periodic database sync."""
    
    def __init__(self, key, sync_interval=60):
        self.key = f'counter:{key}'
        self.sync_interval = sync_interval
        self.sync_key = f'{self.key}:last_sync'
    
    def increment(self, amount=1):
        """Increment counter in cache."""
        try:
            return cache.incr(self.key, amount)
        except ValueError:
            # Key doesn't exist, initialize it
            cache.set(self.key, amount, timeout=None)
            return amount
    
    def decrement(self, amount=1):
        """Decrement counter in cache."""
        return cache.decr(self.key, amount)
    
    def get(self):
        """Get current counter value."""
        value = cache.get(self.key)
        return value if value is not None else 0
    
    def reset(self):
        """Reset counter to zero."""
        cache.set(self.key, 0, timeout=None)
    
    def should_sync(self):
        """Check if it's time to sync with database."""
        last_sync = cache.get(self.sync_key)
        if last_sync is None:
            return True
        return time.time() - last_sync > self.sync_interval
    
    def mark_synced(self):
        """Mark as synced with database."""
        cache.set(self.sync_key, time.time(), timeout=None)