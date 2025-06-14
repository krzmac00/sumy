#!/bin/bash

echo "Setting up Noticeboard backend..."

# Check if we're using Docker
if command -v docker-compose &> /dev/null; then
    echo "Using Docker setup..."
    
    # Start the database if not running
    docker-compose up -d db
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 5
    
    # Run migrations
    echo "Creating and applying migrations..."
    docker-compose run --rm web python manage.py makemigrations noticeboard
    docker-compose run --rm web python manage.py migrate
    
    echo "Starting Django backend..."
    docker-compose up -d web
    
else
    echo "Using local setup..."
    
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        echo "Activating virtual environment..."
        source venv/bin/activate
        
        # Install dependencies if needed
        pip install -r requirements.txt
        
        # Create and apply migrations
        echo "Creating migrations for noticeboard..."
        python manage.py makemigrations noticeboard
        
        echo "Applying migrations..."
        python manage.py migrate
        
        echo "Starting Django server..."
        python manage.py runserver
    else
        echo "Virtual environment not found. Please create one first."
        echo "Run: python3 -m venv venv"
        echo "Then: source venv/bin/activate"
        echo "And: pip install -r requirements.txt"
    fi
fi