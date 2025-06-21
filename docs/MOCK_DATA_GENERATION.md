# Mock Data Generation Guide

This guide explains how to populate your PoliConnect database with realistic mock data for testing and development.

## Overview

The mock data generator creates realistic test data for:
- **Calendar Events** - Lectures, exams, meetings, workshops, seminars, and deadlines
- **Advertisements** - Sales, purchases, services, events, lost & found items
- **News Items** - University, faculty, department, and student council news

All data is generated with timestamps randomly distributed across the past and upcoming week to simulate realistic activity.

## Using the Django Management Command (Recommended)

### Basic Usage

```bash
python manage.py populate_mock_data
```

This will create:
- 50 calendar events
- 30 advertisements (with comments)
- 20 news items

### Custom Quantities

```bash
python manage.py populate_mock_data --events 100 --ads 50 --news 30
```

### Clear Existing Data First

```bash
python manage.py populate_mock_data --clear
```

### Skip Confirmation Prompt

```bash
python manage.py populate_mock_data --no-input
```

### All Options

```bash
python manage.py populate_mock_data --help

Options:
  --events EVENTS       Number of calendar events to create (default: 50)
  --ads ADS            Number of advertisements to create (default: 30)
  --news NEWS          Number of news items to create (default: 20)
  --clear              Clear existing data before adding new mock data
  --no-input           Do not prompt for confirmation
```

## Using the Standalone Script

If you prefer to use the standalone script:

```bash
python populate_mock_data.py
```

This script will:
1. Prompt for confirmation
2. Check for existing users and lecturers
3. Create test users/lecturers if needed
4. Generate all mock data
5. Display a summary

## Data Characteristics

### Calendar Events
- Random distribution across next 7 days
- Various event types (lectures, exams, meetings, etc.)
- Duration between 1-4 hours
- Mix of categories (important, private, exam, club, etc.)
- Realistic room/building locations

### Advertisements
- Posted within the past 7 days
- Realistic categories and content
- Some ads have prices, some don't
- 70% have expiry dates
- 40% receive 1-5 comments
- Comments update last activity date

### News Items
- Posted by lecturers only
- Categorized (university, faculty, department, etc.)
- Some include event information
- Multi-paragraph content
- 30% belong to multiple categories

## Test Data Accounts

If no users exist, the generator creates:

### Students
- Email: `student0@edu.p.lodz.pl` to `student9@edu.p.lodz.pl`
- Password: `testpass123`

### Lecturers
- Email: `lecturer0@p.lodz.pl` to `lecturer4@p.lodz.pl`
- Password: `testpass123`

## Database Impact

The generator modifies these tables:
- `mainapp_event`
- `noticeboard_advertisement`
- `noticeboard_comment`
- `news_newsitem`
- `news_newsitem_categories` (M2M)
- `accounts_user` (if creating test users)
- `accounts_lecturer` (if creating test lecturers)

## Best Practices

1. **Development Environment**: Always test in development first
2. **Backup**: Backup your database before running with `--clear`
3. **Reasonable Quantities**: Don't generate excessive amounts that might slow down your app
4. **Regular Refresh**: Consider clearing and regenerating data periodically for fresh test scenarios

## Troubleshooting

### "No active users found"
The generator will automatically create 10 test student accounts.

### "No lecturers found"
The generator will automatically create 5 test lecturer accounts.

### "No news categories found"
Default categories will be created: University, Faculty, Department, Student Council, Events.

### Event Creation Errors
If the Event model doesn't have a `location` field, the generator will skip it gracefully.

## Example Workflow

```bash
# 1. Clear old test data and generate fresh data
python manage.py populate_mock_data --clear --no-input

# 2. Add more data to existing
python manage.py populate_mock_data --events 20 --ads 10 --news 5

# 3. Check the results
python manage.py shell
>>> from mainapp.models import Event
>>> from noticeboard.models import Advertisement
>>> from news.models import NewsItem
>>> print(f"Events: {Event.objects.count()}")
>>> print(f"Ads: {Advertisement.objects.count()}")
>>> print(f"News: {NewsItem.objects.count()}")
```

## Note on Faker Library

The generator uses the Faker library to create realistic:
- Names
- Email addresses
- Phone numbers
- Company names
- Text content
- Catch phrases

This ensures the mock data looks realistic and varied.