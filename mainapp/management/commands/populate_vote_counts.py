from django.core.management.base import BaseCommand
from django.db import transaction
from mainapp.post import Thread, Post


class Command(BaseCommand):
    help = 'Populate vote_count_cache and post_count fields for existing threads and posts'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of objects to process in each batch'
        )
    
    def handle(self, *args, **options):
        batch_size = options['batch_size']
        
        self.stdout.write('Updating thread vote counts and post counts...')
        thread_count = Thread.objects.count()
        
        # Update threads in batches
        for i in range(0, thread_count, batch_size):
            with transaction.atomic():
                threads = Thread.objects.all()[i:i+batch_size]
                for thread in threads:
                    thread.update_vote_count()
                    thread.update_post_count()
                    
            self.stdout.write(f'Processed threads {i} to {min(i+batch_size, thread_count)}')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {thread_count} threads'))
        
        # Update posts
        self.stdout.write('Updating post vote counts...')
        post_count = Post.objects.count()
        
        for i in range(0, post_count, batch_size):
            with transaction.atomic():
                posts = Post.objects.all()[i:i+batch_size]
                for post in posts:
                    post.update_vote_count()
                    
            self.stdout.write(f'Processed posts {i} to {min(i+batch_size, post_count)}')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated {post_count} posts'))