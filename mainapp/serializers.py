from rest_framework import serializers
from .models import Event
from datetime import datetime
from .constants import CATEGORY_COLORS

class EventSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()
    start = serializers.SerializerMethodField()
    end = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id','title', 'description', 'start_date', 'start_time', 'end_date', 'end_time', 'category', 'repeat_type'] 

    def get_start(self, obj):
        return datetime.combine(obj.date, obj.time)

    def get_end(self, obj):
        return datetime.combine(obj.end_date, obj.end_time)

    def get_color(self, obj):
        return CATEGORY_COLORS.get(obj.category, '#000000')
