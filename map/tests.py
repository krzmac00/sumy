from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from map.models import Building, Floor, Room, BuildingType


class BuildingTests(APITestCase):

    def setUp(self):
        BuildingType.objects.all().delete()
        Building.objects.all().delete()
        Floor.objects.all().delete()
        Room.objects.all().delete()

        type_admin = BuildingType.objects.create(name="Administracyjny")
        type_faculty = BuildingType.objects.create(name="Wydziałowy")

        self.building_1 = Building.objects.create(
            name="Centrum Technologii Informatycznych", short_name="CTI", latitude=50.2, longitude=45.4)
        self.building_1.types.set([type_admin, type_faculty])

        self.building_2 = Building.objects.create(
            name="Budynek B9", short_name="B9", latitude=52.2, longitude=47.4)
        self.building_2.types.set([type_faculty])

        self.floor_1 = Floor.objects.create(number=0, building=self.building_1, latitude=50.2001, longitude=45.4001)
        self.floor_2 = Floor.objects.create(number=1, building=self.building_2, latitude=52.2001, longitude=47.4001)

        Room.objects.create(number="001", floor=self.floor_1, latitude=50.2002, longitude=45.4002)
        Room.objects.create(number="002", floor=self.floor_2, latitude=52.2002, longitude=47.4002)

    def test_building_list(self):
        url = reverse('building-list')
        response = self.client.get(url)

        # Wypisujemy dane odpowiedzi
        # print("Response data (building list):", response.data)

        # Sprawdzamy czy odpowiedź jest poprawna
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['results'][0]['name'], 'Centrum Technologii Informatycznych')

    def test_building_detail(self):
        url = reverse('building-detail', args=[self.building_1.id])
        response = self.client.get(url)

        # Sprawdzamy szczegóły budynku
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Centrum Technologii Informatycznych')
        self.assertEqual(len(response.data['floors']), 1)
        self.assertIn('latitude', response.data)
        self.assertIn('longitude', response.data)

    def test_search_building(self):
        url = reverse('search') + '?q=CTI'
        response = self.client.get(url)

        # Sprawdzamy, czy znaleziono budynek
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['buildings']), 1)
        self.assertEqual(response.data['buildings'][0]['name'], 'Centrum Technologii Informatycznych')

    def test_autocomplete(self):
        url = reverse('autocomplete') + '?term=cent'
        response = self.client.get(url)

        # Sprawdzamy, czy zwrócono odpowiednią sugestię
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Centrum Technologii Informatycznych", response.data['suggestions']['buildings'])

    def test_buildings_by_type(self):
        url = reverse('buildings-by-type', args=['Wydziałowy'])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        building_names = [b['name'] for b in response.data['results']]
        self.assertIn('Centrum Technologii Informatycznych', building_names)
        self.assertIn('Budynek B9', building_names)

    def test_buildings_by_type_not_found(self):
        url = reverse('buildings-by-type', args=['NieistniejącyTyp'])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


