# PoliConnect - University Portal Authentication System

This project provides a secure, robust authentication system for the PoliConnect university portal, with specific features for students, lecturers, and administrators.

## 🔑 Authentication Features

- **Role-based authentication**: Different permissions for students, lecturers, and administrators
- **Email verification**: Ensures users register with valid university emails
- **JWT authentication**: Secure token-based authentication with refresh mechanism
- **Session security**: Guards against session hijacking and enforces timeouts
- **Password management**: Secure password reset and change workflows

## 🛠️ Technology Stack

- **Backend**: Django/Django REST Framework
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: React with TypeScript (in the front-end directory)

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL 17+ with PostGIS
- Node.js and npm (for frontend)

### Setting Up the Backend

1. Clone the repository
```bash
git clone <repository-url>
cd sumy
```

2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Run migrations
```bash
python manage.py migrate
```

5. Create an admin user
```bash
python manage.py create_admin
```

6. Start the development server
```bash
python manage.py runserver
```

### Setting Up the Frontend

1. Navigate to the frontend directory
```bash
cd front-end
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## 🐋 Docker Setup

The project includes Docker configuration via docker-compose.yaml:

```bash
docker-compose up
```

This will start:
- PostgreSQL database with PostGIS
- The database is exposed on port 5433

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/accounts/register/` - Register a new user
- `GET /api/accounts/activate/{token}/` - Activate account
- `POST /api/accounts/token/` - Obtain JWT tokens (login)
- `POST /api/accounts/token/refresh/` - Refresh access token
- `POST /api/accounts/logout/` - Logout and invalidate token
- `POST /api/accounts/change-password/` - Change password

See the [accounts README](accounts/README.md) for more detailed API documentation.

## 🧪 Testing

Run the Django test suite:

```bash
python manage.py test
```

For specific app tests:

```bash
python manage.py test accounts
```

## 🔐 Security Notes

- In production, change the default admin password
- Configure proper email settings for production
- Update the Django SECRET_KEY
- Enable HTTPS in production

## ⚙️ Configuration

See [settings.py](sumy/settings.py) for all configurable options, including:

- JWT token lifetime settings
- Session security parameters
- Email configuration
- API throttling rates


## 🔄 Development notes:

When major problems with running occurs:

### Backend > database related:

- delete docker volume

- run:
```bash
docker-compose up -d
python manage.py makemigrations
python manage.py migrate
```

### Frontend:
- run:
```bash
rm -rf node_modules package-lock.json
npm install
```