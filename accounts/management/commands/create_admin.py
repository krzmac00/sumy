from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates a default admin user'

    def handle(self, *args, **kwargs):
        # Default admin credentials
        admin_email = 'admin@p.lodz.pl'
        admin_password = 'admin123'  # In production, use a strong password
        
        # Check if admin user already exists
        if User.objects.filter(email=admin_email).exists():
            self.stdout.write(self.style.WARNING(f'Admin user with email {admin_email} already exists'))
            return
        
        # Create admin user
        admin_user = User.objects.create_superuser(
            email=admin_email,
            password=admin_password,
            first_name='Admin',
            last_name='User',
            login='admin',  # Explicitly set admin login
        )
        
        self.stdout.write(self.style.SUCCESS(f'Admin user created with email: {admin_email}'))
        self.stdout.write(self.style.SUCCESS('Username: admin'))
        self.stdout.write(self.style.SUCCESS(f'Password: {admin_password}'))
        self.stdout.write(self.style.WARNING('IMPORTANT: Change this password in production!'))