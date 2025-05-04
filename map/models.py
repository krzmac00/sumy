from django.db import models

class Building(models.Model):
    name = models.CharField(max_length=100, unique=True)
    short_name = models.CharField(max_length=10)  # np. B9, CTI

    def __str__(self):
        return self.name

class Floor(models.Model):
    number = models.IntegerField()
    building = models.ForeignKey(Building, related_name='floors', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('number', 'building')

    def __str__(self):
        return f"{self.building.short_name} - floor {self.number}"

class Room(models.Model):
    ROOM_TYPES = [
        ('lecture', 'Sala wykładowa'),
        ('lab', 'Sala laboratoryjna'),
        ('office', 'Gabinet'),
    ]

    number = models.CharField(max_length=10)  # np. 421
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    floor = models.ForeignKey(Floor, related_name='rooms', on_delete=models.CASCADE)

    def __str__(self):
        return f"Sala {self.number} ({self.get_room_type_display()})"
