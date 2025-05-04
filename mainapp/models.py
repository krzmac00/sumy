from django.db import models

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

COLORS = [
    ('#FF0000', 'Red'),
    ('#00FF00', 'Green'),
    ('#0000FF', 'Blue'),
    ('#FFFF00', 'Yellow'),
]

class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORIES, default='private')
    color = models.CharField(max_length=7, choices=COLORS, default='#0000FF')
    is_recurring = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.date} {self.time})"
