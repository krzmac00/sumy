from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
from mainapp.post import create_thread, create_post, vote_on_thread, vote_on_post, Thread, Post

User = get_user_model()

class Command(BaseCommand):
    help = 'Adds mock data to the database including users, threads, and posts'

    def handle(self, *args, **kwargs):
        self.stdout.write("Creating mock data...")
        
        # Create users
        users = self.create_users()
        
        # Create threads and posts
        self.create_threads_and_posts(users)
        
        self.stdout.write(self.style.SUCCESS("Mock data created successfully!"))

    def create_users(self):
        """Create 5 student users and 3 lecturer users"""
        users = []
        
        # Student users
        student_data = [
            {"email": "230123@edu.p.lodz.pl", "first_name": "John", "last_name": "Smith", "login": "230123"},
            {"email": "230124@edu.p.lodz.pl", "first_name": "Maria", "last_name": "Garcia", "login": "230124"},
            {"email": "230125@edu.p.lodz.pl", "first_name": "Alex", "last_name": "Kim", "login": "230125"},
            {"email": "230126@edu.p.lodz.pl", "first_name": "Anna", "last_name": "Nowak", "login": "230126"},
            {"email": "230127@edu.p.lodz.pl", "first_name": "Piotr", "last_name": "Kowalski", "login": "230127"},
        ]
        
        for data in student_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "login": data["login"],
                    "role": "student",
                    "is_active": True,
                }
            )
            if created:
                user.set_password("NewPassword.00")
                user.save()
                self.stdout.write(f"Created student: {user.email}")
            users.append(user)
        
        # Lecturer users
        lecturer_data = [
            {"email": "prof.johnson@p.lodz.pl", "first_name": "Professor", "last_name": "Johnson", "login": "prof.johnson"},
            {"email": "dr.kowalczyk@p.lodz.pl", "first_name": "Dr", "last_name": "Kowalczyk", "login": "dr.kowalczyk"},
            {"email": "mgr.wisniewski@p.lodz.pl", "first_name": "Mgr", "last_name": "Wiśniewski", "login": "mgr.wisniewski"},
        ]
        
        for data in lecturer_data:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "login": data["login"],
                    "role": "lecturer",
                    "is_active": True,
                }
            )
            if created:
                user.set_password("NewPassword.00")
                user.save()
                self.stdout.write(f"Created lecturer: {user.email}")
            users.append(user)
        
        # Create one industry representative
        industry_user, created = User.objects.get_or_create(
            email="industry.rep@company.com",
            defaults={
                "first_name": "Industry",
                "last_name": "Representative",
                "login": "industry.rep",
                "role": "student",  # Using student role for simplicity
                "is_active": True,
            }
        )
        if created:
            industry_user.set_password("NewPassword.00")
            industry_user.save()
            self.stdout.write(f"Created industry representative: {industry_user.email}")
        users.append(industry_user)
        
        return users

    def create_threads_and_posts(self, users):
        """Create threads and posts with various categories and options"""
        
        # Thread 1: Jak przygotować się do egzaminu z Systemów Operacyjnych?
        thread1_id = create_thread(
            title="Jak przygotować się do egzaminu z Systemów Operacyjnych?",
            content="Mam trudności ze zrozumieniem zagadnień związanych z zakleszczeniami (deadlocks) i zarządzaniem pamięcią. Czy ktoś może polecić dobre materiały do nauki lub podzielić się swoim doświadczeniem z tego egzaminu?",
            category="exams",
            nickname=f"{users[0].first_name} {users[0].last_name}",
            visible_for_teachers=False,
            can_be_answered=True,
            user=users[0],
            is_anonymous=False
        )
        
        # Update thread creation time
        thread1 = Thread.objects.get(id=thread1_id)
        thread1.created_date = timezone.now() - timedelta(minutes=30)
        thread1.save()
        
        # Add comments to thread 1
        post1_1 = create_post(
            nickname="Student Helper",
            content="Przejrzyj podsumowania rozdziałów w podręczniku.",
            thread_id=thread1_id,
            user=users[3],
            is_anonymous=True
        )
        
        post1_2 = create_post(
            nickname=f"{users[1].first_name} {users[1].last_name}",
            content="Znalazłem pomocne samouczki na YouTube.",
            thread_id=thread1_id,
            user=users[1],
            is_anonymous=False
        )
        
        post1_3 = create_post(
            nickname=f"{users[2].first_name} {users[2].last_name}",
            content="Dyżury profesora były bardzo pomocne.",
            thread_id=thread1_id,
            user=users[2],
            is_anonymous=False
        )
        
        # Thread 2: Ktoś chętny do założenia grupy naukowej z Algorytmów?
        thread2_id = create_thread(
            title="Ktoś chętny do założenia grupy naukowej z Algorytmów?",
            content="Szukam studentów, którzy chcieliby wspólnie przygotowywać się do nadchodzącego kursu z algorytmów. Możemy spotykać się dwa razy w tygodniu w bibliotece lub online.",
            category="courses",
            nickname="AlgoLover",
            visible_for_teachers=False,
            can_be_answered=True,
            user=users[1],
            is_anonymous=True
        )
        
        thread2 = Thread.objects.get(id=thread2_id)
        thread2.created_date = timezone.now() - timedelta(hours=5)
        thread2.save()
        
        # Add comments to thread 2
        create_post(
            nickname=f"{users[3].first_name} {users[3].last_name}",
            content="Jestem zainteresowany! Jakie dni masz na myśli?",
            thread_id=thread2_id,
            user=users[3],
            is_anonymous=False
        )
        
        create_post(
            nickname="Entuzjasta",
            content="Zgłaszam się!",
            thread_id=thread2_id,
            user=users[4],
            is_anonymous=True
        )
        
        # Thread 3: Pytanie o rejestrację na kursy w przyszłym semestrze
        thread3_id = create_thread(
            title="Pytanie o rejestrację na kursy w przyszłym semestrze",
            content="Próbuję zapisać się na kurs Zaawansowane Systemy Baz Danych, ale pojawia się błąd dotyczący wymagań wstępnych, mimo że ukończyłem wymagane kursy. Czy ktoś miał podobny problem?",
            category="other",
            nickname=f"{users[1].first_name} {users[1].last_name}",
            visible_for_teachers=True,
            can_be_answered=True,
            user=users[1],
            is_anonymous=False
        )
        
        thread3 = Thread.objects.get(id=thread3_id)
        thread3.created_date = timezone.now() - timedelta(days=2)
        thread3.save()
        
        # Add comments to thread 3
        create_post(
            nickname=f"{users[2].first_name} {users[2].last_name}",
            content="Miałem ten sam problem. Trzeba skontaktować się z biurem administracji.",
            thread_id=thread3_id,
            user=users[2],
            is_anonymous=False
        )
        
        create_post(
            nickname="Helpful Student",
            content="Spróbuj napisać maila do profesora z prośbą o zgodę.",
            thread_id=thread3_id,
            user=users[3],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[4].first_name} {users[4].last_name}",
            content="System czasami ma opóźnienia w aktualizacji informacji o spełnieniu wymagań.",
            thread_id=thread3_id,
            user=users[4],
            is_anonymous=False
        )
        
        create_post(
            nickname="Admin Helper",
            content="Mi się udało to załatwić osobiście u rejestratora.",
            thread_id=thread3_id,
            user=users[0],
            is_anonymous=True
        )
        
        # Thread 4: Najlepsze kawiarnie w pobliżu kampusu do nauki?
        thread4_id = create_thread(
            title="Najlepsze kawiarnie w pobliżu kampusu do nauki?",
            content="Szukam miejsc z dobrym Wi-Fi, gniazdkami i niezbyt hałaśliwych. Dodatkowy plus za dobrą kawę! Podzielcie się swoimi ulubionymi miejscami do efektywnej nauki.",
            category="general",
            nickname="CoffeeLover",
            visible_for_teachers=False,
            can_be_answered=True,
            user=users[3],
            is_anonymous=True
        )
        
        thread4 = Thread.objects.get(id=thread4_id)
        thread4.created_date = timezone.now() - timedelta(days=6)
        thread4.save()
        
        # Add comments to thread 4
        create_post(
            nickname="Cafe Expert",
            content="Brew & Books na 5. ulicy to moje ulubione miejsce.",
            thread_id=thread4_id,
            user=users[0],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[1].first_name} {users[1].last_name}",
            content="Kawiarnia w bibliotece jest niedoceniana i niezatłoczona w weekendy.",
            thread_id=thread4_id,
            user=users[1],
            is_anonymous=False
        )
        
        create_post(
            nickname="Budget Student",
            content="Wolę The Daily Grind – mają zniżki dla studentów.",
            thread_id=thread4_id,
            user=users[2],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[4].first_name} {users[4].last_name}",
            content="Bean There Done That ma najlepszą atmosferę do długiej nauki.",
            thread_id=thread4_id,
            user=users[4],
            is_anonymous=False
        )
        
        create_post(
            nickname="Quiet Seeker",
            content="Jeśli szukasz ciszy, spróbuj Morning Beans naprzeciwko budynku nauk ścisłych.",
            thread_id=thread4_id,
            user=users[3],
            is_anonymous=True
        )
        
        # Thread 5: Ważne ogłoszenie dotyczące terminu oddania projektu końcowego
        thread5_id = create_thread(
            title="Ważne ogłoszenie dotyczące terminu oddania projektu końcowego",
            content="Drodzy studenci, termin oddania projektu końcowego został przedłużony o tydzień. Nowa data to 15 grudnia. Wszystkie wymagania pozostają bez zmian.",
            category="events",
            nickname=f"{users[5].first_name} {users[5].last_name}",
            visible_for_teachers=True,
            can_be_answered=True,
            user=users[5],  # Professor Johnson
            is_anonymous=False
        )
        
        thread5 = Thread.objects.get(id=thread5_id)
        thread5.created_date = timezone.now() - timedelta(weeks=2)
        thread5.save()
        
        # Add comments to thread 5
        create_post(
            nickname=f"{users[0].first_name} {users[0].last_name}",
            content="Dziękujemy za przedłużenie terminu!",
            thread_id=thread5_id,
            user=users[0],
            is_anonymous=False
        )
        
        create_post(
            nickname="Concerned Student",
            content="Czy to wpłynie na harmonogram oceniania?",
            thread_id=thread5_id,
            user=users[2],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[3].first_name} {users[3].last_name}",
            content="Czy dotyczy to wszystkich grup kursu?",
            thread_id=thread5_id,
            user=users[3],
            is_anonymous=False
        )
        
        # Thread 6: Czy ktoś ma notatki z zeszłotygodniowego wykładu z Uczenia Maszynowego?
        thread6_id = create_thread(
            title="Czy ktoś ma notatki z zeszłotygodniowego wykładu z Uczenia Maszynowego?",
            content="Przegapiłem wykład o sieciach neuronowych z powodu choroby. Czy ktoś mógłby się podzielić notatkami? Byłbym bardzo wdzięczny!",
            category="materials",
            nickname=f"{users[2].first_name} {users[2].last_name}",
            visible_for_teachers=False,
            can_be_answered=True,
            user=users[2],
            is_anonymous=False
        )
        
        thread6 = Thread.objects.get(id=thread6_id)
        thread6.created_date = timezone.now() - timedelta(days=60)
        thread6.save()
        
        # Add comments to thread 6
        create_post(
            nickname=f"{users[1].first_name} {users[1].last_name}",
            content="Wyślę Ci notatki na priv!",
            thread_id=thread6_id,
            user=users[1],
            is_anonymous=False
        )
        
        create_post(
            nickname="Helpful Classmate",
            content="Wykład był nagrywany – sprawdź stronę kursu.",
            thread_id=thread6_id,
            user=users[4],
            is_anonymous=True
        )
        
        # Thread 7: Oferty praktyk letnich w dziale rozwoju oprogramowania
        thread7_id = create_thread(
            title="Oferty praktyk letnich w dziale rozwoju oprogramowania",
            content="Moja firma poszukuje praktykantów na lato w dziedzinie rozwoju oprogramowania. Świetna okazja do zdobycia praktycznego doświadczenia z nowoczesnymi technologiami webowymi. Termin aplikacji to 31 marca.",
            category="other",
            nickname=f"{users[8].first_name} {users[8].last_name}",
            visible_for_teachers=False,
            can_be_answered=True,
            user=users[8],  # Industry representative
            is_anonymous=False
        )
        
        thread7 = Thread.objects.get(id=thread7_id)
        thread7.created_date = timezone.now() - timedelta(days=10)
        thread7.save()
        
        # Add comments to thread 7
        create_post(
            nickname=f"{users[0].first_name} {users[0].last_name}",
            content="Jakie konkretnie umiejętności są wymagane?",
            thread_id=thread7_id,
            user=users[0],
            is_anonymous=False
        )
        
        create_post(
            nickname="International Student",
            content="Czy oferta jest otwarta dla studentów zagranicznych?",
            thread_id=thread7_id,
            user=users[1],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[2].first_name} {users[2].last_name}",
            content="Jak wygląda proces rekrutacji?",
            thread_id=thread7_id,
            user=users[2],
            is_anonymous=False
        )
        
        create_post(
            nickname="Remote Worker",
            content="Czy oferujecie zdalne praktyki?",
            thread_id=thread7_id,
            user=users[3],
            is_anonymous=True
        )
        
        create_post(
            nickname=f"{users[4].first_name} {users[4].last_name}",
            content="Jak wygląda wynagrodzenie?",
            thread_id=thread7_id,
            user=users[4],
            is_anonymous=False
        )
        
        create_post(
            nickname="Former Intern",
            content="Odbyłem tam praktyki w zeszłym roku – było super!",
            thread_id=thread7_id,
            user=users[0],
            is_anonymous=True
        )
        
        # Add votes to simulate activity
        self.simulate_votes(users)
        
        self.stdout.write(self.style.SUCCESS("All threads and posts created successfully!"))

    def simulate_votes(self, users):
        """Simulate voting activity on threads and posts"""
        threads = Thread.objects.all()
        posts = Post.objects.all()
        
        # Add some votes to threads
        for thread in threads:
            # Random number of users vote on each thread
            voters = random.sample(users[:-1], random.randint(1, min(5, len(users)-1)))  # Exclude industry rep
            for voter in voters:
                if voter != thread.author:  # Users can't vote on their own threads
                    vote_type = 'upvote' if random.random() > 0.2 else 'downvote'
                    try:
                        vote_on_thread(voter, thread.id, vote_type)
                    except Exception:
                        pass  # Ignore if vote already exists
        
        # Add some votes to posts
        for post in posts[:10]:  # Vote on first 10 posts
            voters = random.sample(users[:-1], random.randint(0, 3))
            for voter in voters:
                if voter != post.user:  # Users can't vote on their own posts
                    vote_type = 'upvote' if random.random() > 0.15 else 'downvote'
                    try:
                        vote_on_post(voter, post.id, vote_type)
                    except Exception:
                        pass  # Ignore if vote already exists
        
        self.stdout.write(self.style.SUCCESS("Votes simulated successfully!"))