#!/bin/bash
# Script to apply migrations safely

# Navigate to project root
cd /mnt/c/repos/sumy/

# Apply migrations
python manage.py migrate mainapp

echo "Migrations applied successfully!"