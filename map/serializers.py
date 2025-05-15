from rest_framework import serializers
from .models import Building, Floor, Room, BuildingType

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'number', 'floor', 'latitude', 'longitude']

class FloorSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Floor
        fields = ['id', 'number', 'latitude', 'longitude', 'rooms']

class BuildingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuildingType
        fields = ['name']

class BuildingSerializer(serializers.ModelSerializer):
    floors = FloorSerializer(many=True, read_only=True)
    types = BuildingTypeSerializer(many=True, read_only=True)

    class Meta:
        model = Building
        fields = ['id', 'name', 'short_name', 'latitude', 'longitude', 'types', 'floors']
