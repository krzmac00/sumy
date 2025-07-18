# PoliConnect - University Portal for students and lecturers

PoliConnect is a web application dedicated to students and lecturers at Lodz University of Technology, aimed at improving communication and facilitating the organization of student life. It is intended to address the shortcomings of the current system and gather everything students need for their education in one place.

## 📄 About project

PoliConnect is a comprehensive university portal designed specifically for the academic community at Lodz University of Technology. Built with a strong focus on usability and scalability, it aims to streamline communication, support student organization, and provide an intuitive digital space for students, lecturers, and university administrators. The platform is a response to the limitations of the existing systems used at the university.

![Intro](media/intro.gif)

### 🎯 Project Vision

Developed as part of a team effort by six students, PoliConnect supports the 4th Sustainable Development Goal (SDG 4): Quality Education. The project reinforces the idea that the quality of education is not only determined by curriculum content but also by the technological tools supporting it.

By enabling better access to academic information, enhancing social connectivity, and simplifying administrative processes, PoliConnect fosters a more integrated and efficient university experience.

### 👥 Our Team

**Backend developers**:
- Katarzyna Pietrzyk 
- Patryk Augustyniak 
- Tomasz Genderka 

**Frontend developers**:
- Karolina Linek
- Krzysztof Macherzyński
- Milena Yakhno

Our work was divided into frontend and backend teams, with agile methods guiding our iterative development process.

### 🛠️ Technology Stack

- **Backend**: Django/Django REST Framework
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: React with TypeScript (in the front-end directory)

## 📱 Key Features

PoliConnect offers an integrated set of modules to support the daily life of students and staff:

- **Forum**: A modern discussion board with anonymity options, subscriptions, moderation, filters, and tagging.
- **Calendar**: Customizable weekly/monthly calendar with event categorization, Google export, and support for repeating events.
- **Map**: Interactive campus map with searchable buildings, categorized filtering, and detailed building/sala (room) info.
- **Noticeboard**: University-wide announcements and customizable user feed with advanced filtering and notification system.
- **Authentication**: Role-based access for students, lecturers, and admins, email verification with p.lodz.pl domain restriction.
- **Security**: HTTPS communication, password hashing, and robust session control.

### 🔑 Registration & login
- **Role-based authentication**: Different permissions for students, lecturers, and administrators
- **Email verification**: Ensures users register with valid university emails
- **JWT authentication**: Secure token-based authentication with refresh mechanism
- **Session security**: Guards against session hijacking and enforces timeouts
- **Password management**: Secure password reset and change workflows

![main_page](media/login.gif)

### 🏠 Homepage

Consists of 3 tabs with most crucial information:
- today's events
- news
- pinned thread list

![home](media/main_page.gif)

### 🗪 Forum

Users can create threads and add posts, with additional options to set visibility for lecturers and to publish anonymously. In the user profile, it will be possible to add a bio and set phrase blacklisting for the forum, allowing unwanted content to be hidden.

![forum](media/forum.gif)

### 📢 Noticeboard

Is  a space where students can post announcements related to selling, buying, or exchanging various items — from books and educational materials to electronic devices or furniture.

![board](media/noticeboard.gif)

### 📍 Map

An interactive campus map makes it easier to navigate the university—finding the right building or classroom will become quick and effortless.

![map](media/map.gif)

### 🗓️ Calendar

Thanks to the built-in calendar, users are not only able to keep track of current events and add their own, but also view class schedules and customize them to fit their needs, allowing for flexible schedule management.

![calendar](media/calendar.gif)

## 🎓 Educational Impact

PoliConnect isn’t just a communication platform — it is built to enhance academic performance and student satisfaction by:

- Reducing information overload through personalized feeds
- Improving access to schedules, campus navigation, and discussions
- Creating a unified space for academic and social interaction

With a focus on **modular architecture**, **clean UI**, and **extensibility**, PoliConnect is ready for future development and integration with other university systems.

# 🚀 Getting Started

### Prerequisites

- Python 3.8+
- PostgreSQL 17+ with PostGIS
- Node.js and npm

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