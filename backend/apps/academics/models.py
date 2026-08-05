from django.db import models


class Grade(models.Model):
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    level = models.IntegerField('المستوى')

    class Meta:
        verbose_name = 'صف'
        verbose_name_plural = 'الصفوف'
        ordering = ['level']

    def __str__(self):
        return self.translations.get('ar', {}).get('name', str(self.level))

class Subject(models.Model):
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    icon = models.CharField('الأيقونة', max_length=50, blank=True)

    class Meta:
        verbose_name = 'مادة'
        verbose_name_plural = 'المواد'
        ordering = ['id']

    def __str__(self):
        return self.translations.get('ar', {}).get('name', '')

class Curriculum(models.Model):
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    country = models.CharField('الدولة', max_length=100)
    year = models.IntegerField('السنة')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='curricula')

    class Meta:
        verbose_name = 'منهج'
        verbose_name_plural = 'المناهج'

    def __str__(self):
        return f"{self.translations.get('ar', {}).get('name', '')} - {self.country}"

class Unit(models.Model):
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE, related_name='units')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='units', verbose_name='المادة الدراسية')
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    outcomes = models.JSONField('نواتج التعلم', default=list, blank=True, help_text='قائمة نواتج التعلم الرسمية لهذه الوحدة')
    content = models.TextField('محتوى الوحدة الرسمي', blank=True, help_text='مقتطفات من محتوى المنهاج الرسمي لحقنها في توليد الخطط')
    order = models.IntegerField('الترتيب', default=0)

    class Meta:
        verbose_name = 'وحدة'
        verbose_name_plural = 'الوحدات'
        ordering = ['order']

    def __str__(self):
        return self.translations.get('ar', {}).get('name', str(self.order))

class CurriculumDocument(models.Model):
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE, related_name='documents', null=True, blank=True, verbose_name='المنهج الدراسي')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='documents', null=True, blank=True, verbose_name='المادة الدراسية')
    title = models.CharField('عنوان المستند/الملف', max_length=255)
    file = models.FileField('ملف المنهج (PDF/TXT)', upload_to='curricula/documents/', null=True, blank=True)
    external_url = models.URLField('رابط الملف الخارجي (الموقع الرسمي)', max_length=1000, blank=True, null=True)
    extracted_text = models.TextField('النص المستخرج / محتوى المنهج', blank=True)
    created_at = models.DateTimeField('تاريخ الرفع', auto_now_add=True)

    class Meta:
        verbose_name = 'مستند منهج ومادة'
        verbose_name_plural = 'مستندات المناهج والمواد (Curriculum Documents)'

    def __str__(self):
        return self.title

