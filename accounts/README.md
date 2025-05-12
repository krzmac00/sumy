# University Authentication System

This Django application provides a comprehensive authentication system for a university portal, with specific features for students, lecturers, and administrators.

## Features

### User Management
- Custom User model with role-based permissions (student, lecturer, admin)
- Email-based registration with university email validation
- Account activation via email verification
- Role detection based on email format:
  - Student format: `123456@edu.p.lodz.pl` (all digits before the domain)
  - Lecturer format: `firstname.lastname@edu.p.lodz.pl`

### Authentication
- JWT (JSON Web Token) based authentication
- Token refresh mechanism
- Token blacklisting for logout
- Session security features:
  - IP binding
  - User agent verification
  - Session timeout for inactivity

### Password Management
- Password reset with email verification
- Strong password validation
- Password change verification via email

### Security Features
- CSRF protection
- API throttling and rate limiting
- Proper HTTP security headers
- Session hijacking prevention

## API Endpoints

### Authentication
- `POST /api/accounts/token/` - Obtain JWT token pair (login)
- `POST /api/accounts/token/refresh/` - Refresh access token
- `POST /api/accounts/token/verify/` - Verify token validity
- `POST /api/accounts/logout/` - Logout and blacklist token

### Registration and Activation
- `POST /api/accounts/register/` - Register a new user
- `GET /api/accounts/activate/{token}/` - Activate user account

### Password Management
- `POST /api/accounts/change-password/` - Change password
- `GET /api/accounts/verify-password/{token}/` - Verify password change

### User Profile and Management
- `GET /api/accounts/me/` - Get current user details
- `POST /api/accounts/change-role/{user_id}/` - Change user role (admin only)

## Setup and Configuration

### Creating Admin User
Run the following management command to create a default admin user:

```bash
python manage.py create_admin
```

This will create an admin user with the following credentials:
- Email: admin@edu.p.lodz.pl
- Login: admin
- Password: admin123 (change this in production!)

### Email Configuration
By default, the system uses the console email backend for development. For production, configure your email settings in `settings.py`.

### Security Settings
Session security settings can be configured in `settings.py`:
- `SESSION_INACTIVITY_TIMEOUT` - Timeout in minutes for inactive sessions
- `SESSION_SECURITY_STRICT` - Whether to enforce strict IP and user agent binding