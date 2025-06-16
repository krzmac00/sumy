from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Clean up corrupted profile pictures'

    def handle(self, *args, **options):
        self.stdout.write('Checking profile pictures...')
        
        users_cleaned = 0
        
        for user in User.objects.exclude(profile_picture=''):
            if user.profile_picture:
                try:
                    # Check if file exists and is valid
                    if os.path.exists(user.profile_picture.path):
                        size = os.path.getsize(user.profile_picture.path)
                        if size < 100:  # Less than 100 bytes is definitely corrupted
                            self.stdout.write(f'Removing corrupted picture for user {user.email}')
                            os.remove(user.profile_picture.path)
                            user.profile_picture = None
                            users_cleaned += 1
                except:
                    user.profile_picture = None
                    users_cleaned += 1
                    
            if user.profile_thumbnail:
                try:
                    # Check if file exists and is valid
                    if os.path.exists(user.profile_thumbnail.path):
                        size = os.path.getsize(user.profile_thumbnail.path)
                        if size < 100:  # Less than 100 bytes is definitely corrupted
                            self.stdout.write(f'Removing corrupted thumbnail for user {user.email}')
                            os.remove(user.profile_thumbnail.path)
                            user.profile_thumbnail = None
                            users_cleaned += 1
                except:
                    user.profile_thumbnail = None
                    users_cleaned += 1
                    
            if users_cleaned > 0:
                user.save()
                
        self.stdout.write(self.style.SUCCESS(f'Cleaned up {users_cleaned} corrupted images'))