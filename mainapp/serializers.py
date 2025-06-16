from rest_framework import serializers
from .models import Event
from .post import ThreadSerializer, Thread, PinnedThread

class EventSerializer(serializers.ModelSerializer):
    start = serializers.DateTimeField(source='start_date')
    end = serializers.DateTimeField(source='end_date')

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'start',
            'end',
            'category',
            'color',
            'repeat_type'
        ]


class PinnedThreadSerializer(serializers.ModelSerializer):
    thread_data = ThreadSerializer(source='thread', read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PinnedThread
        fields = ['id', 'thread', 'thread_data', 'pinned_at', 'last_viewed', 'unread_count']
        read_only_fields = ['pinned_at', 'last_viewed']
    
    def get_unread_count(self, obj):
        return obj.get_unread_count()


class PinThreadSerializer(serializers.Serializer):
    thread_id = serializers.IntegerField()
    
    def validate_thread_id(self, value):
        if not Thread.objects.filter(id=value).exists():
            raise serializers.ValidationError("Thread does not exist.")
        return value
