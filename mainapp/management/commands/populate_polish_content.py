from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random
from mainapp.models import Event, Thread, Post
from news.models import NewsCategory, NewsItem
from noticeboard.models import Advertisement
# No need to import enums, we'll use string values directly

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate database with Polish content related to Politechnika Łódzka'

    def handle(self, *args, **kwargs):
        self.stdout.write('Tworzenie polskiej zawartości...')
        
        # Create or get users
        users = self.create_users()
        
        # Create events
        self.create_events(users)
        
        # Create advertisements
        self.create_advertisements(users)
        
        # Create news
        self.create_news(users)
        
        self.stdout.write(self.style.SUCCESS('Pomyślnie utworzono polską zawartość!'))

    def create_users(self):
        """Create or get test users"""
        users_data = [
            {
                'login': 'jan.kowalski',
                'first_name': 'Jan',
                'last_name': 'Kowalski',
                'email': 'jan.kowalski@p.lodz.pl',
                'role': 'lecturer'
            },
            {
                'login': 'anna.nowak',
                'first_name': 'Anna',
                'last_name': 'Nowak',
                'email': 'anna.nowak@p.lodz.pl',
                'role': 'lecturer'
            },
            {
                'login': '234567',
                'first_name': 'Piotr',
                'last_name': 'Wiśniewski',
                'email': '234567@edu.p.lodz.pl',
                'role': 'student'
            },
            {
                'login': '234568',
                'first_name': 'Katarzyna',
                'last_name': 'Wójcik',
                'email': '234568@edu.p.lodz.pl',
                'role': 'student'
            },
            {
                'login': 'marek.kaminski',
                'first_name': 'Marek',
                'last_name': 'Kamiński',
                'email': 'marek.kaminski@p.lodz.pl',
                'role': 'lecturer'
            }
        ]
        
        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                login=user_data['login'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'email': user_data['email'],
                    'role': user_data['role'],
                    'is_active': True
                }
            )
            if created:
                user.set_password('Test123!')
                user.save()
                self.stdout.write(f'Utworzono użytkownika: {user.login}')
            users.append(user)
        
        return users

    def create_events(self, users):
        """Create 5 events"""
        events_data = [
            {
                'title': 'Wykład inauguracyjny - Sztuczna Inteligencja w Przemyśle',
                'description': 'Zapraszamy na wykład otwarty dotyczący zastosowań sztucznej inteligencji w nowoczesnym przemyśle. Wykład poprowadzi prof. dr hab. inż. Jan Kowalski z Wydziału FTIMS.',
                'category': 'tul_events',
                'start_offset': 7,
                'duration': 2,
                'room': 'Aula A1',
                'teacher': 'prof. dr hab. inż. Jan Kowalski',
                'user': users[0]
            },
            {
                'title': 'Egzamin z Analizy Matematycznej I',
                'description': 'Egzamin końcowy z przedmiotu Analiza Matematyczna I dla studentów 1 roku. Proszę przynieść kalkulator naukowy i dokument tożsamości.',
                'category': 'exam',
                'start_offset': 14,
                'duration': 3,
                'room': 'F5',
                'teacher': 'dr Anna Nowak',
                'user': users[1]
            },
            {
                'title': 'Warsztaty programowania w Pythonie',
                'description': 'Praktyczne warsztaty z podstaw programowania w języku Python. Poziom początkujący. Własny laptop mile widziany.',
                'category': 'club',
                'start_offset': 5,
                'duration': 4,
                'room': 'Lab. 301 B9',
                'teacher': 'mgr inż. Marek Kamiński',
                'user': users[4]
            },
            {
                'title': 'Spotkanie Samorządu Studenckiego',
                'description': 'Miesięczne spotkanie przedstawicieli Samorządu Studenckiego. Omówienie bieżących spraw studenckich i planowanych wydarzeń.',
                'category': 'student_council',
                'start_offset': 3,
                'duration': 2,
                'room': 'Sala konferencyjna C15',
                'teacher': None,
                'user': users[2]
            },
            {
                'title': 'Dzień Otwarty Politechniki Łódzkiej',
                'description': 'Zapraszamy uczniów szkół średnich na Dzień Otwarty PŁ. W programie: zwiedzanie laboratoriów, spotkania z wykładowcami, prezentacje kierunków studiów.',
                'category': 'tul_events',
                'start_offset': 21,
                'duration': 6,
                'room': 'Cały kampus',
                'teacher': None,
                'user': users[0]
            }
        ]
        
        for event_data in events_data:
            start_date = timezone.now() + timedelta(days=event_data['start_offset'])
            end_date = start_date + timedelta(hours=event_data['duration'])
            
            event = Event.objects.create(
                user=event_data['user'],
                title=event_data['title'],
                description=event_data['description'],
                category=event_data['category'],
                repeat_type='none',
                start_date=start_date,
                end_date=end_date,
                room=event_data['room'],
                teacher=event_data['teacher']
            )
            self.stdout.write(f'Utworzono wydarzenie: {event.title}')

    def create_advertisements(self, users):
        """Create 5 advertisements"""
        ads_data = [
            {
                'title': 'Sprzedam podręczniki do Fizyki - 1 rok',
                'content': 'Sprzedam komplet podręczników do Fizyki dla studentów 1 roku:\n- Halliday, Resnick - Podstawy Fizyki tom 1-2\n- Zbiór zadań z fizyki Kaczmarka\nKsiążki w bardzo dobrym stanie, możliwość negocjacji ceny.',
                'category': 'sale',
                'price': 150.00,
                'location': 'Akademik DS1, pokój 305',
                'contact_info': 'Tel: 123-456-789',
                'user': users[2]
            },
            {
                'title': 'Korepetycje z Matematyki - Analiza, Algebra',
                'content': 'Student 4 roku Matematyki Stosowanej oferuje korepetycje z:\n- Analizy Matematycznej\n- Algebry Liniowej\n- Rachunku Prawdopodobieństwa\nPrzygotowanie do kolokwiów i egzaminów. Doświadczenie w prowadzeniu korepetycji.',
                'category': 'service',
                'price': 60.00,
                'location': 'Online lub na terenie kampusu',
                'contact_info': 'Email: korepetycje.mat@example.com',
                'user': users[3]
            },
            {
                'title': 'Szukam współlokatora - mieszkanie przy Politechnice',
                'content': 'Poszukuję współlokatora do 2-pokojowego mieszkania przy ul. Radwańskiej (10 min pieszo do PŁ). Mieszkanie umeblowane, internet, pralka. Preferowane osoby niepalące.',
                'category': 'announcement',
                'price': 800.00,
                'location': 'ul. Radwańska, Łódź',
                'contact_info': 'SMS: 987-654-321',
                'user': users[2]
            },
            {
                'title': 'Kupię notatki z Programowania Obiektowego',
                'content': 'Poszukuję kompletnych notatek z wykładów i laboratoriów z Programowania Obiektowego (Java). Najchętniej w formie elektronicznej (PDF).',
                'category': 'buy',
                'price': 50.00,
                'location': 'Kampus PŁ',
                'contact_info': 'Messenger: Katarzyna Wójcik',
                'user': users[3]
            },
            {
                'title': 'Znaleziono klucze przy bibliotece B22',
                'content': 'Wczoraj (wtorek) około godz. 15:00 znaleziono pęk kluczy przy wejściu do biblioteki głównej B22. Klucze z brelokiem w kształcie kostki Rubika. Do odebrania w portierni biblioteki.',
                'category': 'lost_found',
                'price': 0.00,
                'location': 'Biblioteka B22 - portiernia',
                'contact_info': 'Portiernia B22',
                'user': users[4]
            }
        ]
        
        for ad_data in ads_data:
            ad = Advertisement.objects.create(
                author=ad_data['user'],
                title=ad_data['title'],
                content=ad_data['content'],
                category=ad_data['category'],
                price=ad_data['price'],
                location=ad_data['location'],
                contact_info=ad_data['contact_info'],
                expires_at=timezone.now() + timedelta(days=30)
            )
            self.stdout.write(f'Utworzono ogłoszenie: {ad.title}')

    def create_news(self, users):
        """Create 5 news items (2 of type event)"""
        # Get or create news categories
        categories = {
            'university': NewsCategory.objects.get_or_create(
                slug='university-wide',
                defaults={'name': 'Ogólnouczelniane', 'category_type': 'university', 'order': 1}
            )[0],
            'ftims': NewsCategory.objects.get_or_create(
                slug='ftims',
                defaults={'name': 'FTIMS', 'category_type': 'faculty', 'order': 2}
            )[0],
            'announcement': NewsCategory.objects.get_or_create(
                slug='announcement',
                defaults={'name': 'Komunikat', 'category_type': 'announcement', 'order': 3}
            )[0],
            'event': NewsCategory.objects.get_or_create(
                slug='event',
                defaults={'name': 'Wydarzenie', 'category_type': 'event', 'order': 4}
            )[0]
        }
        
        news_data = [
            {
                'title': 'Konferencja Naukowa "Innowacje w Informatyce 2024"',
                'content': 'Z przyjemnością informujemy o organizacji międzynarodowej konferencji naukowej "Innowacje w Informatyce 2024", która odbędzie się w dniach 15-17 maja na Wydziale FTIMS. Konferencja będzie poświęcona najnowszym trendom w dziedzinie sztucznej inteligencji, cyberbezpieczeństwa oraz Big Data.\n\nW programie przewidziano wykłady plenarne wybitnych naukowców z całego świata, sesje tematyczne oraz warsztaty praktyczne. Studenci mogą uczestniczyć bezpłatnie po wcześniejszej rejestracji.',
                'categories': [categories['ftims'], categories['event']],
                'is_event': True,
                'event_date': timezone.now() + timedelta(days=45),
                'event_end_date': timezone.now() + timedelta(days=47),
                'event_location': 'Wydział FTIMS, Budynek B9',
                'event_room': 'Aula F2',
                'event_teacher': 'prof. dr hab. inż. Jan Kowalski',
                'event_description': 'Międzynarodowa konferencja naukowa z udziałem ekspertów z branży IT',
                'user': users[0]
            },
            {
                'title': 'Nowy program stypendialny dla najlepszych studentów',
                'content': 'Politechnika Łódzka ogłasza nabór do nowego programu stypendialnego "Lider Przyszłości". Program skierowany jest do studentów II i III roku studiów pierwszego stopnia, którzy wykazują się wybitnymi osiągnięciami naukowymi oraz aktywnością w kołach naukowych.\n\nStypendium w wysokości 1500 zł miesięcznie będzie przyznawane na okres 10 miesięcy. Dodatkowo laureaci otrzymają możliwość odbycia płatnych staży w wiodących firmach technologicznych.\n\nTermin składania wniosków: do 30 kwietnia 2024.',
                'categories': [categories['university'], categories['announcement']],
                'is_event': False,
                'user': users[1]
            },
            {
                'title': 'Hackathon PŁ 2024 - zapisz się już dziś!',
                'content': 'Samorząd Studencki wraz z Kołem Naukowym Informatyków organizuje największy hackathon w historii Politechniki Łódzkiej! Wydarzenie odbędzie się w weekend 20-21 kwietnia w budynku B9.\n\nDo wygrania nagrody o łącznej wartości 50 000 zł oraz możliwość odbycia staży w firmach partnerskich. Tematyka hackathonu: "Smart City - rozwiązania dla miasta przyszłości".\n\nZapisy prowadzone są przez stronę wydarzenia. Liczba miejsc ograniczona!',
                'categories': [categories['ftims'], categories['event']],
                'is_event': True,
                'event_date': timezone.now() + timedelta(days=30),
                'event_end_date': timezone.now() + timedelta(days=31),
                'event_location': 'Budynek B9, Wydział FTIMS',
                'event_room': 'Sale laboratoryjne 301-305',
                'event_teacher': 'mgr inż. Marek Kamiński',
                'event_description': '24-godzinny maraton programowania z nagrodami',
                'user': users[4]
            },
            {
                'title': 'Zmiany w organizacji sesji letniej 2024',
                'content': 'Informujemy, że w związku z planowanym remontem budynku B14, część egzaminów sesji letniej zostanie przeniesiona do innych lokalizacji. Dokładny harmonogram egzaminów zostanie opublikowany do 15 maja.\n\nProsimy studentów o regularne sprawdzanie systemu USOS oraz stron wydziałowych. W przypadku kolizji terminów egzaminów należy niezwłocznie kontaktować się z dziekanatem.',
                'categories': [categories['university'], categories['announcement']],
                'is_event': False,
                'user': users[1]
            },
            {
                'title': 'Sukcesy studentów PŁ w międzynarodowych zawodach robotycznych',
                'content': 'Z dumą informujemy, że drużyna SKN Robotyków Politechniki Łódzkiej zajęła 2. miejsce w prestiżowych zawodach RoboCup Europe 2024! Nasi studenci zaprezentowali innowacyjnego robota do zadań ratowniczych, który zdobył uznanie jury.\n\nTo już kolejny sukces naszych studentów na arenie międzynarodowej. Gratulujemy zespołowi i życzymy dalszych sukcesów! Wywiad z członkami drużyny zostanie opublikowany w najbliższym numerze czasopisma uczelnianego.',
                'categories': [categories['university'], categories['ftims']],
                'is_event': False,
                'user': users[0]
            }
        ]
        
        for news_item_data in news_data:
            news_item = NewsItem.objects.create(
                title=news_item_data['title'],
                content=news_item_data['content'],
                author=news_item_data['user'],
                event_date=news_item_data.get('event_date'),
                event_location=news_item_data.get('event_location'),
                event_end_date=news_item_data.get('event_end_date'),
                event_description=news_item_data.get('event_description'),
                event_room=news_item_data.get('event_room'),
                event_teacher=news_item_data.get('event_teacher')
            )
            news_item.categories.set(news_item_data['categories'])
            self.stdout.write(f'Utworzono aktualność: {news_item.title}')