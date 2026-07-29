from django.db import migrations


def restructure_content(old):
    """Convert flat _en/_ar keys in content JSON to nested locale keys."""
    if not old or not isinstance(old, dict):
        return old

    localized_prefixes = [
        'heading', 'subtitle', 'title', 'desc', 'name',
        'cta_text', 'cta_button', 'cta_link', 'q', 'a', 'text',
        'content', 'excerpt', 'author_name', 'button',
        'success', 'badge', 'label', 'placeholder',
        'tab_title', 'item_title', 'item_desc',
        'secondary_cta', 'secondary_cta_link',
    ]

    def convert_list_items(items):
        if not isinstance(items, list):
            return items
        new_items = []
        for item in items:
            if isinstance(item, dict):
                new_items.append(convert_dict(item))
            else:
                new_items.append(item)
        return new_items

    def convert_dict(d):
        out = {}
        for key, value in d.items():
            matched = False
            for prefix in localized_prefixes:
                if key == f"{prefix}_en":
                    out.setdefault(prefix, {})["en"] = value
                    matched = True
                    break
                elif key == f"{prefix}_ar":
                    out.setdefault(prefix, {})["ar"] = value
                    matched = True
                    break
            if not matched:
                if isinstance(value, list):
                    out[key] = convert_list_items(value)
                elif isinstance(value, dict):
                    out[key] = convert_dict(value)
                else:
                    out[key] = value
        return out

    return convert_dict(old)


def migrate_pages(apps, schema_editor):
    Page = apps.get_model('pages', 'Page')
    for page in Page.objects.all():
        page.translations = {
            "en": {
                "title": page.title_en or '',
                "description": page.description_en or '',
                "meta_title": page.meta_title_en or '',
                "meta_description": page.meta_description_en or '',
            },
            "ar": {
                "title": page.title_ar or '',
                "description": page.description_ar or '',
                "meta_title": page.meta_title_ar or '',
                "meta_description": page.meta_description_ar or '',
            },
        }
        page.save(update_fields=['translations'])


def migrate_page_blocks(apps, schema_editor):
    PageBlock = apps.get_model('pages', 'PageBlock')
    for block in PageBlock.objects.all():
        block.translations = {
            "en": {"title": block.title_en or '', "subtitle": block.subtitle_en or ''},
            "ar": {"title": block.title_ar or '', "subtitle": block.subtitle_ar or ''},
        }
        block.content = restructure_content(block.content)
        block.save(update_fields=['translations', 'content'])


def migrate_menu_items(apps, schema_editor):
    MenuItem = apps.get_model('pages', 'MenuItem')
    for item in MenuItem.objects.all():
        item.translations = {
            "en": {"title": item.title_en or ''},
            "ar": {"title": item.title_ar or ''},
        }
        item.save(update_fields=['translations'])


def migrate_page_templates(apps, schema_editor):
    PageTemplate = apps.get_model('pages', 'PageTemplate')
    for tpl in PageTemplate.objects.all():
        tpl.translations = {
            "en": {"name": tpl.name_en or '', "description": tpl.description_en or ''},
            "ar": {"name": tpl.name_ar or '', "description": tpl.description_ar or ''},
        }
        tpl.save(update_fields=['translations'])


def migrate_site_settings(apps, schema_editor):
    SiteSettings = apps.get_model('pages', 'SiteSettings')
    for s in SiteSettings.objects.all():
        s.translations = {
            "en": {"site_name": s.site_name_en or '', "site_description": s.site_description_en or ''},
            "ar": {"site_name": s.site_name_ar or '', "site_description": s.site_description_ar or ''},
        }
        s.footer_translations = {
            "en": {"footer_text": s.footer_text_en or ''},
            "ar": {"footer_text": s.footer_text_ar or ''},
        }
        s.save(update_fields=['translations', 'footer_translations'])


def forwards(apps, schema_editor):
    migrate_pages(apps, schema_editor)
    migrate_page_blocks(apps, schema_editor)
    migrate_menu_items(apps, schema_editor)
    migrate_page_templates(apps, schema_editor)
    migrate_site_settings(apps, schema_editor)


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0005_translations_add'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
