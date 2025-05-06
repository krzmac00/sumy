import secrets
from django.utils import timezone
from datetime import timedelta
from .models import EmailActivationToken

def generate_activation_token(user):
    """Generate a unique token for email activation."""
    token = secrets.token_hex(32)  # 64 characters hexadecimal string
    
    # Set expiration to 48 hours from now
    expiration = timezone.now() + timedelta(hours=48)
    
    # Create and save the token object
    activation_token = EmailActivationToken.objects.create(
        user=user,
        token=token,
        expires_at=expiration
    )
    
    return token

def validate_activation_token(token):
    """
    Validate an activation token.
    Returns the user if token is valid, None otherwise.
    """
    try:
        # Get the token object
        token_obj = EmailActivationToken.objects.get(
            token=token,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        
        # Mark the token as used
        token_obj.is_used = True
        token_obj.save()
        
        return token_obj.user
    except EmailActivationToken.DoesNotExist:
        return None