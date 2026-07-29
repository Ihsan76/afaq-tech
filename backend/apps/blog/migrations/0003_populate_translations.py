from django.db import migrations


def forwards(apps, schema_editor):
    BlogCategory = apps.get_model('blog', 'BlogCategory')
    for cat in BlogCategory.objects.all():
        cat.translations = {
            "en": {"name": cat.name_en or '', "description": cat.description_en or ''},
            "ar": {"name": cat.name_ar or '', "description": cat.description_ar or ''},
        }
        cat.save(update_fields=['translations'])

    BlogPost = apps.get_model('blog', 'BlogPost')
    for post in BlogPost.objects.all():
        post.translations = {
            "en": {
                "title": post.title_en or '',
                "excerpt": post.excerpt_en or '',
                "content": post.content_en or '',
            },
            "ar": {
                "title": post.title_ar or '',
                "excerpt": post.excerpt_ar or '',
                "content": post.content_ar or '',
            },
        }
        post.author_translations = {
            "en": {"author_name": post.author_name_en or ''},
            "ar": {"author_name": post.author_name_ar or ''},
        }
        post.save(update_fields=['translations', 'author_translations'])


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0002_translations_add'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
