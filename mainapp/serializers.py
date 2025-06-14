from rest_framework import serializers
from .models import SchedulePlan, AppliedPlan, Event

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

