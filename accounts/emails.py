from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_activation_email(user, activation_link):
    """Send account activation email to a user."""
    subject = 'Activate your university account'
    
    context = {
        'user': user,
        'activation_link': activation_link,
    }
    
    # Render email templates
    html_message = render_to_string('accounts/email/activation_email.html', context)
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_verification_email(user, verification_link):
    """Send password change verification email to a user."""
    subject = 'Verify your password change'
    
    context = {
        'user': user,
        'verification_link': verification_link,
    }
    
    # Render email templates
    html_message = render_to_string('accounts/email/password_change_email.html', context)
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )