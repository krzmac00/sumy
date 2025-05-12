from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.http import JsonResponse
import datetime

class SessionInactivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip middleware for non-authenticated users
        if not request.user.is_authenticated:
            return self.get_response(request)
        
        # Check last activity timestamp in session
        last_activity = request.session.get('last_activity')
        
        # Get timeout from settings or use default
        timeout_minutes = getattr(settings, 'SESSION_INACTIVITY_TIMEOUT', 30)
        
        if last_activity:
            # Convert string timestamp to datetime
            last_activity_time = datetime.datetime.fromisoformat(last_activity)
            
            # Check if inactive for too long
            time_inactive = timezone.now() - last_activity_time
            if time_inactive.total_seconds() > timeout_minutes * 60:
                # User inactive too long, log them out
                request.session.flush()
                return JsonResponse({
                    'detail': 'Session expired due to inactivity.',
                    'code': 'session_inactive'
                }, status=401)
        
        # Update last activity timestamp
        request.session['last_activity'] = timezone.now().isoformat()
        
        # Continue with the request
        return self.get_response(request)


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Add Content-Security-Policy in production
        if not settings.DEBUG:
            response['Content-Security-Policy'] = "default-src 'self'; img-src 'self' data:; font-src 'self'; style-src 'self' 'unsafe-inline';"
        
        return response


class IPUserAgentBindingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip for non-authenticated users
        if not request.user.is_authenticated:
            return self.get_response(request)
        
        # Get current request IP and user agent
        current_ip = self.get_client_ip(request)
        current_user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Get stored values from session
        session_ip = request.session.get('user_ip')
        session_user_agent = request.session.get('user_agent')
        
        # If values are stored in session, check if they match
        if session_ip and session_user_agent:
            ip_mismatch = session_ip != current_ip
            ua_mismatch = session_user_agent != current_user_agent
            
            # If settings specify strict checking and either doesn't match
            strict_check = getattr(settings, 'SESSION_SECURITY_STRICT', False)
            
            if strict_check and (ip_mismatch or ua_mismatch):
                # Possible session hijacking, log out user
                request.session.flush()
                return JsonResponse({
                    'detail': 'Session invalidated due to security concerns.',
                    'code': 'session_security'
                }, status=401)
        
        # Store current values in session
        request.session['user_ip'] = current_ip
        request.session['user_agent'] = current_user_agent
        
        return self.get_response(request)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip