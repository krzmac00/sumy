from django.db import models
from .constants import CATEGORY_COLORS
from datetime import date

CATEGORIES = [
    ('important', 'Important'),
    ('private', 'Private'),
    ('exam', 'Exam'),
    ('club', 'Science Club'),
    ('university', 'University-events'),
]

REPEAT_TYPES = [
    ('none', 'None'),
    ('weekly', 'Weekly'),
    ('monthly', 'Monthly'),
]

def get_today():
    return date.today()

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(default=get_today)
    end_date = models.DateTimeField(default=get_today)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    color = models.CharField(max_length=10, blank=True)
    repeat_type = models.CharField(max_length=10, choices=REPEAT_TYPES, default='none')

    def save(self, *args, **kwargs):
        self.color = CATEGORY_COLORS.get(self.category, '#808080')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.start_date} - {self.end_date})"
