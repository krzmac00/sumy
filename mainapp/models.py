from django.db import models
from .constants import CATEGORY_COLORS
from datetime import date, time, datetime
from datetime import *

CATEGORIES = [
    ('important', 'Important'),
    ('private', 'Private'),
    ('exam', 'Exam'),
    ('club', 'Scientific Club'),
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
    start_date = models.DateField(default=get_today)
    start_time = models.TimeField(default=time(9, 0))
    end_date = models.DateField(default=get_today)
    end_time = models.TimeField(default=(datetime.combine(datetime.today(), datetime.min.time()) + timedelta(hours=1)).time())
    # location = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    color = models.CharField(max_length=10, choices=[(k, v) for k, v in CATEGORY_COLORS.items()]) ##choices=CATEGORY_COLORS
    repeat_type = models.CharField(max_length=10, choices=REPEAT_TYPES, default='none')
    #profile = models.ForeignKey(User, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        self.color = CATEGORY_COLORS.get(self.category, '#808080')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.date} {self.time})"


