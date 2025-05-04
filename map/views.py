from rest_framework import generics, filters
from .models import Building, Floor, Room
from .serializers import BuildingSerializer, FloorSerializer, RoomSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view

class BuildingListView(generics.ListAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

class BuildingDetailView(generics.RetrieveAPIView):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer

@api_view(['GET'])
def search_view(request):
    query = request.GET.get('q', '').lower()
    buildings = Building.objects.filter(name__icontains=query) | Building.objects.filter(short_name__icontains=query)
    rooms = Room.objects.filter(number__icontains=query)

    return Response({
        'buildings': BuildingSerializer(buildings, many=True).data,
        'rooms': RoomSerializer(rooms, many=True).data,
    })

@api_view(['GET'])
def autocomplete_view(request):
    term = request.GET.get('term', '')
    building_suggestions = Building.objects.filter(name__icontains=term)[:5]
    room_suggestions = Room.objects.filter(number__istartswith=term)[:5]

    return Response({
        'suggestions': {
            'buildings': [b.name for b in building_suggestions],
            'rooms': [r.number for r in room_suggestions],
        }
    })
