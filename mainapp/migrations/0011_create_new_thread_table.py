# Complete thread model refactoring in a single migration

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


def migrate_thread_data(apps, schema_editor):
    """Migrate existing thread data before model changes."""
    Thread = apps.get_model('mainapp', 'Thread')
    Post = apps.get_model('mainapp', 'Post')
    
    # Store thread data before we modify the model
    thread_data = []
    for thread in Thread.objects.all():
        post = thread.post if hasattr(thread, 'post') else None
        
        # Determine content
        content = getattr(thread, 'content', '') or ''
        if not content and post:
            content = post.content if post.content != "This is a placeholder post for thread compatibility" else thread.title
        
        # Determine author info
        author_id = None
        nickname = "Anonymous User"
        is_anonymous = False
        created_date = timezone.now()
        
        if hasattr(thread, 'thread_author') and thread.thread_author:
            author_id = thread.thread_author.id
            nickname = getattr(thread, 'thread_nickname', 'Anonymous User') or 'Anonymous User'
            is_anonymous = getattr(thread, 'thread_is_anonymous', False) or False
            if hasattr(thread, 'thread_date') and thread.thread_date:
                created_date = thread.thread_date
        elif post:
            if post.user:
                author_id = post.user.id
            nickname = post.nickname
            is_anonymous = getattr(post, 'is_anonymous', False)
            created_date = post.date
        
        thread_data.append({
            'old_post_id': post.id if post else None,
            'title': thread.title,
            'content': content,
            'category': thread.category,
            'nickname': nickname,
            'is_anonymous': is_anonymous,
            'visible_for_teachers': thread.visible_for_teachers,
            'can_be_answered': thread.can_be_answered,
            'author_id': author_id,
            'created_date': created_date,
            'last_activity_date': thread.last_activity_date,
            'related_post_ids': list(Post.objects.filter(thread=thread).values_list('id', flat=True))
        })
    
    # Store the data in the schema_editor for later use
    schema_editor._thread_migration_data = thread_data


def restore_thread_data(apps, schema_editor):
    """Restore thread data after model changes."""
    Thread = apps.get_model('mainapp', 'Thread')
    Post = apps.get_model('mainapp', 'Post')
    User = apps.get_model('accounts', 'User')
    
    # Get the stored data
    thread_data = getattr(schema_editor, '_thread_migration_data', [])
    
    for data in thread_data:
        # Get the author if exists
        author = None
        if data['author_id']:
            try:
                author = User.objects.get(id=data['author_id'])
            except User.DoesNotExist:
                pass
        
        # Create new thread
        new_thread = Thread.objects.create(
            title=data['title'],
            content=data['content'],
            category=data['category'],
            nickname=data['nickname'],
            is_anonymous=data['is_anonymous'],
            visible_for_teachers=data['visible_for_teachers'],
            can_be_answered=data['can_be_answered'],
            author=author,
            last_activity_date=data['last_activity_date']
        )
        
        # Update the created_date manually since auto_now_add prevents normal setting
        Thread.objects.filter(id=new_thread.id).update(created_date=data['created_date'])
        
        # Update related posts
        if data['related_post_ids']:
            Post.objects.filter(id__in=data['related_post_ids']).update(thread=new_thread)


class Migration(migrations.Migration):

    dependencies = [
        ('mainapp', '0010_alter_post_nickname'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Store existing data
        migrations.RunPython(
            migrate_thread_data,
            migrations.RunPython.noop,
        ),
        
        # Step 2: Drop and recreate the Thread table with new structure
        migrations.DeleteModel(name='Thread'),
        
        migrations.CreateModel(
            name='Thread',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=1023)),
                ('content', models.TextField()),
                ('category', models.CharField(max_length=63)),
                ('nickname', models.CharField(default='Anonymous User', max_length=63)),
                ('is_anonymous', models.BooleanField(default=False)),
                ('visible_for_teachers', models.BooleanField(default=False)),
                ('can_be_answered', models.BooleanField(default=True)),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('last_activity_date', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='authored_threads',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
        ),
        
        # Step 3: Update Post model to reference new Thread structure
        migrations.RemoveField(model_name='post', name='thread'),
        
        migrations.AddField(
            model_name='post',
            name='thread',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='posts',
                to='mainapp.thread',
            ),
        ),
        
        # Step 4: Restore the data
        migrations.RunPython(
            restore_thread_data,
            migrations.RunPython.noop,
        ),
    ]