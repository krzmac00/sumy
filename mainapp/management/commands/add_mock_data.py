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
        """
        Create threads, posts and votes in a data-driven way.

        • Threads + comments are defined once in `threads_spec`
        and then instantiated in a loop.
        • Each thread's creation time is moved randomly back
        0-6 days and 0-1 440 minutes.
        """
        # ----------  THREAD / COMMENT SPECIFICATION ----------
        threads_spec = [
            {
                "title": "Jak przygotować się do egzaminu z Systemów Operacyjnych?",
                "content": (
                    "Mam trudności ze zrozumieniem zagadnień związanych z zakleszczeniami "
                    "(deadlocks) i zarządzaniem pamięcią. Czy ktoś może polecić dobre materiały "
                    "do nauki lub podzielić się swoim doświadczeniem z tego egzaminu?"
                ),
                "category": "exams",
                "user_idx": 0,
                "visible_for_teachers": False,
                "is_anonymous": False,
                "posts": [
                    {
                        "nickname": "Student Helper",
                        "content": "Przejrzyj podsumowania rozdziałów w podręczniku.",
                        "user_idx": 3,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 1,
                        "content": "Znalazłem pomocne samouczki na YouTube.",
                        "is_anonymous": False,
                    },
                    {
                        "user_idx": 2,
                        "content": "Dyżury profesora były bardzo pomocne.",
                        "is_anonymous": False,
                    },
                ],
            },
            {
                "title": "Ktoś chętny do założenia grupy naukowej z Algorytmów?",
                "content": (
                    "Szukam studentów, którzy chcieliby wspólnie przygotowywać się do "
                    "nadchodzącego kursu z algorytmów. Możemy spotykać się dwa razy w tygodniu "
                    "w bibliotece lub online."
                ),
                "category": "courses",
                "user_idx": 1,
                "visible_for_teachers": False,
                "is_anonymous": True,
                "posts": [
                    {
                        "user_idx": 3,
                        "content": "Jestem zainteresowany! Jakie dni masz na myśli?",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Entuzjasta",
                        "content": "Zgłaszam się!",
                        "user_idx": 4,
                        "is_anonymous": True,
                    },
                ],
            },
            {
                "title": "Pytanie o rejestrację na kursy w przyszłym semestrze",
                "content": (
                    "Próbuję zapisać się na kurs Zaawansowane Systemy Baz Danych, ale pojawia "
                    "się błąd dotyczący wymagań wstępnych, mimo że ukończyłem wymagane kursy. "
                    "Czy ktoś miał podobny problem?"
                ),
                "category": "other",
                "user_idx": 1,
                "visible_for_teachers": True,
                "is_anonymous": False,
                "posts": [
                    {
                        "user_idx": 2,
                        "content": "Miałem ten sam problem. Trzeba skontaktować się z biurem administracji.",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Helpful Student",
                        "content": "Spróbuj napisać maila do profesora z prośbą o zgodę.",
                        "user_idx": 3,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 4,
                        "content": (
                            "System czasami ma opóźnienia w aktualizacji informacji o spełnieniu wymagań."
                        ),
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Admin Helper",
                        "content": "Mi się udało to załatwić osobiście u rejestratora.",
                        "user_idx": 0,
                        "is_anonymous": True,
                    },
                ],
            },
            {
                "title": "Najlepsze kawiarnie w pobliżu kampusu do nauki?",
                "content": (
                    "Szukam miejsc z dobrym Wi-Fi, gniazdkami i niezbyt hałaśliwych. "
                    "Dodatkowy plus za dobrą kawę! Podzielcie się swoimi ulubionymi "
                    "miejscami do efektywnej nauki."
                ),
                "category": "general",
                "user_idx": 3,
                "visible_for_teachers": False,
                "is_anonymous": True,
                "posts": [
                    {
                        "nickname": "Cafe Expert",
                        "content": "Brew & Books na 5. ulicy to moje ulubione miejsce.",
                        "user_idx": 0,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 1,
                        "content": (
                            "Kawiarnia w bibliotece jest niedoceniana i niezatłoczona w weekendy."
                        ),
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Budget Student",
                        "content": "Wolę The Daily Grind - mają zniżki dla studentów.",
                        "user_idx": 2,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 4,
                        "content": "Bean There Done That ma najlepszą atmosferę do długiej nauki.",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Quiet Seeker",
                        "content": (
                            "Jeśli szukasz ciszy, spróbuj Morning Beans naprzeciwko budynku nauk ścisłych."
                        ),
                        "user_idx": 3,
                        "is_anonymous": True,
                    },
                ],
            },
            {
                "title": "Ważne ogłoszenie dotyczące terminu oddania projektu końcowego",
                "content": (
                    "Drodzy studenci, termin oddania projektu końcowego został przedłużony o tydzień. "
                    "Nowa data to 15 grudnia. Wszystkie wymagania pozostają bez zmian."
                ),
                "category": "events",
                "user_idx": 5,
                "visible_for_teachers": True,
                "is_anonymous": False,
                "posts": [
                    {
                        "user_idx": 0,
                        "content": "Dziękujemy za przedłużenie terminu!",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Concerned Student",
                        "content": "Czy to wpłynie na harmonogram oceniania?",
                        "user_idx": 2,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 3,
                        "content": "Czy dotyczy to wszystkich grup kursu?",
                        "is_anonymous": False,
                    },
                ],
            },
            {
                "title": "Czy ktoś ma notatki z zeszłotygodniowego wykładu z Uczenia Maszynowego?",
                "content": (
                    "Przegapiłem wykład o sieciach neuronowych z powodu choroby. Czy ktoś mógłby się "
                    "podzielić notatkami? Byłbym bardzo wdzięczny!"
                ),
                "category": "materials",
                "user_idx": 2,
                "visible_for_teachers": False,
                "is_anonymous": False,
                "posts": [
                    {
                        "user_idx": 1,
                        "content": "Wyślę Ci notatki na priv!",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Helpful Classmate",
                        "content": "Wykład był nagrywany – sprawdź stronę kursu.",
                        "user_idx": 4,
                        "is_anonymous": True,
                    },
                ],
            },
            {
                "title": "Oferty praktyk letnich w dziale rozwoju oprogramowania",
                "content": (
                    "Moja firma poszukuje praktykantów na lato w dziedzinie rozwoju oprogramowania. "
                    "Świetna okazja do zdobycia praktycznego doświadczenia z nowoczesnymi technologiami "
                    "webowymi. Termin aplikacji to 31 marca."
                ),
                "category": "other",
                "user_idx": 8,  # Industry representative
                "visible_for_teachers": False,
                "is_anonymous": False,
                "posts": [
                    {
                        "user_idx": 0,
                        "content": "Jakie konkretnie umiejętności są wymagane?",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "International Student",
                        "content": "Czy oferta jest otwarta dla studentów zagranicznych?",
                        "user_idx": 1,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 2,
                        "content": "Jak wygląda proces rekrutacji?",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Remote Worker",
                        "content": "Czy oferujecie zdalne praktyki?",
                        "user_idx": 3,
                        "is_anonymous": True,
                    },
                    {
                        "user_idx": 4,
                        "content": "Jak wygląda wynagrodzenie?",
                        "is_anonymous": False,
                    },
                    {
                        "nickname": "Former Intern",
                        "content": "Odbyłem tam praktyki w zeszłym roku – było super!",
                        "user_idx": 0,
                        "is_anonymous": True,
                    },
                ],
            },
        ]
        # ----------  CREATE THREADS & POSTS ----------
        for spec in threads_spec:
            author = users[spec["user_idx"]]
            nickname = spec.get(
                "nickname",
                f"{author.first_name} {author.last_name}"
            )
            thread_id = create_thread(
                title=spec["title"],
                content=spec["content"],
                category=spec["category"],
                nickname=nickname,
                visible_for_teachers=spec["visible_for_teachers"],
                can_be_answered=True,
                user=author,
                is_anonymous=spec["is_anonymous"],
            )

            # Randomise creation time 0-6 days & 0-1 440 minutes ago
            random_days = random.randint(0, 6)
            random_minutes = random.randint(0, 1440)
            thread = Thread.objects.get(id=thread_id)
            thread.created_date = timezone.now() - timedelta(
                days=random_days, minutes=random_minutes
            )
            thread.save(update_fields=["created_date"])

            # Create comments
            for post_spec in spec["posts"]:
                # If nickname missing, build from commenter
                commenter = users[post_spec["user_idx"]]
                p_nick = post_spec.get(
                    "nickname",
                    f"{commenter.first_name} {commenter.last_name}"
                )
                create_post(
                    nickname=p_nick,
                    content=post_spec["content"],
                    thread_id=thread_id,
                    user=commenter,
                    is_anonymous=post_spec["is_anonymous"],
                )

        # ----------  ADDITIONAL RANDOM THREADS ----------
        additional_threads = [
            {
                "title": "Czy warto zapisać się na kurs Internet of Things na PŁ?",
                "content": (
                    "Zastanawiam się nad wyborem kursu IoT. Czy ktoś już uczestniczył i może "
                    "podzielić się opinią?"
                ),
                "category": "courses",
            },
            {
                "title": "Najlepsze miejsca do nauki na terenie kampusu",
                "content": (
                    "Chciałbym się dowiedzieć, gdzie na PŁ najlepiej się uczyć – biblioteka, "
                    "strefa studenta, czy może coś mniej oczywistego?"
                ),
                "category": "general",
            },
            {
                "title": "Jak efektywnie przygotować się do sesji?",
                "content": (
                    "Czuję, że sesja mnie przytłacza. Jakie macie sposoby na organizację nauki?"
                ),
                "category": "exams",
            },
            {
                "title": "Problemy z zalogowaniem do WIKAMP",
                "content": (
                    "Od wczoraj nie mogę zalogować się do WIKAMP. Czy ktoś jeszcze ma taki problem?"
                ),
                "category": "other",
            },
            {
                "title": "Czy ktoś miał praktyki przez Biuro Karier PŁ?",
                "content": (
                    "Rozważam zgłoszenie się na praktyki z ramienia uczelni. Jak wygląda proces i czy warto?"
                ),
                "category": "other",
            },
        ]

        for idx, data in enumerate(additional_threads):
            author = users[idx % len(users)]
            thread_id = create_thread(
                title=data["title"],
                content=data["content"],
                category=data["category"],
                nickname=f"{author.first_name} {author.last_name}",
                visible_for_teachers=False,
                can_be_answered=True,
                user=author,
                is_anonymous=random.choice([True, False]),
            )

            # Randomise creation time (same rule as above)
            random_days = random.randint(0, 6)
            random_minutes = random.randint(0, 1440)
            thread = Thread.objects.get(id=thread_id)
            thread.created_date = timezone.now() - timedelta(
                days=random_days, minutes=random_minutes
            )
            thread.save(update_fields=["created_date"])

            # Three random commenters per additional thread
            commenters = random.sample(users, 3)
            for i, commenter in enumerate(commenters, start=1):
                create_post(
                    nickname=(
                        f"{commenter.first_name} {commenter.last_name}"
                        if random.random() > 0.5
                        else f"Anonim{i}"
                    ),
                    content=(
                        f"Moim zdaniem {data['title'].lower()} to świetny temat do dyskusji."
                    ),
                    thread_id=thread_id,
                    user=commenter,
                    is_anonymous=random.choice([True, False]),
                )

        # ----------  VOTES ----------
        self.simulate_votes(users)
        self.stdout.write(self.style.SUCCESS("All threads, posts and votes created!"))


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