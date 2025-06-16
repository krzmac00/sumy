"""Simple image handling without Pillow for development"""
import os
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']


def validate_image_file_simple(file):
    """Basic file validation without image verification"""
    errors = []
    
    # Check file size
    if file.size > MAX_FILE_SIZE:
        errors.append(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB")
    
    # Check file extension
    ext = file.name.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"File type '{ext}' is not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    return errors


def process_profile_picture_simple(image_file):
    """Simple file handling without image processing"""
    try:
        # Read the file content
        image_file.seek(0)
        content = image_file.read()
        image_file.seek(0)
        
        # Return the same content for both profile and thumbnail
        # In production, this should resize the images
        profile_file = ContentFile(content)
        thumb_file = ContentFile(content)
        
        return profile_file, thumb_file
        
    except Exception as e:
        logger.error(f"Error handling profile picture: {str(e)}")
        raise