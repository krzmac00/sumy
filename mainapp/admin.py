from django.contrib import admin
from .models import SchedulePlan, AppliedPlan, Event

@admin.register(SchedulePlan)
class SchedulePlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'administrator', 'is_active']

# @admin.register(ScheduleEvent)
# class ScheduleEventAdmin(admin.ModelAdmin):
#     list_display = ['title', 'plan', 'day_of_week']

admin.site.register(Event)
admin.site.register(AppliedPlan)