from django.db import migrations, models
from django.utils import timezone

def migrate_thread_content(apps, schema_editor):
    Thread = apps.get_model('mainapp', 'Thread')
    for thread in Thread.objects.all():
        if hasattr(thread, 'post') and thread.post:
            # Copy values from the post to the thread
            thread.content = thread.post.content
            thread.thread_nickname = thread.post.nickname
            thread.thread_is_anonymous = thread.post.is_anonymous
            thread.thread_date = thread.post.date
            if hasattr(thread.post, 'user'):
                thread.thread_author = thread.post.user
            thread.save()

class Migration(migrations.Migration):

    dependencies = [
        ('mainapp', '0008_thread_content_thread_thread_author_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_thread_content),
    ]