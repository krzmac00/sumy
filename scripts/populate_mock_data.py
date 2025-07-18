#!/usr/bin/env python
"""
Script to populate the database with mock data for calendar, noticeboard, and news.
Data is generated with random timestamps across 1 week from now.
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from faker import Faker

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sumy.settings')
django.setup()

from django.contrib.auth import get_user_model
from mainapp.models import Event
from noticeboard.models import Advertisement, Comment
from news.models import NewsItem, NewsCategory
from accounts.models import Lecturer

User = get_user_model()
fake = Faker()


class MockDataGenerator:
    """Generate mock data for various models"""
    
    def __init__(self):
        self.users = list(User.objects.filter(is_active=True)[:20])
        self.lecturers = list(Lecturer.objects.all()[:10])
        self.news_categories = list(NewsCategory.objects.all())
        
        if not self.users:
            print("Warning: No active users found. Creating test users...")
            self._create_test_users()
            
        if not self.lecturers:
            print("Warning: No lecturers found. Creating test lecturers...")
            self._create_test_lecturers()
            
        if not self.news_categories:
            print("Warning: No news categories found. Creating default categories...")
            self._create_news_categories()
    
    def _create_test_users(self):
        """Create test users if none exist"""
        for i in range(10):
            user = User.objects.create_user(
                email=f'student{i}@edu.p.lodz.pl',
                password='testpass123',
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                is_active=True
            )
            self.users.append(user)
        print(f"Created {len(self.users)} test users")
    
    def _create_test_lecturers(self):
        """Create test lecturers if none exist"""
        for i in range(5):
            user = User.objects.create_user(
                email=f'lecturer{i}@p.lodz.pl',
                password='testpass123',
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                is_active=True,
                is_staff=True
            )
            lecturer = Lecturer.objects.create(
                user=user,
                title='dr',
                department='Computer Science'
            )
            self.lecturers.append(lecturer)
        print(f"Created {len(self.lecturers)} test lecturers")
    
    def _create_news_categories(self):
        """Create default news categories"""
        categories_data = [
            ('University', 'university', 'university', None),
            ('Faculty', 'faculty', 'faculty', None),
            ('Department', 'department', 'department', None),
            ('Student Council', 'student-council', 'other', None),
            ('Events', 'events', 'other', None),
        ]
        
        for name, slug, cat_type, parent in categories_data:
            category, created = NewsCategory.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'category_type': cat_type,
                    'parent': parent
                }
            )
            self.news_categories.append(category)
        print(f"Created {len(self.news_categories)} news categories")
    
    def random_datetime_next_week(self):
        """Generate random datetime within next 7 days"""
        now = timezone.now()
        days_ahead = random.uniform(0, 7)
        return now + timedelta(days=days_ahead)
    
    def random_datetime_past_week(self):
        """Generate random datetime within past 7 days"""
        now = timezone.now()
        days_ago = random.uniform(0, 7)
        return now - timedelta(days=days_ago)
    
    def create_calendar_events(self, count=50):
        """Create random calendar events"""
        print(f"\nCreating {count} calendar events...")
        
        event_types = ['lecture', 'exam', 'meeting', 'workshop', 'seminar', 'deadline']
        categories = ['important', 'private', 'exam', 'club', 'student_council', 'tul_events']
        
        events_created = 0
        for _ in range(count):
            try:
                start_date = self.random_datetime_next_week()
                duration_hours = random.choice([1, 1.5, 2, 3, 4])
                end_date = start_date + timedelta(hours=duration_hours)
                
                event_type = random.choice(event_types)
                
                # Generate appropriate title based on type
                if event_type == 'lecture':
                    title = f"{fake.catch_phrase()} - Lecture"
                elif event_type == 'exam':
                    title = f"{fake.job()} - Exam"
                elif event_type == 'meeting':
                    title = f"Meeting: {fake.bs()}"
                elif event_type == 'workshop':
                    title = f"Workshop: {fake.catch_phrase()}"
                elif event_type == 'seminar':
                    title = f"Seminar: {fake.catch_phrase()}"
                else:
                    title = f"Deadline: {fake.bs()}"
                
                event = Event.objects.create(
                    user=random.choice(self.users),
                    title=title,
                    description=fake.text(max_nb_chars=200),
                    start_date=start_date,
                    end_date=end_date,
                    category=random.choice(categories),
                    location=f"Room {random.randint(100, 500)}, {fake.company()} Building" if event_type != 'deadline' else None
                )
                events_created += 1
                
            except Exception as e:
                print(f"Error creating event: {e}")
                continue
        
        print(f"Successfully created {events_created} events")
    
    def create_advertisements(self, count=30):
        """Create random advertisements"""
        print(f"\nCreating {count} advertisements...")
        
        ad_categories = ['announcement', 'sale', 'buy', 'service', 'event', 'lost_found', 'other']
        
        # Template data for realistic ads
        sale_items = ['textbook', 'laptop', 'calculator', 'bike', 'furniture', 'phone']
        services = ['tutoring', 'programming help', 'translation', 'design work', 'moving help']
        
        ads_created = 0
        for _ in range(count):
            try:
                category = random.choice(ad_categories)
                created_date = self.random_datetime_past_week()
                
                # Generate appropriate content based on category
                if category == 'sale':
                    item = random.choice(sale_items)
                    title = f"Selling {item} - {fake.catch_phrase()}"
                    content = f"Selling my {item}. {fake.text(max_nb_chars=150)} Condition: {random.choice(['Like new', 'Good', 'Fair'])}."
                    price = random.randint(10, 1000)
                elif category == 'buy':
                    item = random.choice(sale_items)
                    title = f"Looking for {item}"
                    content = f"Need to buy a {item} for my studies. {fake.text(max_nb_chars=100)}"
                    price = None
                elif category == 'service':
                    service = random.choice(services)
                    title = f"Offering {service}"
                    content = f"Professional {service} available. {fake.text(max_nb_chars=150)}"
                    price = random.randint(20, 200) if random.random() > 0.5 else None
                elif category == 'lost_found':
                    title = random.choice([f"Lost: {fake.word()}", f"Found: {fake.word()}"])
                    content = fake.text(max_nb_chars=100)
                    price = None
                elif category == 'event':
                    title = f"Event: {fake.catch_phrase()}"
                    content = f"Join us for {fake.text(max_nb_chars=150)}"
                    price = random.randint(0, 50) if random.random() > 0.7 else None
                else:
                    title = fake.sentence(nb_words=6)
                    content = fake.text(max_nb_chars=200)
                    price = None
                
                # Set expiry date (some ads expire, some don't)
                expires_at = None
                if random.random() > 0.3:  # 70% of ads have expiry
                    days_until_expiry = random.randint(1, 30)
                    expires_at = created_date + timedelta(days=days_until_expiry)
                
                ad = Advertisement.objects.create(
                    author=random.choice(self.users),
                    title=title,
                    content=content,
                    category=category,
                    price=price,
                    location=fake.city() if random.random() > 0.3 else 'Campus',
                    contact_info=fake.phone_number() if random.random() > 0.5 else fake.email(),
                    created_date=created_date,
                    last_activity_date=created_date,
                    expires_at=expires_at,
                    is_active=True
                )
                
                # Add some comments to popular ads
                if random.random() > 0.6:  # 40% of ads get comments
                    self._add_comments_to_ad(ad, created_date)
                
                ads_created += 1
                
            except Exception as e:
                print(f"Error creating advertisement: {e}")
                continue
        
        print(f"Successfully created {ads_created} advertisements")
    
    def _add_comments_to_ad(self, ad, ad_created_date):
        """Add random comments to an advertisement"""
        num_comments = random.randint(1, 5)
        
        comment_templates = [
            "Is this still available?",
            "What's the lowest price you'll accept?",
            "Can you provide more details?",
            "I'm interested! When can we meet?",
            "Does it come with {item}?",
            "What's the condition like?",
            "Can you send more photos?",
            "Is the price negotiable?",
        ]
        
        for i in range(num_comments):
            try:
                # Comments should be after ad creation
                hours_after = random.uniform(1, 48)
                comment_date = ad_created_date + timedelta(hours=hours_after)
                
                # Make sure comment date is not in the future
                if comment_date > timezone.now():
                    comment_date = timezone.now() - timedelta(hours=random.uniform(1, 24))
                
                Comment.objects.create(
                    advertisement=ad,
                    author=random.choice([u for u in self.users if u != ad.author]),
                    content=random.choice(comment_templates).format(item=fake.word()),
                    created_date=comment_date,
                    is_public=random.random() > 0.2  # 80% public comments
                )
                
                # Update ad's last activity
                ad.last_activity_date = comment_date
                ad.save()
                
            except Exception as e:
                print(f"Error creating comment: {e}")
                continue
    
    def create_news_items(self, count=20):
        """Create random news items"""
        print(f"\nCreating {count} news items...")
        
        news_templates = {
            'university': [
                "New Research Grant Awarded to {department}",
                "University Rankings: We've Moved Up!",
                "International Partnership with {university}",
                "New Campus Facilities Opening Soon",
            ],
            'faculty': [
                "Faculty Meeting: Important Updates",
                "New Course Offerings for Next Semester",
                "Faculty Achievement: {achievement}",
                "Guest Lecture Series Announcement",
            ],
            'department': [
                "Department Seminar: {topic}",
                "Student Project Showcase",
                "New Lab Equipment Arrived",
                "Internship Opportunities Available",
            ],
            'events': [
                "Annual {event} Coming Up",
                "Workshop: {skill} for Students",
                "Career Fair Next Week",
                "Student Competition Results",
            ],
            'student-council': [
                "Student Council Elections",
                "New Student Initiatives",
                "Feedback Survey Results",
                "Student Rights Update",
            ]
        }
        
        news_created = 0
        for _ in range(count):
            try:
                category = random.choice(self.news_categories)
                created_date = self.random_datetime_past_week()
                
                # Get appropriate template based on category
                templates = news_templates.get(
                    category.slug, 
                    ["General News: {topic}", "Update: {announcement}"]
                )
                title_template = random.choice(templates)
                
                # Fill in template
                title = title_template.format(
                    department=fake.job(),
                    university=fake.company(),
                    achievement=fake.catch_phrase(),
                    topic=fake.bs(),
                    event=fake.word(),
                    skill=fake.job(),
                    announcement=fake.sentence(nb_words=4)
                )
                
                # Generate content
                content = fake.text(max_nb_chars=500)
                
                # Some news items have events
                event_date = None
                event_location = None
                if random.random() > 0.6:  # 40% have associated events
                    event_date = created_date + timedelta(days=random.randint(1, 14))
                    event_location = f"Room {random.randint(100, 500)}, {fake.company()} Building"
                
                # Only lecturers can create news
                lecturer = random.choice(self.lecturers)
                
                news = NewsItem.objects.create(
                    title=title,
                    content=content,
                    author=lecturer,
                    publication_date=created_date,
                    is_published=True,
                    event_date=event_date,
                    event_location=event_location
                )
                
                # Add to categories
                news.categories.add(category)
                if random.random() > 0.7:  # 30% belong to multiple categories
                    additional_category = random.choice(
                        [c for c in self.news_categories if c != category]
                    )
                    news.categories.add(additional_category)
                
                news_created += 1
                
            except Exception as e:
                print(f"Error creating news item: {e}")
                continue
        
        print(f"Successfully created {news_created} news items")
    
    def run(self):
        """Run all data generation methods"""
        print("Starting mock data generation...")
        print(f"Found {len(self.users)} users, {len(self.lecturers)} lecturers")
        
        self.create_calendar_events(50)
        self.create_advertisements(30)
        self.create_news_items(20)
        
        print("\nMock data generation completed!")
        
        # Print summary
        print("\nDatabase summary:")
        print(f"- Total events: {Event.objects.count()}")
        print(f"- Total advertisements: {Advertisement.objects.count()}")
        print(f"- Total news items: {NewsItem.objects.count()}")
        print(f"- Total comments: {Comment.objects.count()}")


def main():
    """Main function"""
    print("="*50)
    print("Mock Data Generator for PoliConnect")
    print("="*50)
    
    # Confirm before proceeding
    response = input("\nThis will add mock data to your database. Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Aborted.")
        return
    
    generator = MockDataGenerator()
    generator.run()


if __name__ == '__main__':
    main()