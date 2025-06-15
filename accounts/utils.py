import os
from io import BytesIO
from django.core.files.base import ContentFile
# from PIL import Image  # Temporarily commented for migration
import logging

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
PROFILE_PICTURE_SIZE = (400, 400)
THUMBNAIL_SIZE = (100, 100)


def validate_image_file(file):
    """Validate uploaded image file"""
    errors = []
    
    # Check file size
    if file.size > MAX_FILE_SIZE:
        errors.append(f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB")
    
    # Check file extension
    ext = file.name.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"File type '{ext}' is not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Verify it's actually an image
    # try:
    #     img = Image.open(file)
    #     img.verify()
    # except:
    #     errors.append("Invalid image file")
    
    return errors


def process_profile_picture(image_file):
    """Process uploaded profile picture - resize and create thumbnail"""
    # Temporarily return dummy files for migration
    return ContentFile(b"dummy"), ContentFile(b"dummy")
    
    # TODO: Uncomment after installing Pillow
    """try:
        # Open the image
        img = Image.open(image_file)
        
        # Convert to RGB if necessary (for PNG with transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = rgb_img
        
        # Process main profile picture (400x400)
        profile_img = img.copy()
        profile_img.thumbnail(PROFILE_PICTURE_SIZE, Image.Resampling.LANCZOS)
        
        # Make square by cropping
        if profile_img.size[0] != profile_img.size[1]:
            # Get dimensions
            width, height = profile_img.size
            size = min(width, height)
            
            # Calculate cropping box
            left = (width - size) // 2
            top = (height - size) // 2
            right = left + size
            bottom = top + size
            
            # Crop to square
            profile_img = profile_img.crop((left, top, right, bottom))
        
        # Resize to exact dimensions
        profile_img = profile_img.resize(PROFILE_PICTURE_SIZE, Image.Resampling.LANCZOS)
        
        # Save profile picture to BytesIO
        profile_io = BytesIO()
        profile_img.save(profile_io, format='JPEG', quality=85, optimize=True)
        profile_file = ContentFile(profile_io.getvalue())
        
        # Process thumbnail (100x100)
        thumb_img = profile_img.copy()
        thumb_img = thumb_img.resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        # Save thumbnail to BytesIO
        thumb_io = BytesIO()
        thumb_img.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_file = ContentFile(thumb_io.getvalue())
        
        return profile_file, thumb_file
        
    except Exception as e:
        logger.error(f"Error processing profile picture: {str(e)}")
        raise"""


def delete_old_profile_pictures(user):
    """Delete old profile pictures when uploading new ones"""
    try:
        if user.profile_picture:
            if os.path.isfile(user.profile_picture.path):
                os.remove(user.profile_picture.path)
        
        if user.profile_thumbnail:
            if os.path.isfile(user.profile_thumbnail.path):
                os.remove(user.profile_thumbnail.path)
    except Exception as e:
        logger.error(f"Error deleting old profile pictures: {str(e)}")