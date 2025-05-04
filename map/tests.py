from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from map.models import Building, Floor, Room


class BuildingTests(APITestCase):

    def setUp(self):
        # Tworzymy dane testowe
        self.building_1 = Building.objects.create(name="Centrum Technologii Informatycznych", short_name="CTI")
        self.building_2 = Building.objects.create(name="Budynek B9", short_name="B9")

        # Tworzymy piętra
        self.floor_1 = Floor.objects.create(number=0, building=self.building_1)
        self.floor_2 = Floor.objects.create(number=1, building=self.building_2)

        # Tworzymy sale
        Room.objects.create(number="001", room_type="lecture", floor=self.floor_1)
        Room.objects.create(number="002", room_type="lab", floor=self.floor_2)

    def test_building_list(self):
        url = reverse('building-list')
        response = self.client.get(url)

        # Sprawdzamy czy odpowiedź jest poprawna
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Centrum Technologii Informatycznych')

    def test_building_detail(self):
        url = reverse('building-detail', args=[self.building_1.id])
        response = self.client.get(url)

        # Sprawdzamy szczegóły budynku
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Centrum Technologii Informatycznych')
        self.assertEqual(len(response.data['floors']), 1)

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

