import os
import django

# Configure Django settings before imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sumy.settings')
django.setup()

import factory
from factory.django import DjangoModelFactory
from factory import Faker, SubFactory, LazyFunction, LazyAttribute, post_generation
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from mainapp.models import Thread, Post, Event, Vote
from noticeboard.models import Advertisement, Comment
from news.models import NewsCategory, NewsItem
from map.models import BuildingType, Building, Floor, Room

User = get_user_model()


class UserFactory(DjangoModelFactory):
    """Factory for User model"""
    class Meta:
        model = User
        django_get_or_create = ('email',)
        skip_postgeneration_save = True
    
    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override to use UserManager.create_user method"""
        password = kwargs.pop('password', 'defaultpassword')
        # Remove login field to let UserManager set it
        kwargs.pop('login', None)
        # Don't pass role if not explicitly set
        if 'role' not in kwargs or kwargs.get('role') == 'student':
            kwargs.pop('role', None)
        return User.objects.create_user(password=password, **kwargs)
    
    email = factory.Sequence(lambda n: f'{100000+n}@edu.p.lodz.pl')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    is_active = True
    is_staff = False
    is_superuser = False
    # Don't set role here - let UserManager determine it based on email
    
    @factory.lazy_attribute
    def login(self):
        return self.email.split('@')[0]
    
    @post_generation
    def groups(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for group in extracted:
                self.groups.add(group)


class LecturerFactory(UserFactory):
    """Factory for Lecturer users"""
    email = factory.Sequence(lambda n: f'jan.kowalski{n}@p.lodz.pl')
    is_staff = True
    role = 'lecturer'
    
    @factory.lazy_attribute
    def login(self):
        return self.email.split('@')[0]


class ThreadFactory(DjangoModelFactory):
    """Factory for Thread model"""
    class Meta:
        model = Thread
        skip_postgeneration_save = True
    
    title = Faker('sentence', nb_words=6)
    content = Faker('text', max_nb_chars=500)
    author = SubFactory(UserFactory)
    is_anonymous = factory.LazyFunction(lambda: random.choice([True, False]))
    category = 'academic'  # Set a default category
    
    @factory.lazy_attribute
    def nickname(self):
        if self.is_anonymous:
            adjectives = ['Happy', 'Clever', 'Brave', 'Curious', 'Wise']
            nouns = ['Student', 'Scholar', 'Learner', 'Thinker', 'Explorer']
            return f"{random.choice(adjectives)} {random.choice(nouns)}"
        return "Anonymous User"  # Default nickname when not anonymous
    
    @post_generation
    def tags(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for tag in extracted:
                self.tags.add(tag)


class PostFactory(DjangoModelFactory):
    """Factory for Post model"""
    class Meta:
        model = Post
    
    thread = SubFactory(ThreadFactory)
    content = Faker('text', max_nb_chars=300)
    user = SubFactory(UserFactory)
    is_anonymous = factory.LazyFunction(lambda: random.choice([True, False]))
    
    @factory.lazy_attribute
    def nickname(self):
        if self.is_anonymous:
            return f"Anonymous{random.randint(1, 999)}"
        return "Anonymous User"  # Default nickname


class EventFactory(DjangoModelFactory):
    """Factory for Event model"""
    class Meta:
        model = Event
    
    title = Faker('catch_phrase')
    description = Faker('text', max_nb_chars=200)
    user = SubFactory(UserFactory)
    
    @factory.lazy_attribute
    def start_date(self):
        return timezone.now() + timedelta(days=random.randint(1, 30))
    
    @factory.lazy_attribute
    def end_date(self):
        return self.start_date + timedelta(hours=random.randint(1, 3))
    
    @factory.lazy_attribute
    def category(self):
        categories = ['important', 'private', 'exam', 'club', 'student_council', 'tul_events']
        return random.choice(categories)
    


class VoteFactory(DjangoModelFactory):
    """Factory for Vote model"""
    class Meta:
        model = Vote
        django_get_or_create = ('user', 'thread')
    
    user = SubFactory(UserFactory)
    thread = SubFactory(ThreadFactory)
    vote_type = factory.LazyFunction(lambda: random.choice(['upvote', 'downvote']))
    created_date = factory.LazyFunction(timezone.now)


class AdvertisementFactory(DjangoModelFactory):
    """Factory for Advertisement model"""
    class Meta:
        model = Advertisement
    
    title = Faker('catch_phrase')
    content = Faker('text', max_nb_chars=200)
    contact_info = Faker('email')
    author = SubFactory(UserFactory)
    created_date = factory.LazyFunction(timezone.now)
    location = Faker('city')
    
    @factory.lazy_attribute
    def price(self):
        return random.randint(10, 1000)
    
    @factory.lazy_attribute
    def category(self):
        categories = ['announcement', 'sale', 'buy', 'service', 'event', 'lost_found', 'other']
        return random.choice(categories)
    
    is_active = True  # Default to active


class CommentFactory(DjangoModelFactory):
    """Factory for Comment model in noticeboard"""
    class Meta:
        model = Comment
    
    advertisement = SubFactory(AdvertisementFactory)
    author = SubFactory(UserFactory)
    content = Faker('text', max_nb_chars=200)
    created_date = factory.LazyFunction(timezone.now)
    is_public = factory.LazyFunction(lambda: random.choice([True, False]))
    was_edited = False


class NewsCategoryFactory(DjangoModelFactory):
    """Factory for NewsCategory model"""
    class Meta:
        model = NewsCategory
        django_get_or_create = ('slug',)
    
    name = Faker('word')
    slug = factory.LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
    parent = None
    order = factory.Sequence(lambda n: n)
    
    @factory.lazy_attribute
    def category_type(self):
        return random.choice(['university', 'faculty', 'announcement', 'event'])


class NewsItemFactory(DjangoModelFactory):
    """Factory for NewsItem model"""
    class Meta:
        model = NewsItem
        skip_postgeneration_save = True
    
    title = Faker('sentence', nb_words=6)
    content = Faker('text', max_nb_chars=1000)
    author = SubFactory(LecturerFactory)
    created_at = factory.LazyFunction(timezone.now)
    is_published = True
    
    @factory.lazy_attribute
    def event_date(self):
        if random.choice([True, False]):
            return timezone.now() + timedelta(days=random.randint(1, 30))
        return None
    
    @factory.lazy_attribute
    def event_location(self):
        if self.event_date:
            return f"Room {random.randint(100, 500)}"
        return None
    
    @post_generation
    def categories(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for category in extracted:
                self.categories.add(category)
        else:
            # Add 1-3 random categories
            num_categories = random.randint(1, 3)
            categories = NewsCategoryFactory.create_batch(num_categories)
            self.categories.set(categories)


class BuildingTypeFactory(DjangoModelFactory):
    """Factory for BuildingType model"""
    class Meta:
        model = BuildingType
        django_get_or_create = ('name',)
    
    name = factory.Iterator(['Academic', 'Administrative', 'Library', 'Laboratory', 'Sports'])


class BuildingFactory(DjangoModelFactory):
    """Factory for Building model"""
    class Meta:
        model = Building
        django_get_or_create = ('short_name',)
        skip_postgeneration_save = True
    
    name = factory.Sequence(lambda n: f"Building {n}")
    short_name = factory.Sequence(lambda n: f"B{n}")
    latitude = Faker('latitude')
    longitude = Faker('longitude')
    
    @post_generation
    def types(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for building_type in extracted:
                self.types.add(building_type)
        else:
            # Add 1-2 random types
            self.types.add(BuildingTypeFactory())


class FloorFactory(DjangoModelFactory):
    """Factory for Floor model"""
    class Meta:
        model = Floor
        django_get_or_create = ('number', 'building')
    
    number = factory.Sequence(lambda n: n % 5)  # 0-4 floors
    building = SubFactory(BuildingFactory)
    latitude = Faker('latitude')
    longitude = Faker('longitude')


class RoomFactory(DjangoModelFactory):
    """Factory for Room model"""
    class Meta:
        model = Room
    
    number = factory.Sequence(lambda n: f"{(n // 10) + 1}{n % 10:02d}")
    floor = SubFactory(FloorFactory)
    latitude = Faker('latitude')
    longitude = Faker('longitude')


# Batch factories for creating multiple objects
class BatchFactoryMixin:
    """Mixin to add batch creation methods"""
    
    @classmethod
    def create_batch_with_relations(cls, size=10, **kwargs):
        """Create a batch of objects with related objects"""
        objects = []
        for _ in range(size):
            obj = cls.create(**kwargs)
            objects.append(obj)
        return objects


class ThreadWithPostsFactory(ThreadFactory, BatchFactoryMixin):
    """Factory for creating threads with posts"""
    
    @post_generation
    def posts(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Create 3-10 posts for each thread
        num_posts = kwargs.get('num_posts', random.randint(3, 10))
        PostFactory.create_batch(num_posts, thread=self)


class EventWithAttendeesFactory(EventFactory, BatchFactoryMixin):
    """Factory for creating events with attendees"""
    
    @post_generation
    def attendees(self, create, extracted, **kwargs):
        if not create:
            return
        
        # Add 5-20 attendees
        num_attendees = kwargs.get('num_attendees', random.randint(5, 20))
        users = UserFactory.create_batch(num_attendees)
        self.attendees.set(users)