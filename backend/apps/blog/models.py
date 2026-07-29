from django.db import models
from django.utils.text import slugify


class BlogCategory(models.Model):
    slug = models.SlugField(unique=True, max_length=100)
    translations = models.JSONField('Translations', default=dict, blank=True)
    icon = models.CharField('Icon', max_length=10, default='📁')
    order = models.IntegerField('Order', default=0)
    is_active = models.BooleanField('Active', default=True)

    class Meta:
        verbose_name = 'Blog Category'
        verbose_name_plural = 'Blog Categories'
        ordering = ['order', 'slug']

    def __str__(self):
        return self.translations.get('ar', {}).get('name', self.slug)


class BlogPost(models.Model):
    slug = models.SlugField(unique=True, max_length=200)
    translations = models.JSONField('Translations', default=dict, blank=True)
    featured_image = models.URLField('Featured Image URL', blank=True, default='')
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='posts')
    tags = models.CharField('Tags', max_length=500, blank=True, default='', help_text='Comma-separated tags')
    related_service = models.CharField('Related Service URL', max_length=200, blank=True, default='', help_text='e.g. /services/web-design')
    author_translations = models.JSONField('Author Translations', default=dict, blank=True)
    author_avatar = models.URLField('Author Avatar URL', blank=True, default='')
    is_published = models.BooleanField('Published', default=False)
    is_featured = models.BooleanField('Featured', default=False)
    read_time = models.IntegerField('Read Time (minutes)', default=5)
    views = models.IntegerField('Views', default=0)
    published_at = models.DateTimeField('Published At', null=True, blank=True)
    created_at = models.DateTimeField('Created', auto_now_add=True)
    updated_at = models.DateTimeField('Updated', auto_now=True)

    class Meta:
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.translations.get('ar', {}).get('title', self.slug)

    def save(self, *args, **kwargs):
        if not self.slug:
            title = self.translations.get('en', {}).get('title', '') or self.translations.get('ar', {}).get('title', '')
            self.slug = slugify(title) or 'untitled'
        super().save(*args, **kwargs)
