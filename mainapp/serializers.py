from rest_framework import serializers
from .models import SchedulePlan, AppliedPlan, Event
from .post import ThreadSerializer, Thread, PinnedThread

# class EventSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Event
#         fields = '__all__'
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        extra_kwargs = {
            'user': {'read_only': True},
            'color': {'read_only': True}
        }
        
class SchedulePlanSerializer(serializers.ModelSerializer):
    events = EventSerializer(many=True, read_only=True)
    administrator = serializers.StringRelatedField()
    is_applied = serializers.SerializerMethodField()

    class Meta:
        model = SchedulePlan
        fields = [
            'id', 
            'name', 
            'description', 
            'administrator',
            'is_active',
            'events',
            'created_at',
            'updated_at',
            'is_applied'
        ]

    def get_is_applied(self, obj):
        user = self.context['request'].user
        return obj.participants.filter(id=user.id).exists()

class AppliedPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppliedPlan
        fields = ['plan', 'start_date', 'end_date', 'is_active']

class ApplyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppliedPlan
        fields = ['start_date', 'end_date']



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
