#!/bin/bash

# Check if virtual environment exists, if not create one
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Make migrations for the accounts app
echo "Creating migrations for accounts app..."
python manage.py makemigrations accounts

# Apply all migrations
echo "Applying migrations..."
python manage.py migrate

# Create admin user
echo "Creating admin user..."
python manage.py create_admin

echo "Setup completed successfully!"
echo "You can now start the development server with: python manage.py runserver"