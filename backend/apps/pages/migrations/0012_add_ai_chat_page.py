from django.db import migrations

def add_ai_chat_page(apps, schema_editor):
    Page = apps.get_model('pages', 'Page')
    Page.objects.update_or_create(
        slug='ai-chat',
        defaults={
            'translations': {
                'ar': {
                    'title': 'المساعد الذكي',
                    'description': 'مساعد ذكي يعمل بالذكاء الاصطناعي للإجابة على أسئلتك ومساعدتك في مهامك',
                    'meta_title': 'المساعد الذكي — Afaq Tech',
                    'meta_description': 'مساعد ذكي متعدد المهام، يجاوب على أسئلتك ويساعدك في التعلم والعمل',
                },
                'en': {
                    'title': 'AI Assistant',
                    'description': 'An intelligent AI assistant to answer your questions and help with your tasks',
                    'meta_title': 'AI Assistant — Afaq Tech',
                    'meta_description': 'A multi-purpose AI assistant that answers your questions and helps with learning and work',
                },
            },
            'template': 'default',
            'show_in_nav': True,
            'nav_order': 5,
            'nav_icon': '🤖',
            'is_published': True,
            'layout_config': {
                'max_width': '1200px',
                'padding': '0',
                'background': 'var(--color-background)',
            },
        }
    )

def remove_ai_chat_page(apps, schema_editor):
    Page = apps.get_model('pages', 'Page')
    Page.objects.filter(slug='ai-chat').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('pages', '0011_add_address_to_site_settings'),
    ]
    operations = [
        migrations.RunPython(add_ai_chat_page, remove_ai_chat_page),
    ]
