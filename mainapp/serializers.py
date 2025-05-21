from rest_framework import serializers
from .models import Event
from datetime import datetime
from .constants import CATEGORY_COLORS

class EventSerializer(serializers.ModelSerializer):
    start = serializers.DateTimeField(source='start_date')
    end = serializers.DateTimeField(source='end_date')
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'user', 
            'title',
            'description',
            'start',
            'end',
            'category',
            'color',
            'repeat_type'
        ]
