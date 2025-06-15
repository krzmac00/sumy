from django.core.management.base import BaseCommand
from news.models import NewsCategory


class Command(BaseCommand):
    help = 'Populate news categories with the hierarchical structure'

    def handle(self, *args, **options):
        self.stdout.write('Creating news categories...')
        
        # 1. University-wide (ogólnouczelniane)
        university_wide = NewsCategory.objects.create(
            name='University-wide',
            slug='university-wide',
            category_type='university'
        )
        
        # 1.1-1.5 Year categories
        for year in range(1, 6):
            NewsCategory.objects.create(
                name=f'{year} year',
                slug=f'year-{year}',
                parent=university_wide,
                category_type='university'
            )
        
        # 2. FTIMS
        ftims = NewsCategory.objects.create(
            name='FTIMS',
            slug='ftims',
            category_type='faculty'
        )
        
        # 2.1 IS
        is_dept = NewsCategory.objects.create(
            name='IS',
            slug='is',
            parent=ftims,
            category_type='faculty'
        )
        
        # 2.1.1-2.1.5 IS specializations
        is_specs = ['GMK', 'IAS', 'IBD', 'IOAD', 'TGSK']
        for spec in is_specs:
            NewsCategory.objects.create(
                name=spec,
                slug=spec.lower(),
                parent=is_dept,
                category_type='faculty'
            )
        
        # 2.2-2.4 Other FTIMS departments
        other_depts = ['AIAF', 'FT', 'MS']
        for dept in other_depts:
            NewsCategory.objects.create(
                name=dept,
                slug=dept.lower(),
                parent=ftims,
                category_type='faculty'
            )
        
        # 3. Announcement (Komunikat)
        announcement = NewsCategory.objects.create(
            name='Announcement',
            slug='announcement',
            category_type='announcement'
        )
        
        # 3.1-3.4 Announcement subcategories
        announcement_subs = [
            ("Dean's hours", 'deans-hours'),
            ('Session', 'session'),
            ('Survey', 'survey'),
            ('Parking', 'parking')
        ]
        for name, slug in announcement_subs:
            NewsCategory.objects.create(
                name=name,
                slug=slug,
                parent=announcement,
                category_type='announcement'
            )
        
        # 4. Event (Wydarzenie)
        NewsCategory.objects.create(
            name='Event',
            slug='event',
            category_type='event'
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully created all news categories'))