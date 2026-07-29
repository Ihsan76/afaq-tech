from django.db import migrations


def restructure_content(old):
    """Convert flat _en/_ar keys in content JSON to nested locale keys — v2 with nested support."""
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
        return [convert_dict(item) if isinstance(item, dict) else item for item in items]

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


def forwards(apps, schema_editor):
    PageBlock = apps.get_model('pages', 'PageBlock')
    for block in PageBlock.objects.all():
        new_content = restructure_content(block.content)
        if new_content != block.content:
            block.content = new_content
            block.save(update_fields=['content'])


class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0006_populate_translations'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
