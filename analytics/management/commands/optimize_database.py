from django.core.management.base import BaseCommand
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = 'Add database indexes for optimization'
    
    def handle(self, *args, **options):
        self.stdout.write('Adding database indexes for optimization...\n')
        
        indexes = [
            # User model indexes
            "CREATE INDEX IF NOT EXISTS idx_user_email_lower ON auth_user (LOWER(email));",
            "CREATE INDEX IF NOT EXISTS idx_user_username_lower ON auth_user (LOWER(username));",
            "CREATE INDEX IF NOT EXISTS idx_user_full_name ON auth_user (first_name, last_name);",
            "CREATE INDEX IF NOT EXISTS idx_user_is_active ON auth_user (is_active) WHERE is_active = true;",
            
            # Thread model indexes
            "CREATE INDEX IF NOT EXISTS idx_thread_category_created ON mainapp_thread (category, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_thread_user_created ON mainapp_thread (user_id, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_thread_votes ON mainapp_thread (votes DESC) WHERE votes > 0;",
            "CREATE INDEX IF NOT EXISTS idx_thread_search ON mainapp_thread USING gin(to_tsvector('english', title || ' ' || content));",
            
            # Post model indexes
            "CREATE INDEX IF NOT EXISTS idx_post_thread_created ON mainapp_post (thread_id, created_at);",
            "CREATE INDEX IF NOT EXISTS idx_post_user_created ON mainapp_post (user_id, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_post_search ON mainapp_post USING gin(to_tsvector('english', content));",
            
            # Event model indexes
            "CREATE INDEX IF NOT EXISTS idx_event_category ON mainapp_event (category);",
            "CREATE INDEX IF NOT EXISTS idx_event_dates ON mainapp_event (start, \"end\");",
            "CREATE INDEX IF NOT EXISTS idx_event_user ON mainapp_event (user_id);",
            
            # News model indexes
            "CREATE INDEX IF NOT EXISTS idx_news_category_created ON news_newsitem (categories, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_news_author_created ON news_newsitem (author_id, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_news_search ON news_newsitem USING gin(to_tsvector('english', title || ' ' || content));",
            
            # Advertisement model indexes
            "CREATE INDEX IF NOT EXISTS idx_notice_category_created ON noticeboard_advertisement (category, created_date DESC);",
            "CREATE INDEX IF NOT EXISTS idx_notice_expires ON noticeboard_advertisement (expires_at) WHERE expires_at > NOW();",
            "CREATE INDEX IF NOT EXISTS idx_notice_price ON noticeboard_advertisement (price) WHERE price IS NOT NULL;",
            "CREATE INDEX IF NOT EXISTS idx_notice_search ON noticeboard_advertisement USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(location, '')));",
            
            # Analytics model indexes (already in model definition, but adding GIN indexes)
            "CREATE INDEX IF NOT EXISTS idx_searchquery_search ON analytics_searchquery USING gin(to_tsvector('english', query));",
            
            # Composite indexes for common queries
            "CREATE INDEX IF NOT EXISTS idx_thread_category_pinned ON mainapp_thread (category, is_pinned, created_at DESC);",
            "CREATE INDEX IF NOT EXISTS idx_post_thread_votes ON mainapp_post (thread_id, votes DESC) WHERE votes > 0;",
        ]
        
        with connection.cursor() as cursor:
            for index_sql in indexes:
                try:
                    cursor.execute(index_sql)
                    self.stdout.write(self.style.SUCCESS(f'✓ Created index: {index_sql[:50]}...'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Failed to create index: {str(e)}'))
        
        # Add PostgreSQL-specific optimizations
        self.stdout.write('\nApplying PostgreSQL-specific optimizations...\n')
        
        pg_optimizations = [
            # Enable trigram extension for fuzzy search
            "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            
            # Update table statistics
            "ANALYZE;",
            
            # Set up text search configuration
            "CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS custom_search (COPY = english);",
        ]
        
        with connection.cursor() as cursor:
            for optimization in pg_optimizations:
                try:
                    cursor.execute(optimization)
                    self.stdout.write(self.style.SUCCESS(f'✓ Applied: {optimization}'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'! Skipped: {optimization} - {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('\nDatabase optimization complete!'))