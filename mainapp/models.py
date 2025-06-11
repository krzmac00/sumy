from django.db import models
from django.conf import settings
from django.utils import timezone
from .constants import *
import secrets
from django.db import migrations

class SchedulePlan(models.Model):
    DAYS_OF_WEEK_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    name = models.CharField(max_length=200)
    description = models.TextField()
    administrator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plans_created'
    )
    is_active = models.BooleanField(default=True)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='AppliedPlan',
        related_name='subscribed_plans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    code = models.CharField(
        max_length=6,
        unique=False,
        null=True,
        blank=True,
        # default=secrets.token_hex(3).upper(),  # Generuje losowy 6-znakowy kod (np. "A1B2C3")
        help_text="Unikalny kod dostępu do planu",
        default="000000",
    )

    def __str__(self):
        return f"{self.name} (by {self.administrator})"

class ScheduleEvent(models.Model):
    plan = models.ForeignKey(SchedulePlan, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    day_of_week = models.PositiveSmallIntegerField(choices=SchedulePlan.DAYS_OF_WEEK_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50)
    teacher = models.CharField(max_length=100)

    class Meta:
        ordering = ['day_of_week', 'start_time']

class AppliedPlan(models.Model):
    user = models.ForeignKey(  # Poprawione pole
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applied_plans'
    )
    plan = models.ForeignKey(
        'SchedulePlan',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'plan')  # Poprawione unique_together

class Event(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='events'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    category = models.CharField(
        max_length=20,
        choices=CATEGORIES,
        default='private'
    )
    color = models.CharField(max_length=7, editable=False)
    repeat_type = models.CharField(
        max_length=30,
        choices=REPEAT_TYPES,
        default='none'
    )
    schedule_plan = models.ForeignKey(
        'SchedulePlan',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    room = models.CharField(max_length=50, null=True)
    teacher = models.CharField(max_length=100, null=True)

    def save(self, *args, **kwargs):
        self.color = CATEGORY_COLORS.get(self.category, '#808080')
        if self.start_date >= self.end_date:
            raise ValueError("Data rozpoczęcia musi być wcześniejsza niż zakończenia")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.start_date:%Y-%m-%d})"