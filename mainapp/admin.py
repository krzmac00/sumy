from django.contrib import admin
from .models import SchedulePlan, AppliedPlan, Event

class SchedulePlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'administrator', 'is_active']

admin.site.register(Event)
admin.site.register(AppliedPlan)
