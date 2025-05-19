from django.db import models

class BuildingType(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Building(models.Model):
    name = models.CharField(max_length=100, unique=True)
    short_name = models.CharField(max_length=10)  # np. B9, CTI
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    types = models.ManyToManyField(BuildingType, related_name='buildings', blank=True)

    def __str__(self):
        return self.name

class Floor(models.Model):
    number = models.IntegerField()
    building = models.ForeignKey(Building, related_name='floors', on_delete=models.CASCADE)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        unique_together = ('number', 'building')

    def __str__(self):
        return f"{self.building.short_name} - floor {self.number}"

class Room(models.Model):
    number = models.CharField(max_length=10)  # np. 421
    floor = models.ForeignKey(Floor, related_name='rooms', on_delete=models.CASCADE)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"Sala {self.number}"
