"""
Seed script — creates the main pages with their blocks.
Run: python seed_pages.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.pages.models import Page, PageBlock
from apps.core.cache import invalidate_site_cache

# ════════════════════════════════════════════════════════════════
# Page definitions
# ════════════════════════════════════════════════════════════════

PAGES = [ { 'blocks': [ { 'block_type': 'platform_hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'مجاني تماماً', 'en': 'Completely Free'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'استشارة مجانية',
                                                                         'en': 'Free Consultation'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'دعم فني 24/7', 'en': '24/7 Support'}}}],
                               'show_particles': True,
                               'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابدأ رحلتك نحو الآفاق', 'en': 'Get Started Free'},
                                                 'heading': { 'ar': 'آفاق تكنولوجي',
                                                              'en': 'Smart Digital Solutions for Your Business '
                                                                    'Success'},
                                                 'secondary_cta': {'ar': 'استكشف ما نقدمه', 'en': 'Explore Services'},
                                                 'secondary_cta_link': {'ar': '#services', 'en': '#services'},
                                                 'subtitle': { 'ar': 'افتح آفاق جديدة لأعمالك — حلول رقمية ذكية تمدّك '
                                                                     'بالرؤية والإمكانات التي تنقلك إلى آفاق أوسع من '
                                                                     'النجاح والنمو',
                                                               'en': 'We turn your ideas into innovative digital '
                                                                     'reality with AI tools'}}},
                  'order': 0},
                { 'block_type': 'platform_stats',
                  'content': { 'items': [ { 'translations': {'label': {'ar': 'مشروع منجز', 'en': 'Projects Completed'}},
                                            'value': '150+'},
                                          { 'translations': {'label': {'ar': 'عميل سعيد', 'en': 'Happy Clients'}},
                                            'value': '500+'},
                                          { 'translations': { 'label': { 'ar': 'خدمات متخصصة',
                                                                         'en': 'Specialized Services'}},
                                            'value': '8'},
                                          { 'translations': {'label': {'ar': 'سنوات خبرة', 'en': 'Years Experience'}},
                                            'value': '5+'}]},
                  'order': 1},
                { 'block_type': 'services_showcase',
                  'content': { 'columns': 4,
                               'services': [ { 'icon': '🌐',
                                               'translations': { 'desc': { 'ar': 'مواقع إلكترونية تفتح آفاقاً جديدة '
                                                                                 'لعلامتك التجارية — تصاميم تجذب '
                                                                                 'الزوار وتحوّلهم إلى عملاء دائمين',
                                                                           'en': 'Professional responsive websites '
                                                                                 'with latest technologies'},
                                                                 'title': {'ar': 'تصميم المواقع', 'en': 'Web Design'}},
                                               'url': '/services/web-design'},
                                             { 'icon': '📱',
                                               'translations': { 'desc': { 'ar': 'نوسّع آفاق حضورك الرقمي ونحوّل منصات '
                                                                                 'التواصل إلى مصدر حقيقي للمبيعات '
                                                                                 'والنمو المستدام',
                                                                           'en': 'Professional social media account '
                                                                                 'management'},
                                                                 'title': { 'ar': 'إدارة التواصل الاجتماعي',
                                                                            'en': 'Social Media Management'}},
                                               'url': '/services/social-media'},
                                             { 'icon': '🚀',
                                               'translations': { 'desc': { 'ar': 'صفحات مصممة بعناية فتح آفاق التحويل '
                                                                                 'العالية — كل زائر فرصة جديدة لنجاحك',
                                                                           'en': 'High-converting landing pages'},
                                                                 'title': { 'ar': 'صفحات الهبوط',
                                                                            'en': 'Landing Pages'}},
                                               'url': '/services/landing-pages'},
                                             { 'icon': '📝',
                                               'translations': { 'desc': { 'ar': 'نماذج ذكية تفتح آفاق جمع البيانات '
                                                                                 'بكفاءة — وفّر وقتك وجهدك وركّز على '
                                                                                 'ما يهم',
                                                                           'en': 'Smart and integrated data collection '
                                                                                 'forms'},
                                                                 'title': { 'ar': 'النماذج الإلكترونية',
                                                                            'en': 'Electronic Forms'}},
                                               'url': '/services/forms'},
                                             { 'icon': '📚',
                                               'translations': { 'desc': { 'ar': 'نحوّل خبراتك إلى كتب إلكترونية تفتح '
                                                                                 'لك آفاقاً جديدة في عالم المحتوى '
                                                                                 'والريادة',
                                                                           'en': 'Professional digital book '
                                                                                 'production'},
                                                                 'title': {'ar': 'الكتب الإلكترونية', 'en': 'E-Books'}},
                                               'url': '/services/ebooks'},
                                             { 'icon': '🎓',
                                               'translations': { 'desc': { 'ar': 'منصة تعليمية تفتح آفاقاً جديدة في '
                                                                                 'طريقة التدريس بقوة الذكاء الاصطناعي',
                                                                           'en': 'AI-powered integrated education '
                                                                                 'platform'},
                                                                 'title': { 'ar': 'المنصة التعليمية',
                                                                            'en': 'Education Platform'}},
                                               'url': '/services/education-platform'},
                                             { 'icon': '📢',
                                               'translations': { 'desc': { 'ar': 'حملات تفتح لك آفاقاً واسعة من الزوار '
                                                                                 'والعملاء المستهدفين بأقل تكلفة وأعلى '
                                                                                 'عائد',
                                                                           'en': 'Effective and measurable advertising '
                                                                                 'campaigns'},
                                                                 'title': { 'ar': 'الحملات الإعلانية',
                                                                            'en': 'Ad Campaigns'}},
                                               'url': '/services/ad-campaigns'},
                                             { 'icon': '💼',
                                               'translations': { 'desc': { 'ar': 'نبتكر هوية تفتح لك آفاق التميّز عن '
                                                                                 'المنافسين مع استشارات تضعك على خارطة '
                                                                                 'النجاح',
                                                                           'en': 'Consulting and complete brand '
                                                                                 'identity'},
                                                                 'title': { 'ar': 'الهوية البصرية والاستشارات',
                                                                            'en': 'Brand Identity'}},
                                               'url': '/services/brand-identity'}],
                               'translations': { 'subtitle': { 'ar': 'خدمات رقمية شاملة توسّع آفاق أعمالك وتقودك إلى '
                                                                     'نتائج لم تكن تتوقعها',
                                                               'en': 'A comprehensive range of digital services'},
                                                 'title': {'ar': 'حلولنا التي تفتح آفاق النمو', 'en': 'Our Services'}}},
                  'order': 2},
                { 'block_type': 'portfolio',
                  'content': { 'columns': 3,
                               'items': [ { 'image': '',
                                            'translations': { 'category': {'ar': 'تصميم مواقع', 'en': 'Web Design'},
                                                              'title': { 'ar': 'متجر إلكتروني',
                                                                         'en': 'E-Commerce Store'}}},
                                          { 'image': '',
                                            'translations': { 'category': { 'ar': 'تطوير تطبيقات',
                                                                            'en': 'App Development'},
                                                              'title': { 'ar': 'تطبيق تعليمي',
                                                                         'en': 'Educational App'}}},
                                          { 'image': '',
                                            'translations': { 'category': {'ar': 'إدارة تسويق', 'en': 'Marketing'},
                                                              'title': {'ar': 'حملة إعلانية', 'en': 'Ad Campaign'}}}],
                               'translations': { 'subtitle': { 'ar': 'نماذج من مشاريعنا الناجحة',
                                                               'en': 'Samples from our successful projects'},
                                                 'title': {'ar': 'أعمالنا', 'en': 'Our Work'}}},
                  'order': 3},
                { 'block_type': 'platform_how_it_works',
                  'content': { 'steps': [ { 'icon': '🎯',
                                            'number': '1',
                                            'translations': { 'desc': { 'ar': 'أخبرنا عن تحدياتك وأهدافك. نحلّل '
                                                                              'احتياجاتك بدقة ونقترح الحل الأمثل الذي '
                                                                              'يناسب ميزانيتك.',
                                                                        'en': 'Browse our services and pick what suits '
                                                                              'you'},
                                                              'title': { 'ar': 'استشارة مجانية وتحليل احتياجاتك',
                                                                         'en': 'Choose Your Service'}}},
                                          { 'icon': '📋',
                                            'number': '2',
                                            'translations': { 'desc': { 'ar': 'فريقنا المتخصص يصمم ويطور مشروعك بأحدث '
                                                                              'التقنيات وأفضل الممارسات العالمية.',
                                                                        'en': 'Choose the plan that fits your budget'},
                                                              'title': { 'ar': 'تصميم وتطوير بأحدث التقنيات',
                                                                         'en': 'Pick a Plan'}}},
                                          { 'icon': '🚀',
                                            'number': '3',
                                            'translations': { 'desc': { 'ar': 'نطلق مشروعك بضمان الأداء المثالي ونبقى '
                                                                              'بجانبك بدعم فني متواصل على مدار الساعة.',
                                                                        'en': 'Start using the service right away'},
                                                              'title': { 'ar': 'إطلاق مضمون ودعم مستمر',
                                                                         'en': 'Start Immediately'}}}],
                               'translations': { 'subtitle': { 'ar': 'ثلاث خطوات بسيطة تأخذك من الفكرة إلى تحقيق نتائج '
                                                                     'تفوق توقعاتك',
                                                               'en': 'Three simple steps to get started'},
                                                 'title': {'ar': 'كيف تصل بنا إلى آفاق جديدة؟', 'en': 'How It Works'}}},
                  'order': 4},
                { 'block_type': 'testimonials',
                  'content': { 'columns': 3,
                               'items': [ { 'rating': 5,
                                            'translations': { 'name': {'ar': 'أحمد محمد', 'en': 'Ahmed Mohammed'},
                                                              'role': {'ar': 'مدير شركة', 'en': 'Company Manager'},
                                                              'text': { 'ar': 'خدمة ممتازة ونتائج مبهرة فتحت لي آفاقاً '
                                                                              'جديدة',
                                                                        'en': 'Excellent service with stunning '
                                                                              'results'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'سارة العلي', 'en': 'Sara Al-Ali'},
                                                              'role': {'ar': 'مؤسسة مشروع', 'en': 'Startup Founder'},
                                                              'text': { 'ar': 'أنصح بالتعامل معهم — آفاق النجاح لم تكن '
                                                                              'بهذا الوضوح من قبل',
                                                                        'en': 'Highly recommend working with them'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'خالد الحسن', 'en': 'Khaled Al-Hassan'},
                                                              'role': {'ar': 'رائد أعمال', 'en': 'Entrepreneur'},
                                                              'text': { 'ar': 'أفضل منصة تعاملت معها — فتحت لي آفاقاً '
                                                                              'رقمية لم أكن أتخيلها',
                                                                        'en': "The best platform I've ever used"}}}],
                               'translations': { 'subtitle': { 'ar': 'انضم إلى منفتحو آفاقهم معنا — آلاف المستخدمين '
                                                                     'يحققون نتائج حقيقية',
                                                               'en': "Our clients' feedback speaks about our service "
                                                                     'quality'},
                                                 'title': { 'ar': 'عملاؤنا شهدوا آفاقاً جديدة للنجاح',
                                                            'en': 'What Our Clients Say'}}},
                  'order': 5},
                { 'block_type': 'pricing',
                  'content': { 'columns': 3,
                               'plans': [ { 'badge': '',
                                            'features': ['5 pages', 'Responsive design', 'Tech support'],
                                            'highlighted': False,
                                            'price': '49',
                                            'translations': { 'cta': {'ar': 'ابدأ الآن', 'en': 'Start Now'},
                                                              'name': {'ar': 'أساسي', 'en': 'Basic'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}},
                                          { 'badge': 'Most Popular',
                                            'features': [ 'Unlimited pages',
                                                          'Advanced SEO',
                                                          'Priority support',
                                                          'Analytics'],
                                            'highlighted': True,
                                            'price': '99',
                                            'translations': { 'cta': {'ar': 'ابدأ الآن', 'en': 'Start Now'},
                                                              'name': {'ar': 'احترافي', 'en': 'Pro'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}},
                                          { 'badge': '',
                                            'features': ['All Pro features', 'Custom API', 'Account manager', 'SLA'],
                                            'highlighted': False,
                                            'price': '299',
                                            'translations': { 'cta': {'ar': 'تواصل معنا', 'en': 'Contact Us'},
                                                              'name': {'ar': 'مؤسسات', 'en': 'Enterprise'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}}],
                               'show_badge': True,
                               'translations': { 'subtitle': { 'ar': 'اختر الخطة المناسبة لاحتياجاتك وافتح آفاق النمو '
                                                                     'لمشروعك',
                                                               'en': 'Choose the plan that fits your needs'},
                                                 'title': {'ar': 'خططنا', 'en': 'Our Plans'}}},
                  'order': 6},
                { 'block_type': 'faq',
                  'content': { 'items': [ { 'translations': { 'a': { 'ar': 'نعم، نوفر خطة مجانية مع مزايا أساسية',
                                                                     'en': 'Yes, we offer a free plan with basic '
                                                                           'features'},
                                                              'q': { 'ar': 'هل الخدمة مجانية؟',
                                                                     'en': 'Is the service free?'}}},
                                          { 'translations': { 'a': { 'ar': 'سجل حساباً مجانياً وابدأ فوراً',
                                                                     'en': 'Create a free account and start right '
                                                                           'away'},
                                                              'q': {'ar': 'كيف أبدأ؟', 'en': 'How do I get started?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، يمكنك الإلغاء في أي وقت',
                                                                     'en': 'Yes, you can cancel your subscription at '
                                                                           'any time'},
                                                              'q': { 'ar': 'هل يمكنني الإلغاء؟',
                                                                     'en': 'Can I cancel anytime?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، المنصة تدعم العربية بالكامل',
                                                                     'en': 'Yes, the platform fully supports Arabic'},
                                                              'q': { 'ar': 'هل تدعمون العربية؟',
                                                                     'en': 'Do you support Arabic?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، دعم فني على مدار الساعة',
                                                                     'en': 'Yes, 24/7 technical support is available'},
                                                              'q': { 'ar': 'هل يوجد دعم فني؟',
                                                                     'en': 'Is there technical support?'}}}],
                               'translations': { 'title': { 'ar': 'الأسئلة الشائعة',
                                                            'en': 'Frequently Asked Questions'}}},
                  'order': 7},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': {'ar': 'افتح آفاق نجاحك مجاناً', 'en': 'Sign Up Free Now'},
                                                 'subtitle': { 'ar': 'عملاؤنا شاهدوا آفاقاً جديدة للنمو والنجاح بعد '
                                                                     'استخدام خدماتنا. حان دورك لتشهد الآفاق التي '
                                                                     'تستحقها.',
                                                               'en': 'Join hundreds of satisfied clients'},
                                                 'title': { 'ar': 'لا تضيّع فرصة فتح آفاق جديدة لأعمالك',
                                                            'en': 'Ready to Get Started?'}}},
                  'order': 8}],
    'is_homepage': True,
    'nav_icon': '🏠',
    'nav_order': 0,
    'show_in_nav': True,
    'slug': 'homepage',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'منصة الخدمات الرقمية والتعليم',
                              'meta_title': 'آفاق تكنولوجي — منصة الخدمات الرقمية والتعليم',
                              'title': 'منصة آفاق تكنولوجي'},
                      'en': { 'description': 'Digital services and education platform',
                              'meta_title': 'Afaq Tech — Digital Services & Education Platform',
                              'title': 'Afaq Tech Platform'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'الجداول الذكية',
                                                                         'en': 'Smart Timetables'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'إشعارات واتساب',
                                                                         'en': 'WhatsApp Alerts'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'بوابة أولياء الأمور',
                                                                         'en': 'Parent Portal'}}}],
                               'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_logged_in_link': { 'ar': '/school/dashboard',
                                                                         'en': '/school/dashboard'},
                                                 'cta_logged_in_text': { 'ar': 'الانتقال لساحة العمل',
                                                                         'en': 'Go to Workspace'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'heading': { 'ar': 'آفاق مدرستي — إدارة ذكية وجداول حصص متطورة',
                                                              'en': 'Afaq Madrasti School Management'},
                                                 'secondary_cta': {'ar': 'استكشف الميزات', 'en': 'Explore Features'},
                                                 'secondary_cta_link': {'ar': '#features', 'en': '#features'},
                                                 'subtitle': { 'ar': 'منصة متكاملة لإدارة المدرسية تضم خدمة إعداد '
                                                                     'البرامج الذكية وجداول الحصص، إشعارات واتساب '
                                                                     'الفورية، والإعلانات والتذاكر الإدارية.',
                                                               'en': 'Comprehensive school management platform '
                                                                     'featuring smart timetable creation, instant '
                                                                     'WhatsApp alerts, and administrative ticket '
                                                                     'systems.'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '📅',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'بناء المصفوفة التفاعلية '
                                                                                            '(Matrix Grid)',
                                                                                      'en': 'Interactive matrix grid '
                                                                                            'builder'}}},
                                                        { 'translations': { 'text': { 'ar': 'منع التعارضات الثلاثية '
                                                                                            'الفوري',
                                                                                      'en': 'Triple conflict '
                                                                                            'prevention'}}},
                                                        { 'translations': { 'text': { 'ar': 'المجدول الذكي والتوزيع '
                                                                                            'الآلي',
                                                                                      'en': 'Smart auto-scheduler'}}}],
                                            'translations': { 'desc': { 'ar': 'نظام مصفوفة الجداول المتطور مع منع '
                                                                              'التعارضات الآلي للمعلمين والشعب '
                                                                              'والقاعات.',
                                                                        'en': 'Build timetables via interactive matrix '
                                                                              'grid with automated conflict check.'},
                                                              'title': { 'ar': 'خدمة إعداد البرامج الذكية وجداول الحصص',
                                                                         'en': 'Smart Programs & Timetable Setup'}}},
                                          { 'icon': '👥',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'توزيع الطلاب على الشعب',
                                                                                      'en': 'Section distribution'}}},
                                                        { 'translations': { 'text': { 'ar': 'الكشوفات والتسجيل الشامل',
                                                                                      'en': 'Comprehensive lists'}}},
                                                        { 'translations': { 'text': { 'ar': 'التحويل بررمز أو رقم وطني',
                                                                                      'en': 'Transfer by code/ID'}}}],
                                            'translations': { 'desc': { 'ar': 'إدارة الشعب، تسجيل الطلاب، وتنقلاتهم '
                                                                              'بكل سهولة وكفاءة.',
                                                                        'en': 'Manage sections, student enrollments, '
                                                                              'and seamless transfers.'},
                                                              'title': { 'ar': 'إدارة الشعب والطلاب والتسجيل الشامل',
                                                                         'en': 'Section & Student Management'}}},
                                          { 'icon': '📊',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تسجيل الحضور اليومي',
                                                                                      'en': 'Daily attendance '
                                                                                            'recording'}}},
                                                        { 'translations': { 'text': { 'ar': 'تنبيهات الغياب الآلية',
                                                                                      'en': 'Absence notifications'}}},
                                                        { 'translations': { 'text': { 'ar': 'صلاحيات المعلمين '
                                                                                            'والمديرين',
                                                                                      'en': 'Role-based access'}}}],
                                            'translations': { 'desc': { 'ar': 'رصد الحضور والغياب اليومي وإرسال '
                                                                              'إشعارات السلامة والتنبيهات.',
                                                                        'en': 'Track daily student attendance and '
                                                                              'notify parents automatically.'},
                                                              'title': { 'ar': 'رصد الحضور والغياب الآلي',
                                                                         'en': 'Attendance & Absence Tracking'}}},
                                          { 'icon': '🚨',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تكامل WhatsApp Cloud API',
                                                                                      'en': 'WhatsApp Cloud API'}}},
                                                        { 'translations': { 'text': { 'ar': 'سجلات إرسال مدققة',
                                                                                      'en': 'Audited notification '
                                                                                            'logs'}}},
                                                        { 'translations': { 'text': { 'ar': 'إيصالات قراءة الإعلانات',
                                                                                      'en': 'Read receipts'}}}],
                                            'translations': { 'desc': { 'ar': 'إرسال إشعارات الحضور والغياب والتنبيهات '
                                                                              'الطارئة مباشرة لأولياء الأمور.',
                                                                        'en': 'Send attendance and emergency alerts '
                                                                              'directly to parents via WhatsApp.'},
                                                              'title': { 'ar': 'إشعارات واتساب الفورية للطوارئ',
                                                                         'en': 'Instant WhatsApp Alerts'}}},
                                          { 'icon': '📝',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إعلانات طارئة '
                                                                                            'is_emergency',
                                                                                      'en': 'Emergency '
                                                                                            'announcements'}}},
                                                        { 'translations': { 'text': { 'ar': 'تذاكر استفسار مباشرة',
                                                                                      'en': 'Direct support tickets'}}},
                                                        { 'translations': { 'text': { 'ar': 'مراجعة المرفقات الإدارية',
                                                                                      'en': 'Administrative '
                                                                                            'attachments'}}}],
                                            'translations': { 'desc': { 'ar': 'نشر التعاميم الطارئة ومتابعة تذاكر '
                                                                              'الاستفسارات بين أولياء الأمور '
                                                                              'والمعلمين.',
                                                                        'en': 'Broadcast emergency circulars and '
                                                                              'manage parent-teacher support tickets.'},
                                                              'title': { 'ar': 'الإعلانات والتذاكر الإدارية',
                                                                         'en': 'Announcements & Support Tickets'}}},
                                          { 'icon': '👨\u200d👩\u200d👧\u200d👦',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'ربط أفراد العائلة Family '
                                                                                            'Links',
                                                                                      'en': 'Family links '
                                                                                            'integration'}}},
                                                        { 'translations': { 'text': { 'ar': 'التقارير الأسبوعية للطلاب',
                                                                                      'en': 'Weekly progress '
                                                                                            'summaries'}}},
                                                        { 'translations': { 'text': { 'ar': 'بوابة ولي الأمر المخصصة',
                                                                                      'en': 'Parent portal access'}}}],
                                            'translations': { 'desc': { 'ar': 'ربط العائلات ومتابعة التقارير الأسبوعية '
                                                                              'وسجلات الأداء.',
                                                                        'en': 'Connect family members and monitor '
                                                                              'student weekly progress.'},
                                                              'title': { 'ar': 'بوابة أولياء الأمور والعائلات',
                                                                         'en': 'Parent & Family Portal'}}},
                                          { 'icon': '🏫',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إدارة الأعوام الدراسية',
                                                                                      'en': 'Academic year '
                                                                                            'management'}}},
                                                        { 'translations': { 'text': { 'ar': 'ترفيع سنوي للطلاب',
                                                                                      'en': 'Annual promotion '
                                                                                            'wizard'}}},
                                                        { 'translations': { 'text': { 'ar': 'أرشفة الأعوام السابقة',
                                                                                      'en': 'Archive historical '
                                                                                            'data'}}}],
                                            'translations': { 'desc': { 'ar': 'إدارة الأعوام الدراسية، الأرشيف، '
                                                                              'وعمليات الترفيع السنوي.',
                                                                        'en': 'Manage academic years, archiving, and '
                                                                              'annual student promotion.'},
                                                              'title': { 'ar': 'إدارة الأعوام الدراسية والترفيع السنوي',
                                                                         'en': 'Academic Years & Promotion'}}},
                                          { 'icon': '🎙️',
                                            'link': '/school',
                                            'points': [ { 'translations': { 'text': { 'ar': 'معالجة الصوت STT/TTS',
                                                                                      'en': 'STT / TTS voice '
                                                                                            'processing'}}},
                                                        { 'translations': { 'text': { 'ar': 'إحصائيات ساعات الذروة',
                                                                                      'en': 'Peak hours analytics'}}},
                                                        { 'translations': { 'text': { 'ar': 'المساعد الذكي للتحليلات',
                                                                                      'en': 'AI-powered assistance'}}}],
                                            'translations': { 'desc': { 'ar': 'معالجة الصوت والتحليلات الذكية '
                                                                              'وإحصائيات الاستخدام.',
                                                                        'en': 'Voice processing and advanced platform '
                                                                              'analytics.'},
                                                              'title': { 'ar': 'التحليلات الصوتية والمساعد الذكي',
                                                                         'en': 'Voice Analytics & AI Assistant'}}}],
                               'translations': { 'subtitle': { 'ar': 'ميزات متخصصة مصممة خصيصاً لإدارة المدارس '
                                                                     'والعمليات التعليمية بكفاءة عالية',
                                                               'en': 'Advanced features designed for modern schools '
                                                                     'and administration'},
                                                 'title': { 'ar': 'مميزات نظام آفاق مدرستي',
                                                            'en': 'School Management Features'}}},
                  'order': 1},
                { 'block_type': 'how_it_works',
                  'content': { 'steps': [ { 'icon': '🏫',
                                            'number': '1',
                                            'translations': { 'desc': { 'ar': 'سجل بيانات المدرسة وأضف الشعب والمعلمين',
                                                                        'en': 'Register your school and setup classes '
                                                                              'and teachers'},
                                                              'title': {'ar': 'إعداد المدرسة', 'en': 'School Setup'}}},
                                          { 'icon': '📅',
                                            'number': '2',
                                            'translations': { 'desc': { 'ar': 'توليد الجداول الذكية مع فحص التعارضات '
                                                                              'آلياً',
                                                                        'en': 'Generate intelligent timetables with '
                                                                              'automated conflict check'},
                                                              'title': { 'ar': 'إنشاء الجداول',
                                                                         'en': 'Timetable Generation'}}},
                                          { 'icon': '🚀',
                                            'number': '3',
                                            'translations': { 'desc': { 'ar': 'تواصل مع أولياء الأمور عبر واتساب '
                                                                              'وإدارة التنبيهات',
                                                                        'en': 'Communicate with parents via WhatsApp '
                                                                              'and manage daily alerts'},
                                                              'title': { 'ar': 'الإطلاق والتواصل',
                                                                         'en': 'Launch & Connect'}}}],
                               'translations': { 'subtitle': { 'ar': 'ثلاث خطوات بسيطة لنقل إدارة مدرستك إلى العصر '
                                                                     'الرقمي',
                                                               'en': 'Three steps to digital school management'},
                                                 'title': {'ar': 'كيف يعمل النظام؟', 'en': 'How It Works'}}},
                  'order': 2},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': {'ar': 'ابدأ الآن مجاناً', 'en': 'Get Started Now'},
                                                 'subtitle': { 'ar': 'ارتقِ بإدارة مدرستك ووفر ساعات من العمل اليدوي '
                                                                     'بفضل الحلول الذكية',
                                                               'en': 'Transform your school administration today'},
                                                 'title': { 'ar': 'جاهز لتطوير إدارة مدرستك؟',
                                                            'en': 'Ready to Modernize Your School?'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_icon': '🏫',
    'nav_order': 1,
    'show_in_nav': True,
    'slug': 'school',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'منصة آفاق مدرستي لإدارة المدارس وجداول الحصص ومتابعة الطلاب',
                              'meta_title': 'آفاق مدرستي — إدارة المدارس والبرامج الذكية',
                              'title': 'آفاق مدرستي'},
                      'en': { 'description': 'Afaq Madrasti: school management and daily follow-up',
                              'meta_title': 'Afaq Madrasti — School Management & Timetables',
                              'title': 'Afaq Madrasti'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'translations': { 'cta_link': {'ar': '/school/fees', 'en': '/school/fees'},
                                                'cta_text': {'ar': 'إدارة الرسوم', 'en': 'Manage Fees'},
                                                'heading': { 'ar': 'نظام الرسوم والذمم المالية',
                                                             'en': 'School Fees & Billing Ledger'},
                                                'subtitle': { 'ar': 'إدارة الفواتير والرسوم والمدفوعات بكفاءة عالية',
                                                              'en': 'Efficient billing and school fee ledger management'}}},
                  'order': 0}],
    'is_homepage': False,
    'nav_icon': '💰',
    'nav_order': 2,
    'show_in_nav': False,
    'slug': 'school/fees',
    'template': 'default',
    'translations': { 'ar': { 'description': 'إدارة الرسوم والذمم المالية والفواتير المدرسية',
                              'meta_title': 'الرسوم المدرسية — آفاق تكنولوجي',
                              'title': 'الرسوم المدرسية'},
                      'en': { 'description': 'School fees and billing management ledger',
                              'meta_title': 'School Fees — Afaq Tech',
                              'title': 'School Fees'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'translations': { 'cta_link': {'ar': '/school/transport', 'en': '/school/transport'},
                                                'cta_text': {'ar': 'إدارة النقل', 'en': 'Manage Transport'},
                                                'heading': { 'ar': 'إدارة النقل المدرسي والحافلات',
                                                             'en': 'School Transport & Bus Management'},
                                                'subtitle': { 'ar': 'تتبع الحافلات والخطوط وخطوط سير الطلاب بكل دقة',
                                                              'en': 'Track school buses, routes, and student assignments'}}},
                  'order': 0}],
    'is_homepage': False,
    'nav_icon': '🚌',
    'nav_order': 3,
    'show_in_nav': False,
    'slug': 'school/transport',
    'template': 'default',
    'translations': { 'ar': { 'description': 'إدارة النقل المدرسي والحافلات وخطوط السير',
                              'meta_title': 'النقل المدرسي — آفاق تكنولوجي',
                              'title': 'النقل المدرسي'},
                      'en': { 'description': 'School transport and bus management system',
                              'meta_title': 'School Transport — Afaq Tech',
                              'title': 'School Transport'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'محتوى مجاني', 'en': 'Free Content'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'شهادات معتمدة',
                                                                         'en': 'Certified Courses'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'تعلم بالسرعة',
                                                                         'en': 'Learn at Your Pace'}}}],
                               'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابدأ التعلم', 'en': 'Start Learning'},
                                                 'heading': { 'ar': 'آفاق معرفية لا حدود لها',
                                                              'en': 'Learn Smart with Afaq Academy'},
                                                 'subtitle': { 'ar': 'استكشف آفاق المعرفة مع مكتبة شاملة تضم المواد '
                                                                     'والمناهج والمحتوى التعليمي لكل المراحل الدراسية',
                                                               'en': 'An AI-powered education platform'}}},
                  'order': 0},
                { 'block_type': 'stats',
                  'content': { 'items': [ { 'translations': {'label': {'ar': 'دورة تعليمية', 'en': 'Courses'}},
                                            'value': '50+'},
                                          { 'translations': {'label': {'ar': 'طالب', 'en': 'Students'}},
                                            'value': '1000+'},
                                          { 'translations': {'label': {'ar': 'مدرس خبير', 'en': 'Expert Instructors'}},
                                            'value': '20+'},
                                          { 'translations': {'label': {'ar': 'نسبة الرضا', 'en': 'Satisfaction Rate'}},
                                            'value': '95%'}]},
                  'order': 1},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🤖',
                                            'link': '/blog/ai-education-arab-world',
                                            'points': [ { 'translations': { 'text': { 'ar': 'مناهج متوافقة مع المناهج '
                                                                                            'الرسمية',
                                                                                      'en': 'Curricula aligned with '
                                                                                            'official systems'}}},
                                                        { 'translations': { 'text': { 'ar': 'محتوى منظم حسب المادة '
                                                                                            'والمستوى',
                                                                                      'en': 'Content organized by '
                                                                                            'subject & level'}}},
                                                        { 'translations': { 'text': { 'ar': 'محتوى محدّث من معلمين '
                                                                                            'متخصصين',
                                                                                      'en': 'Updated by expert '
                                                                                            'teachers'}}}],
                                            'translations': { 'desc': { 'ar': 'مساعد ذكي يتعلم أسلوبك ويفتح لك آفاقاً '
                                                                              'مخصصة لتعلمك',
                                                                        'en': 'Smart assistant that learns your style'},
                                                              'title': { 'ar': 'تعلم بالذكاء الاصطناعي',
                                                                         'en': 'AI-Powered Learning'}}},
                                          { 'icon': '📊',
                                            'link': '/blog/ai-education-arab-world',
                                            'points': [ { 'translations': { 'text': { 'ar': 'توليد خطة درس في 30 ثانية',
                                                                                      'en': 'Generate lesson plans in '
                                                                                            '30 seconds'}}},
                                                        { 'translations': { 'text': { 'ar': 'مخصصة حسب أسلوبك ومنهجك',
                                                                                      'en': 'Customized to your style '
                                                                                            '& curriculum'}}},
                                                        { 'translations': { 'text': { 'ar': 'تصدير فوري ومشاركة سريعة',
                                                                                      'en': 'Instant export & '
                                                                                            'sharing'}}}],
                                            'translations': { 'desc': { 'ar': 'تابع تقدمك بأدوات تحليلية تفتح آفاقاً '
                                                                              'واضحة لأدائك',
                                                                        'en': 'Track your progress with analytics '
                                                                              'tools'},
                                                              'title': { 'ar': 'تتبع التقدم',
                                                                         'en': 'Progress Tracking'}}},
                                          { 'icon': '🎯',
                                            'link': '/blog/ai-education-arab-world',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إجابة فورية لأي سؤال',
                                                                                      'en': 'Instant answers to any '
                                                                                            'question'}}},
                                                        { 'translations': { 'text': { 'ar': 'اقتراحات استراتيجية '
                                                                                            'لأسلوبك',
                                                                                      'en': 'Strategy suggestions for '
                                                                                            'your style'}}},
                                                        { 'translations': { 'text': { 'ar': 'يدعم 9 لغات بالعربية',
                                                                                      'en': 'Supports 9 languages '
                                                                                            'including Arabic'}}}],
                                            'translations': { 'desc': { 'ar': 'مسارات تعلم مصممة لك تفتح آفاق التعلم '
                                                                              'المخصص',
                                                                        'en': 'Learning paths designed for you'},
                                                              'title': {'ar': 'مسارات مخصصة', 'en': 'Custom Paths'}}},
                                          { 'icon': '🏆',
                                            'translations': { 'desc': { 'ar': 'احصل على شهادات معتمدة تفتح آفاقاً '
                                                                              'جديدة لمسارك المهني',
                                                                        'en': 'Get certified upon completion'},
                                                              'title': {'ar': 'شهادات', 'en': 'Certificates'}}},
                                          { 'icon': '📱',
                                            'translations': { 'desc': { 'ar': 'تطبيق متكامل للهاتف يفتح لك آفاق التعلم '
                                                                              'في أي مكان',
                                                                        'en': 'Fully integrated mobile app'},
                                                              'title': { 'ar': 'تعلم في أي مكان',
                                                                         'en': 'Learn Anywhere'}}},
                                          { 'icon': '💬',
                                            'translations': { 'desc': { 'ar': 'تفاعل مع المتعلمين وافتح آفاقاً جديدة '
                                                                              'من التعاون والمعرفة',
                                                                        'en': 'Engage with fellow learners'},
                                                              'title': { 'ar': 'مجتمع تفاعلي',
                                                                         'en': 'Interactive Community'}}}],
                               'translations': { 'subtitle': { 'ar': 'لأننا لا نقدم مجرد خدمات — نفتح أمامك آفاقاً '
                                                                     'جديدة للنمو والتميز والنجاح المستدام',
                                                               'en': 'Features that make learning unique'},
                                                 'title': { 'ar': 'لماذا آفاق تكنولوجي تفتح لك آفاقاً مختلفة؟',
                                                            'en': 'Why Afaq Academy?'}}},
                  'order': 2},
                { 'block_type': 'how_it_works',
                  'content': { 'steps': [ { 'icon': '📝',
                                            'number': '1',
                                            'translations': { 'desc': { 'ar': 'حدد الصف والمادة والمنهج المناسبين '
                                                                              'لاحتياجاتك — سهولة تامة بدون تعقيد',
                                                                        'en': 'Create your account in seconds'},
                                                              'title': { 'ar': 'اختر المادة والمنهج',
                                                                         'en': 'Sign Up Free'}}},
                                          { 'icon': '🎯',
                                            'number': '2',
                                            'translations': { 'desc': { 'ar': 'أدخل موضوع الدرس والأهداف التعليمية — '
                                                                              'دقائق معدودة تفصّل لك كل شيء',
                                                                        'en': 'Pick the subject or path that suits '
                                                                              'you'},
                                                              'title': { 'ar': 'اكتب وصف الدرس باختصار',
                                                                         'en': 'Choose Your Path'}}},
                                          { 'icon': '🚀',
                                            'number': '3',
                                            'translations': { 'desc': { 'ar': 'يولّد الذكاء الاصطناعي خطة درس كاملة '
                                                                              'ومفصلة جاهزة للتطبيق في الفصل فوراً',
                                                                        'en': 'Explore the educational content'},
                                                              'title': { 'ar': 'استلم خطتك الاحترافية',
                                                                         'en': 'Start Learning'}}}],
                               'translations': { 'subtitle': { 'ar': 'لا تحتاج لخبرة تقنية — فقط اتبع الخطوات واترك '
                                                                     'الباقي علينا',
                                                               'en': 'Three steps to begin your learning journey'},
                                                 'title': {'ar': 'كيف تبدأ في 3 خطوات؟', 'en': 'How to Start?'}}},
                  'order': 3},
                { 'block_type': 'demo',
                  'content': { 'show_browser_frame': True,
                               'translations': { 'subtitle': { 'ar': 'اكتشف كيف تعمل منصتنا التعليمية',
                                                               'en': 'Discover how our education platform works'},
                                                 'title': {'ar': 'جولة في الأكاديمية', 'en': 'Tour the Academy'}}},
                  'order': 4},
                { 'block_type': 'testimonials',
                  'content': { 'columns': 3,
                               'items': [ { 'rating': 5,
                                            'translations': { 'name': {'ar': 'محمد الراشد', 'en': 'Nora Al-Khatib'},
                                                              'role': { 'ar': 'معلم رياضيات',
                                                                        'en': 'Engineering Student'},
                                                              'text': { 'ar': 'وفّرت علي المنصة ساعات من التحضير. '
                                                                              'الذكاء الاصطناعي يولّد خطط دروس مفصلة '
                                                                              'وإبداعية ومتوافقة تماماً مع المنهج.',
                                                                        'en': 'The academy completely changed the way '
                                                                              'I learn'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'عائشة عبدالله', 'en': 'Omar Al-Saeed'},
                                                              'role': {'ar': 'معلمة علوم', 'en': 'Software Developer'},
                                                              'text': { 'ar': 'الأكاديمية شاملة ومنظمة بشكل رائع. '
                                                                              'طلابي يحبون النهج المنسق وأنا أحب سهولة '
                                                                              'العثور على المواد.',
                                                                        'en': 'Outstanding content and clear '
                                                                              'explanations'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'فاطمة الحربي', 'en': 'Reem Abdulrahman'},
                                                              'role': {'ar': 'مديرة مدرسة', 'en': 'Designer'},
                                                              'text': { 'ar': 'كمديرة مدرسة، حسابات المعلمين المتعددة '
                                                                              'وتقارير الأداء كانت نقطة تحول لإدارتنا.',
                                                                        'en': "The best education platform I've "
                                                                              'used'}}}],
                               'translations': { 'subtitle': { 'ar': 'انضم إلى منفتحو آفاقهم معنا — آلاف المستخدمين '
                                                                     'يحققون نتائج حقيقية',
                                                               'en': 'Real experiences from students who learned with '
                                                                     'us'},
                                                 'title': { 'ar': 'عملاؤنا شهدوا آفاقاً جديدة للنجاح',
                                                            'en': 'Student Success Stories'}}},
                  'order': 5},
                { 'block_type': 'pricing',
                  'content': { 'columns': 3,
                               'plans': [ { 'badge': '',
                                            'features': ['3 courses', 'Basic content', 'Community'],
                                            'highlighted': False,
                                            'price': '0',
                                            'translations': { 'cta': {'ar': 'ابدأ مجاناً', 'en': 'Start Free'},
                                                              'name': {'ar': 'مجاني', 'en': 'Free'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}},
                                          { 'badge': 'Most Popular',
                                            'features': [ 'Unlimited courses',
                                                          'AI assistant',
                                                          'Certificates',
                                                          'Support'],
                                            'highlighted': True,
                                            'price': '29',
                                            'translations': { 'cta': {'ar': 'اشترك الآن', 'en': 'Subscribe Now'},
                                                              'name': {'ar': 'طالب', 'en': 'Student'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}},
                                          { 'badge': '',
                                            'features': [ 'All Student features',
                                                          'Exclusive content',
                                                          'Live sessions',
                                                          'Custom paths'],
                                            'highlighted': False,
                                            'price': '79',
                                            'translations': { 'cta': {'ar': 'اشترك الآن', 'en': 'Subscribe Now'},
                                                              'name': {'ar': 'احترافي', 'en': 'Pro'},
                                                              'period': {'ar': '/شهرياً', 'en': '/month'}}}],
                               'show_badge': True,
                               'translations': { 'subtitle': { 'ar': 'اختر الخطة المناسبة لتعلمك',
                                                               'en': 'Choose the plan that suits your learning'},
                                                 'title': {'ar': 'خطط الاشتراك', 'en': 'Subscription Plans'}}},
                  'order': 6},
                { 'block_type': 'faq',
                  'content': { 'items': [ { 'translations': { 'a': { 'ar': 'نعم، هناك دورات مجانية ودورات مدفوعة',
                                                                     'en': 'Yes, there are free and paid courses'},
                                                              'q': { 'ar': 'هل الدورات مجانية؟',
                                                                     'en': 'Are the courses free?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، شهادات معتمدة بعد إتمام الدورة',
                                                                     'en': 'Yes, certified certificates upon course '
                                                                           'completion'},
                                                              'q': { 'ar': 'هل أحصل على شهادة؟',
                                                                     'en': 'Will I get a certificate?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، المنصة متوافقة مع جميع الأجهزة',
                                                                     'en': 'Yes, the platform is compatible with all '
                                                                           'devices'},
                                                              'q': { 'ar': 'هل يمكنني التعلم من الهاتف؟',
                                                                     'en': 'Can I learn on mobile?'}}},
                                          { 'translations': { 'a': { 'ar': 'نعم، دعم فني على مدار الساعة',
                                                                     'en': 'Yes, 24/7 technical support is available'},
                                                              'q': { 'ar': 'هل يوجد دعم فني؟',
                                                                     'en': 'Is there technical support?'}}},
                                          { 'translations': { 'a': { 'ar': 'يتعلم أسلوبك ويوصي بالمحتوى المناسب',
                                                                     'en': 'It learns your style and recommends '
                                                                           'suitable content'},
                                                              'q': { 'ar': 'كيف يعمل الذكاء الاصطناعي؟',
                                                                     'en': 'How does AI work?'}}}],
                               'translations': { 'title': { 'ar': 'الأسئلة الشائعة',
                                                            'en': 'Frequently Asked Questions'}}},
                  'order': 7},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': {'ar': 'افتح آفاق نجاحك مجاناً', 'en': 'Sign Up Free Now'},
                                                 'subtitle': { 'ar': 'عملاؤنا شاهدوا آفاقاً جديدة للنمو والنجاح بعد '
                                                                     'استخدام خدماتنا. حان دورك لتشهد الآفاق التي '
                                                                     'تستحقها.',
                                                               'en': 'Sign up free and get instant access to courses'},
                                                 'title': { 'ar': 'لا تضيّع فرصة فتح آفاق معرفية جديدة',
                                                            'en': 'Start Your Learning Journey Today'}}},
                  'order': 8}],
    'is_homepage': False,
    'nav_icon': '🎓',
    'nav_order': 1,
    'show_in_nav': True,
    'slug': 'academy',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'منصة التعليم غير الرسمي بالذكاء الاصطناعي',
                              'meta_title': 'أكاديمية آفاق — تعلم بالذكاء الاصطناعي',
                              'title': 'أكاديمية آفاق'},
                      'en': { 'description': 'Non-formal education platform with AI-powered learning',
                              'meta_title': 'Afaq Academy — Learn with AI',
                              'title': 'Afaq Academy'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'المناهج الرسمية',
                                                                         'bn': 'প্রাতিষ্ঠানিক সিলেবাস',
                                                                         'de': 'Offizielle Lehrpläne',
                                                                         'en': 'Formal Syllabi',
                                                                         'es': 'Programas oficiales',
                                                                         'fr': 'Programmes officiels',
                                                                         'id': 'Kurikulum Resmi',
                                                                         'tr': 'Resmi Müfredat',
                                                                         'ur': 'سرکاری نصاب'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'المدرسية والجامعية',
                                                                         'bn': 'স্কুল ও বিশ্ববিদ্যালয়',
                                                                         'de': 'Schule & Universität',
                                                                         'en': 'School & University',
                                                                         'es': 'Escolar y Universitario',
                                                                         'fr': 'Scolaire & Universitaire',
                                                                         'id': 'Sekolah & Universitas',
                                                                         'tr': 'Okul ve Üniversite',
                                                                         'ur': 'اسکول اور یونیورسٹی'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'مدعوم بالذكاء الاصطناعي',
                                                                         'bn': 'AI চালিত',
                                                                         'de': 'KI-gestützt',
                                                                         'en': 'AI Powered',
                                                                         'es': 'Impulsado por IA',
                                                                         'fr': 'Propulsé par IA',
                                                                         'id': 'Didukung AI',
                                                                         'tr': 'Yapay Zeka Destekli',
                                                                         'ur': 'AI سے تقویت یافتہ'}}}],
                               'translations': { 'cta_link': { 'ar': '/lesson-plans/new',
                                                               'bn': '/lesson-plans/new',
                                                               'de': '/lesson-plans/new',
                                                               'en': '/lesson-plans/new',
                                                               'es': '/lesson-plans/new',
                                                               'fr': '/lesson-plans/new',
                                                               'id': '/lesson-plans/new',
                                                               'tr': '/lesson-plans/new',
                                                               'ur': '/lesson-plans/new'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': { 'ar': 'ابدأ بتوليد خطة درس',
                                                               'bn': 'পাঠ পরিকল্পনা তৈরি করুন',
                                                               'de': 'Unterrichtsplan erstellen',
                                                               'en': 'Generate Lesson Plan',
                                                               'es': 'Generar plan',
                                                               'fr': 'Générer une leçon',
                                                               'id': 'Buat Rencana Pelajaran',
                                                               'tr': 'Ders Planı Oluştur',
                                                               'ur': 'سبق کا منصوبہ بنائیں'},
                                                 'heading': { 'ar': 'المناهج الدراسية وميزات المنصة الذكية',
                                                              'bn': 'একাডেমিক কারriculum এবং AI বৈশিষ্ট্য',
                                                              'de': 'Lehrpläne & Erweiterte KI-Funktionen',
                                                              'en': 'Academic Curricula & Advanced AI Features',
                                                              'es': 'Currículos y Funciones Avanzadas de IA',
                                                              'fr': 'Curricula & Fonctionnalités IA',
                                                              'id': 'Kurikulum Akademik & Fitur AI',
                                                              'tr': 'Akademik Müfredat ve Yapay Zeka Özellikleri',
                                                              'ur': 'تعلیمی نصاب اور AI خصوصیات'},
                                                 'secondary_cta': { 'ar': 'رفع ملفات المناهج',
                                                                    'bn': 'কারriculum আপলোড করুন',
                                                                    'de': 'Lehrplan hochladen',
                                                                    'en': 'Upload Curriculum',
                                                                    'es': 'Subir currículo',
                                                                    'fr': 'Télécharger le curriculum',
                                                                    'id': 'Unggah Kurikulum',
                                                                    'tr': 'Müfredat Yükle',
                                                                    'ur': 'نصاب اپ لوڈ کریں'},
                                                 'secondary_cta_link': { 'ar': '/admin/curricula',
                                                                         'bn': '/admin/curricula',
                                                                         'de': '/admin/curricula',
                                                                         'en': '/admin/curricula',
                                                                         'es': '/admin/curricula',
                                                                         'fr': '/admin/curricula',
                                                                         'id': '/admin/curricula',
                                                                         'tr': '/admin/curricula',
                                                                         'ur': '/admin/curricula'},
                                                 'subtitle': { 'ar': 'من المرحلة الأساسية حتى السنوات الجامعية، مع دعم '
                                                                     'كافة المناهج الرسمية وجميع ميزات المنصة الـ 8 '
                                                                     'المتقدمة لتسهيل وتطوير العملية التعليمية.',
                                                               'bn': 'প্রাথমিক বিদ্যালয় থেকে বিশ্ববিদ্যালয় পর্যন্ত '
                                                                     'সমস্ত উন্নত বৈশিষ্ট্য সহ।',
                                                               'de': 'Von der Grundschule bis zur Universität mit '
                                                                     'allen erweiterten Funktionen.',
                                                               'en': 'From primary school to university, supporting '
                                                                     'formal curricula with all 8 advanced platform '
                                                                     'features',
                                                               'es': 'Desde la escuela primaria hasta la universidad, '
                                                                     'con todas las funciones avanzadas.',
                                                               'fr': "De l'école primaire à l'université, prenant en "
                                                                     'charge les programmes officiels avec toutes les '
                                                                     'fonctionnalités.',
                                                               'id': 'Dari sekolah dasar hingga universitas dengan '
                                                                     'semua fitur canggih.',
                                                               'tr': 'İlkokuldan üniversiteye tüm resmi müfredat ve '
                                                                     'platform özellikleri.',
                                                               'ur': 'پرائمری اسکول سے لے کر یونیورسٹی تک تمام خصوصیات '
                                                                     'کے ساتھ۔'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '📚',
                                            'link': '/lesson-plans/new',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إرفاق وثائق المنهاج',
                                                                                      'en': 'Attach curriculum '
                                                                                            'documents'}}},
                                                        { 'translations': { 'text': { 'ar': 'توليد سياقي ذكي',
                                                                                      'en': 'Smart context '
                                                                                            'generation'}}},
                                                        { 'translations': { 'text': { 'ar': 'دعم ملفات PDF و TXT',
                                                                                      'en': 'PDF / TXT support'}}}],
                                            'translations': { 'desc': { 'ar': 'إمكانية رفع ملفات المناهج والكتب '
                                                                              'المقررة بشكل اختياري داخل الفورم لتوجيه '
                                                                              'الذكاء الاصطناعي بدقة.',
                                                                        'en': 'Optionally upload curriculum documents '
                                                                              'and textbooks to feed AI with precise '
                                                                              'context'},
                                                              'title': { 'ar': 'إرفاق وتغذية المنهاج (اختياري)',
                                                                         'en': 'Curriculum Material Attachment'}}},
                                          { 'icon': '💡',
                                            'link': '/lesson-plans/new',
                                            'points': [ { 'translations': { 'text': { 'ar': 'قوالب مقترحات سريعة',
                                                                                      'en': 'Quick prompt templates'}}},
                                                        { 'translations': { 'text': { 'ar': 'مقترحات حسب المادة',
                                                                                      'en': 'Subject-based prompts'}}},
                                                        { 'translations': { 'text': { 'ar': 'أفكار بضغطة زر',
                                                                                      'en': 'One-click ideas'}}}],
                                            'translations': { 'desc': { 'ar': 'تقديم اقتراحات ومواضيع سريعة وذكية '
                                                                              'للمدرسين بناءً على المادة والمرحلة.',
                                                                        'en': 'Smart quick prompt suggestions based on '
                                                                              'subject and grade'},
                                                              'title': { 'ar': 'اقتراحات المواضيع الذكية',
                                                                         'en': 'Smart Prompt Suggestions'}}},
                                          { 'icon': '📥',
                                            'link': '/lesson-plans',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تصدير PDF و Word',
                                                                                      'en': 'PDF / Word export'}}},
                                                        { 'translations': { 'text': { 'ar': 'نسخة جاهزة للطباعة',
                                                                                      'en': 'Print ready format'}}},
                                                        { 'translations': { 'text': { 'ar': 'تنسيق احترافي',
                                                                                      'en': 'Professional layout'}}}],
                                            'translations': { 'desc': { 'ar': 'تصدير احترافي للخطط بصيغ PDF و Word '
                                                                              'وجاهزية كاملة للطباعة والتسليم.',
                                                                        'en': 'Advanced export options for lesson '
                                                                              'plans in PDF and Word formats'},
                                                              'title': { 'ar': 'التصدير المتقدم (PDF/Word)',
                                                                         'en': 'Advanced Export'}}},
                                          { 'icon': '💬',
                                            'link': '/lesson-plans',
                                            'points': [ { 'translations': { 'text': { 'ar': 'محادثة تفاعلية بالذكاء '
                                                                                            'الاصطناعي',
                                                                                      'en': 'Interactive AI chat'}}},
                                                        { 'translations': { 'text': { 'ar': 'تعديل الخطة مباشرة',
                                                                                      'en': 'Refine plan on the fly'}}},
                                                        { 'translations': { 'text': { 'ar': 'حفظ سجل التعديلات',
                                                                                      'en': 'Saved revision '
                                                                                            'history'}}}],
                                            'translations': { 'desc': { 'ar': 'نافذة محادثة تفاعلية مع الذكاء '
                                                                              'الاصطناعي لتطوير وتعديل تفاصيل الخطة '
                                                                              'بسلاسة.',
                                                                        'en': 'Chat with AI to refine and modify '
                                                                              'lesson plans interactively after '
                                                                              'generation'},
                                                              'title': { 'ar': 'محادثة التحسين التفاعلية',
                                                                         'en': 'Interactive AI Refinement Chat'}}},
                                          { 'icon': '🌐',
                                            'link': '/lesson-plans/marketplace',
                                            'points': [ { 'translations': { 'text': { 'ar': 'مشاركة عامة بين المعلمين',
                                                                                      'en': 'Public teacher sharing'}}},
                                                        { 'translations': { 'text': { 'ar': 'استنساخ بضغطة زر',
                                                                                      'en': 'One-click cloning'}}},
                                                        { 'translations': { 'text': { 'ar': 'إعجابات وتقييمات',
                                                                                      'en': 'Ratings and likes'}}}],
                                            'translations': { 'desc': { 'ar': 'سوق تشاركي لخطط الدروس، تمكين المعلمين '
                                                                              'من النشر والاستنساخ والتقييم.',
                                                                        'en': 'Share lesson plans publicly, clone '
                                                                              'community plans, and rate favorites'},
                                                              'title': { 'ar': 'مكتبة الخطط التشاركية',
                                                                         'en': 'Community Plan Marketplace'}}},
                                          { 'icon': '🏆',
                                            'link': '/profile',
                                            'points': [ { 'translations': { 'text': { 'ar': 'نظام النقاط للمعلمين',
                                                                                      'en': 'Teacher points system'}}},
                                                        { 'translations': { 'text': { 'ar': 'أوسمة وشارات إنجاز',
                                                                                      'en': 'Achievement badges'}}},
                                                        { 'translations': { 'text': { 'ar': 'إحصاءات الأنشطة',
                                                                                      'en': 'Activity statistics'}}}],
                                            'translations': { 'desc': { 'ar': 'تحفيز المعلمين بنقاط تفاعلية، أوسمة '
                                                                              'إنجاز، وإحصاءات عند الإنشاء والمشاركة.',
                                                                        'en': 'Reward educators with points, badges, '
                                                                              'and stats for contributing'},
                                                              'title': { 'ar': 'نظام التحفيز والشارات',
                                                                         'en': 'Gamification for Educators'}}}],
                               'translations': { 'subtitle': { 'ar': 'أدوات متقدمة مصممة خصيصاً للمعلمين لتخطيط '
                                                                     'المناهج والدروس بكفاءة عالية',
                                                               'en': 'Advanced teacher tools for curriculum lesson '
                                                                     'planning'},
                                                 'title': { 'ar': 'أدوات المعلم وتخطيط المناهج',
                                                            'en': 'Teacher & Curriculum Tools'}}},
                  'order': 1},
                { 'block_type': 'grade_showcase',
                  'content': { 'columns': 3,
                               'grades': [ { 'count': 6,
                                             'icon': '📖',
                                             'translations': { 'desc': { 'ar': 'من الصف الأول إلى السادس — آفاق '
                                                                               'المعرفة تبدأ هنا',
                                                                         'en': 'From 1st to 6th grade'},
                                                               'name': { 'ar': 'المرحلة الابتدائية',
                                                                         'en': 'Primary School'}}},
                                           { 'count': 3,
                                             'icon': '📘',
                                             'translations': { 'desc': { 'ar': 'من الصف السابع إلى التاسع — توسع آفاقك '
                                                                               'نحو التخصص',
                                                                         'en': 'From 7th to 9th grade'},
                                                               'name': { 'ar': 'المرحلة الإعدادية',
                                                                         'en': 'Middle School'}}},
                                           { 'count': 3,
                                             'icon': '🎓',
                                             'translations': { 'desc': { 'ar': 'من الصف العاشر إلى الثاني عشر — افتح '
                                                                               'آفاق التميز الأكاديمي',
                                                                         'en': 'From 10th to 12th grade'},
                                                               'name': { 'ar': 'المرحلة الثانوية',
                                                                         'en': 'High School'}}}],
                               'translations': { 'subtitle': { 'ar': 'اختر مرحلتك الدراسية وافتح آفاق التعلم المتخصص',
                                                               'en': 'Choose your academic level'},
                                                 'title': {'ar': 'آفاق المراحل الدراسية', 'en': 'Academic Levels'}}},
                  'order': 1},
                { 'block_type': 'subjects_grid',
                  'content': { 'columns': 4,
                               'subjects': [ { 'icon': '🔢',
                                               'translations': {'name': {'ar': 'الرياضيات', 'en': 'Mathematics'}}},
                                             {'icon': '🔬', 'translations': {'name': {'ar': 'العلوم', 'en': 'Science'}}},
                                             { 'icon': '📖',
                                               'translations': { 'name': { 'ar': 'اللغة العربية',
                                                                           'en': 'Arabic Language'}}},
                                             { 'icon': '🌐',
                                               'translations': { 'name': { 'ar': 'اللغة الإنجليزية',
                                                                           'en': 'English Language'}}},
                                             { 'icon': '⚛️',
                                               'translations': {'name': {'ar': 'الفيزياء', 'en': 'Physics'}}},
                                             { 'icon': '🧪',
                                               'translations': {'name': {'ar': 'الكيمياء', 'en': 'Chemistry'}}},
                                             { 'icon': '📜',
                                               'translations': {'name': {'ar': 'التاريخ', 'en': 'History'}}},
                                             { 'icon': '🌍',
                                               'translations': {'name': {'ar': 'الجغرافيا', 'en': 'Geography'}}}],
                               'translations': { 'subtitle': { 'ar': 'مواد متنوعة تغطي جميع التخصصات وتفتح آفاق '
                                                                     'المعرفة الشاملة',
                                                               'en': 'Diverse subjects covering all disciplines'},
                                                 'title': {'ar': 'آفاق المواد الدراسية', 'en': 'Subjects'}}},
                  'order': 2},
                { 'block_type': 'partners',
                  'content': { 'partners': [ { 'logo': '',
                                               'translations': { 'name': { 'ar': 'وزارة التعليم',
                                                                           'en': 'Ministry of Education'}}},
                                             { 'logo': '',
                                               'translations': { 'name': { 'ar': 'جامعة الملك سعود',
                                                                           'en': 'King Saud University'}}},
                                             { 'logo': '',
                                               'translations': {'name': {'ar': 'أكاديمية MIT', 'en': 'MIT Academy'}}},
                                             { 'logo': '',
                                               'translations': {'name': {'ar': 'اليونسكو', 'en': 'UNESCO'}}}],
                               'translations': { 'title': { 'ar': 'شركاؤنا يفتحون معنا آفاق التعليم',
                                                            'en': 'Our Education Partners'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_icon': '📚',
    'nav_order': 2,
    'show_in_nav': True,
    'slug': 'curriculum',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'دعم المناهج الدراسية المدرسية والجامعية',
                              'meta_title': 'المنهاج الدراسي — دعم المنهج المدرسي والجامعي',
                              'title': 'المنهاج الدراسي'},
                      'en': { 'description': 'School and university curriculum support',
                              'meta_title': 'Academic Curriculum — School & University Support',
                              'title': 'Academic Curriculum'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'منصة موثوقة', 'en': 'Trusted Platform'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': '9 لغات', 'en': '9 Languages'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'دعم مستمر', 'en': '24/7 Support'}}}],
                               'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'heading': { 'ar': 'نفتح آفاقاً جديدة لأعمالك',
                                                              'en': 'We Open New Horizons for Your Business'},
                                                 'subtitle': { 'ar': 'آفاق تكنولوجي منصة رقمية تقدّم حلولاً ذكية '
                                                                     'وتعليم متخصص لفتح آفاق النجاح والتميز لأعمالك',
                                                               'en': 'Afaq Tech is a digital platform that provides '
                                                                     'smart solutions and education to help you '
                                                                     'succeed'}}},
                  'order': 0},
                { 'block_type': 'stats',
                  'content': { 'items': [ { 'translations': {'label': {'ar': 'مشروع منجز', 'en': 'Projects Completed'}},
                                            'value': '150+'},
                                          { 'translations': {'label': {'ar': 'عميل سعيد', 'en': 'Happy Clients'}},
                                            'value': '500+'},
                                          { 'translations': { 'label': { 'ar': 'خدمة متخصصة',
                                                                         'en': 'Specialized Services'}},
                                            'value': '8'},
                                          { 'translations': { 'label': { 'ar': 'لغة مدعومة',
                                                                         'en': 'Languages Supported'}},
                                            'value': '9'}]},
                  'order': 1},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🎯',
                                            'translations': { 'desc': { 'ar': 'نحلّل احتياجاتك ونصمم استراتيجيات مخصصة '
                                                                              'تفتح آفاق النمو لمشروعك',
                                                                        'en': 'We analyze your needs and craft '
                                                                              'tailored strategies'},
                                                              'title': { 'ar': 'رؤية استراتيجية',
                                                                         'en': 'Strategic Vision'}}},
                                          { 'icon': '💡',
                                            'translations': { 'desc': { 'ar': 'نستخدم أحدث التقنيات وأفضل الممارسات '
                                                                              'لفتح آفاق رقمية مبتكرة',
                                                                        'en': 'We use the latest technologies and best '
                                                                              'practices'},
                                                              'title': { 'ar': 'الابتكار أولاً',
                                                                         'en': 'Innovation First'}}},
                                          { 'icon': '🤝',
                                            'translations': { 'desc': { 'ar': 'نبني علاقات طويلة المدى مع عملائنا '
                                                                              'ونرافقهم في رحلة فتح آفاق جديدة',
                                                                        'en': 'We build long-term relationships with '
                                                                              'our clients'},
                                                              'title': { 'ar': 'شراكة موثوقة',
                                                                         'en': 'Trusted Partnership'}}}],
                               'translations': { 'subtitle': { 'ar': 'لا نقدم مجرد خدمات — نفتح أمامك آفاقاً جديدة '
                                                                     'للنمو والتميز والنجاح المستدام',
                                                               'en': "We don't just provide services — we open new "
                                                                     'horizons for your success'},
                                                 'title': { 'ar': 'لماذا تختار آفاق تكنولوجي؟',
                                                            'en': 'Why Choose Afaq Tech?'}}},
                  'order': 2},
                { 'block_type': 'partners',
                  'content': { 'partners': [ { 'logo': '',
                                               'translations': { 'name': { 'ar': 'الاتصالات السعودية',
                                                                           'en': 'Saudi Telecom'}}},
                                             { 'logo': '',
                                               'translations': {'name': {'ar': 'مصرف الراجحي', 'en': 'Al Rajhi Bank'}}},
                                             {'logo': '', 'translations': {'name': {'ar': 'سابك', 'en': 'SABIC'}}},
                                             {'logo': '', 'translations': {'name': {'ar': 'نيوم', 'en': 'NEOM'}}},
                                             {'logo': '', 'translations': {'name': {'ar': 'اس تي سي', 'en': 'STC'}}}],
                               'translations': { 'title': { 'ar': 'موثوق به من قبل العلامات التجارية الرائدة',
                                                            'en': 'Trusted By Leading Brands'}}},
                  'order': 3},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': {'ar': 'افتح آفاق نجاحك مجاناً', 'en': 'Start Free Now'},
                                                 'subtitle': { 'ar': 'انضم لمئات العملاء الذين يثقون بآفاق تكنولوجي في '
                                                                     'فتح آفاق النجاح',
                                                               'en': 'Join hundreds of clients who trust Afaq Tech'},
                                                 'title': { 'ar': 'جاهز لفتح آفاق جديدة لأعمالك؟',
                                                            'en': 'Ready to Open New Horizons?'}}},
                  'order': 4}],
    'is_homepage': False,
    'nav_icon': 'ℹ️',
    'nav_order': 3,
    'show_in_nav': True,
    'slug': 'about',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'تعرّف على رؤيتنا ورسالتنا',
                              'meta_title': 'من نحن — منصة آفاق تكنولوجي',
                              'title': 'عن آفاق تكنولوجي'},
                      'en': { 'description': 'Learn about our mission and vision',
                              'meta_title': 'About Us — Afaq Tech Platform',
                              'title': 'About Afaq Tech'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'استشارة مجانية',
                                                                         'en': 'Free Consultation'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'رد خلال 24 ساعة',
                                                                         'en': 'Response Within 24h'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': '9 دول', 'en': '9 Countries'}}}],
                               'translations': { 'cta_link': { 'ar': 'mailto:info@afaq.app',
                                                               'en': 'mailto:info@afaq.app'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'أرسل إيميل', 'en': 'Send Email'},
                                                 'heading': { 'ar': 'دعنا نتحدث عن مشروعك',
                                                              'en': "Let's Talk About Your Project"},
                                                 'subtitle': { 'ar': 'نحن هنا لمساعدتك في فتح آفاق جديدة لأعمالك — '
                                                                     'تواصل معنا اليوم',
                                                               'en': "We're here to help you open new horizons for "
                                                                     'your business'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '📧',
                                            'translations': { 'desc': { 'ar': 'info@afaq.app — نرد خلال 24 ساعة',
                                                                        'en': 'info@afaq.app'},
                                                              'title': {'ar': 'أرسل لنا إيميل', 'en': 'Email Us'}}},
                                          { 'icon': '📱',
                                            'translations': { 'desc': { 'ar': '+966 50 000 0000 — تواصل فوري',
                                                                        'en': '+966 50 000 0000'},
                                                              'title': {'ar': 'واتساب', 'en': 'WhatsApp'}}},
                                          { 'icon': '📍',
                                            'translations': { 'desc': { 'ar': 'الرياض، المملكة العربية السعودية',
                                                                        'en': 'Riyadh, Saudi Arabia'},
                                                              'title': {'ar': 'مكتبنا', 'en': 'Our Office'}}}],
                               'translations': { 'subtitle': { 'ar': 'طرق متعددة للتواصل مع فريقنا وفتح آفاق التعاون',
                                                               'en': 'Multiple ways to connect with our team'},
                                                 'title': {'ar': 'كيف تصل إلينا؟', 'en': 'How to Reach Us'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': { 'ar': 'احجز استشارة مجانية',
                                                               'en': 'Book Free Consultation'},
                                                 'subtitle': { 'ar': 'احجز استشارة مجانية واكتشف كيف يمكننا مساعدتك في '
                                                                     'فتح آفاق النجاح',
                                                               'en': 'Book a free consultation and discover how we can '
                                                                     'help'},
                                                 'title': { 'ar': 'جاهز لبدء رحلتك نحو آفاق جديدة؟',
                                                            'en': 'Ready to Start Your Journey?'}}},
                  'order': 2},
                { 'block_type': 'contact',
                  'content': { 'translations': { 'heading': {'ar': 'أرسل لنا رسالة', 'en': 'Send Us a Message'},
                                                 'subtitle': { 'ar': 'املأ النموذج أدناه وسنتواصل معك خلال 24 ساعة',
                                                               'en': "Fill out the form below and we'll get back to "
                                                                     'you within 24 hours'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_icon': '📞',
    'nav_order': 4,
    'show_in_nav': True,
    'slug': 'contact',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'تواصل مع فريقنا لنفتح معاً آفاق جديدة لأعمالك',
                              'meta_title': 'تواصل معنا — آفاق تكنولوجي',
                              'title': 'تواصل معنا'},
                      'en': { 'description': 'Get in touch with our team',
                              'meta_title': 'Contact Us — Afaq Tech',
                              'title': 'Contact Us'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'تواصل معنا', 'en': 'Contact Us'},
                                                 'heading': {'ar': 'سياسة الخصوصية', 'en': 'Privacy Policy'},
                                                 'subtitle': { 'ar': 'خصوصيتك مهمة لنا — نلتزم بحماية بياناتك وفتح '
                                                                     'آفاق الأمان الرقمي',
                                                               'en': 'Your privacy is important to us'}}},
                  'order': 0},
                { 'block_type': 'accordion',
                  'content': { 'items': [ { 'translations': { 'desc': { 'ar': 'نجمع فقط البيانات الضرورية لتقديم '
                                                                              'خدماتنا. يشمل ذلك اسمك وعنوان بريدك '
                                                                              'الإلكتروني وبيانات الاستخدام.',
                                                                        'bn': 'আমরা শুধুমাত্র আমাদের সেবা প্রদানের '
                                                                              'জন্য প্রয়োজনীয় ডেটা সংগ্রহ করি। এর '
                                                                              'মধ্যে আপনার নাম, ইমেইল এবং ব্যবহার '
                                                                              'সংক্রান্ত তথ্য অন্তর্ভুক্ত।',
                                                                        'de': 'Wir erfassen nur die Daten, die zur '
                                                                              'Bereitstellung unserer Dienste '
                                                                              'erforderlich sind. Dazu gehören Ihr '
                                                                              'Name, Ihre E-Mail-Adresse und '
                                                                              'Nutzungsdaten.',
                                                                        'en': 'We only collect data necessary to '
                                                                              'provide our services. This includes '
                                                                              'your name, email, and usage data.',
                                                                        'es': 'Solo recopilamos los datos necesarios '
                                                                              'para brindar nuestros servicios. Esto '
                                                                              'incluye su nombre, correo electrónico e '
                                                                              'información de uso.',
                                                                        'fr': 'Nous collectons uniquement les données '
                                                                              'nécessaires à la fourniture de nos '
                                                                              'services. Cela inclut votre nom, votre '
                                                                              'adresse e-mail et vos données '
                                                                              "d'utilisation.",
                                                                        'id': 'Kami hanya mengumpulkan data yang '
                                                                              'diperlukan untuk menyediakan layanan '
                                                                              'kami. Ini mencakup nama, email, dan '
                                                                              'data penggunaan Anda.',
                                                                        'tr': 'Hizmetlerimizi sunmak için yalnızca '
                                                                              'gerekli verileri topluyoruz. Bu, '
                                                                              'adınız, e-posta adresiniz ve kullanım '
                                                                              'verilerinizi içerir.',
                                                                        'ur': 'ہم صرف وہ ڈیٹا اکٹھا کرتے ہیں جو ہماری '
                                                                              'خدمات فراہم کرنے کے لیے ضروری ہے۔ اس '
                                                                              'میں آپ کا نام، ای میل اور استعمال کے '
                                                                              'ڈیٹا شامل ہیں۔'},
                                                              'title': { 'ar': 'جمع البيانات',
                                                                         'bn': 'ডেটা সংগ্রহ',
                                                                         'de': 'Datenerfassung',
                                                                         'en': 'Data Collection',
                                                                         'es': 'Recopilación de datos',
                                                                         'fr': 'Collecte des données',
                                                                         'id': 'Pengumpulan Data',
                                                                         'tr': 'Veri Toplama',
                                                                         'ur': 'ڈیٹا اکٹھا کرنا'}}},
                                          { 'translations': { 'desc': { 'ar': 'تُستخدم بياناتك فقط لتحسين تجربتك '
                                                                              'وتقديم خدماتنا. لا نبيع بياناتك أبداً '
                                                                              'لجهات خارجية.',
                                                                        'bn': 'আপনার ডেটা শুধুমাত্র আপনার অভিজ্ঞতা '
                                                                              'উন্নত করতে এবং আমাদের সেবা প্রদান করতে '
                                                                              'ব্যবহৃত হয়। আমরা কখনো আপনার ডেটা '
                                                                              'তৃতীয় পক্ষের কাছে বিক্রি করি না।',
                                                                        'de': 'Ihre Daten werden ausschließlich zur '
                                                                              'Verbesserung Ihres Erlebnisses und zur '
                                                                              'Bereitstellung unserer Dienste '
                                                                              'verwendet. Wir verkaufen Ihre Daten '
                                                                              'niemals an Dritte.',
                                                                        'en': 'Your data is used solely to improve '
                                                                              'your experience and deliver our '
                                                                              'services. We never sell your data to '
                                                                              'third parties.',
                                                                        'es': 'Sus datos se utilizan únicamente para '
                                                                              'mejorar su experiencia y brindarle '
                                                                              'nuestros servicios. Nunca vendemos sus '
                                                                              'datos a terceros.',
                                                                        'fr': 'Vos données sont utilisées uniquement '
                                                                              'pour améliorer votre expérience et vous '
                                                                              'offrir nos services. Nous ne vendons '
                                                                              'jamais vos données à des tiers.',
                                                                        'id': 'Data Anda digunakan semata-mata untuk '
                                                                              'meningkatkan pengalaman dan memberikan '
                                                                              'layanan kami. Kami tidak pernah menjual '
                                                                              'data Anda kepada pihak ketiga.',
                                                                        'tr': 'Verileriniz yalnızca deneyiminizi '
                                                                              'iyileştirmek ve hizmetlerimizi sunmak '
                                                                              'için kullanılır. Verilerinizi asla '
                                                                              'üçüncü taraflara satmayız.',
                                                                        'ur': 'آپ کا ڈیٹا صرف آپ کے تجربے کو بہتر '
                                                                              'بنانے اور ہماری خدمات فراہم کرنے کے لیے '
                                                                              'استعمال ہوتا ہے۔ ہم آپ کا ڈیٹا کبھی بھی '
                                                                              'تیسرے فریق کو نہیں بیچتے۔'},
                                                              'title': { 'ar': 'استخدام البيانات',
                                                                         'bn': 'ডেটা ব্যবহার',
                                                                         'de': 'Datennutzung',
                                                                         'en': 'Data Usage',
                                                                         'es': 'Uso de datos',
                                                                         'fr': 'Utilisation des données',
                                                                         'id': 'Penggunaan Data',
                                                                         'tr': 'Veri Kullanımı',
                                                                         'ur': 'ڈیٹا کا استعمال'}}},
                                          { 'translations': { 'desc': { 'ar': 'نستخدم تشفيراً ومعايير أمان بمعايير '
                                                                              'الصناعة لحماية بياناتك من الوصول غير '
                                                                              'المصرح به.',
                                                                        'bn': 'আমরা আপনার ডেটাকে অননুমোদিত অ্যাক্সেস '
                                                                              'থেকে রক্ষা করতে শিল্প-মান এনক্রিপশন এবং '
                                                                              'নিরাপত্তা ব্যবস্থা ব্যবহার করি।',
                                                                        'de': 'Wir verwenden branchenübliche '
                                                                              'Verschlüsselungs- und '
                                                                              'Sicherheitsmaßnahmen, um Ihre Daten vor '
                                                                              'unbefugtem Zugriff zu schützen.',
                                                                        'en': 'We use industry-standard encryption and '
                                                                              'security measures to protect your data '
                                                                              'from unauthorized access.',
                                                                        'es': 'Utilizamos cifrado y medidas de '
                                                                              'seguridad estándar de la industria para '
                                                                              'proteger sus datos contra accesos no '
                                                                              'autorizados.',
                                                                        'fr': 'Nous utilisons un chiffrement et des '
                                                                              'mesures de sécurité conformes aux '
                                                                              "normes de l'industrie pour protéger vos "
                                                                              'données contre tout accès non autorisé.',
                                                                        'id': 'Kami menggunakan enkripsi dan '
                                                                              'langkah-langkah keamanan standar '
                                                                              'industri untuk melindungi data Anda '
                                                                              'dari akses yang tidak sah.',
                                                                        'tr': 'Verilerinizi yetkisiz erişime karşı '
                                                                              'korumak için endüstri standardı '
                                                                              'şifreleme ve güvenlik önlemleri '
                                                                              'kullanıyoruz.',
                                                                        'ur': 'ہم آپ کے ڈیٹا کو غیر مجاز رسائی سے '
                                                                              'بچانے کے لیے صنعت کے معیاری انکرپشن اور '
                                                                              'حفاظتی اقدامات استعمال کرتے ہیں۔'},
                                                              'title': { 'ar': 'حماية البيانات',
                                                                         'bn': 'ডেটা সুরক্ষা',
                                                                         'de': 'Datenschutz',
                                                                         'en': 'Data Protection',
                                                                         'es': 'Protección de datos',
                                                                         'fr': 'Protection des données',
                                                                         'id': 'Perlindungan Data',
                                                                         'tr': 'Veri Koruması',
                                                                         'ur': 'ڈیٹا کا تحفظ'}}},
                                          { 'translations': { 'desc': { 'ar': 'نستخدم ملفات تعريف الارتباط لتحسين '
                                                                              'تجربة التصفح. يمكنك التحكم في إعدادات '
                                                                              'الكوكيز من خلال متصفحك.',
                                                                        'bn': 'আমরা আপনার ব্রাউজিং অভিজ্ঞতা উন্নত করতে '
                                                                              'কুকিজ ব্যবহার করি। আপনি আপনার '
                                                                              'ব্রাউজারের মাধ্যমে কুকি সেটিংস '
                                                                              'নিয়ন্ত্রণ করতে পারেন।',
                                                                        'de': 'Wir verwenden Cookies, um Ihr '
                                                                              'Surferlebnis zu verbessern. Sie können '
                                                                              'die Cookie-Einstellungen über Ihren '
                                                                              'Browser steuern.',
                                                                        'en': 'We use cookies to enhance your browsing '
                                                                              'experience. You can control cookie '
                                                                              'settings through your browser.',
                                                                        'es': 'Utilizamos cookies para mejorar su '
                                                                              'experiencia de navegación. Puede '
                                                                              'controlar la configuración de cookies a '
                                                                              'través de su navegador.',
                                                                        'fr': 'Nous utilisons des cookies pour '
                                                                              'améliorer votre expérience de '
                                                                              'navigation. Vous pouvez contrôler les '
                                                                              'paramètres des cookies depuis votre '
                                                                              'navigateur.',
                                                                        'id': 'Kami menggunakan cookie untuk '
                                                                              'meningkatkan pengalaman penjelajahan '
                                                                              'Anda. Anda dapat mengontrol pengaturan '
                                                                              'cookie melalui browser Anda.',
                                                                        'tr': 'Gezinti deneyiminizi geliştirmek için '
                                                                              'çerezler kullanıyoruz. Çerez ayarlarını '
                                                                              'tarayıcınız üzerinden kontrol '
                                                                              'edebilirsiniz.',
                                                                        'ur': 'ہم آپ کے براؤزنگ کے تجربے کو بہتر بنانے '
                                                                              'کے لیے کوکیز استعمال کرتے ہیں۔ آپ اپنے '
                                                                              'براؤزر کے ذریعے کوکی کی ترتیبات کو '
                                                                              'کنٹرول کر سکتے ہیں۔'},
                                                              'title': { 'ar': 'ملفات تعريف الارتباط',
                                                                         'bn': 'কুকিজ',
                                                                         'de': 'Cookies',
                                                                         'en': 'Cookies',
                                                                         'es': 'Cookies',
                                                                         'fr': 'Cookies',
                                                                         'id': 'Cookie',
                                                                         'tr': 'Çerezler',
                                                                         'ur': 'کوکیز'}}},
                                          { 'translations': { 'desc': { 'ar': 'لك الحق في الوصول إلى بياناتك الشخصية '
                                                                              'أو تعديلها أو حذفها في أي وقت عن طريق '
                                                                              'التواصل معنا.',
                                                                        'bn': 'আপনার যে কোনো সময় আমাদের সাথে যোগাযোগ '
                                                                              'করে আপনার ব্যক্তিগত ডেটা অ্যাক্সেস, '
                                                                              'পরিবর্তন বা মুছে ফেলার অধিকার রয়েছে।',
                                                                        'de': 'Sie haben das Recht, jederzeit auf Ihre '
                                                                              'personenbezogenen Daten zuzugreifen, '
                                                                              'sie zu ändern oder zu löschen, indem '
                                                                              'Sie uns kontaktieren.',
                                                                        'en': 'You have the right to access, modify, '
                                                                              'or delete your personal data at any '
                                                                              'time by contacting us.',
                                                                        'es': 'Tiene derecho a acceder, modificar o '
                                                                              'eliminar sus datos personales en '
                                                                              'cualquier momento poniéndose en '
                                                                              'contacto con nosotros.',
                                                                        'fr': "Vous avez le droit d'accéder à vos "
                                                                              'données personnelles, de les modifier '
                                                                              'ou de les supprimer à tout moment en '
                                                                              'nous contactant.',
                                                                        'id': 'Anda berhak untuk mengakses, mengubah, '
                                                                              'atau menghapus data pribadi Anda kapan '
                                                                              'saja dengan menghubungi kami.',
                                                                        'tr': 'Kişisel verilerinize istediğiniz zaman '
                                                                              'erişme, düzeltme veya silme hakkına '
                                                                              'sahipsiniz. Bunun için bizimle '
                                                                              'iletişime geçmeniz yeterlidir.',
                                                                        'ur': 'آپ کو کسی بھی وقت ہم سے رابطہ کرکے اپنے '
                                                                              'ذاتی ڈیٹا تک رسائی، اس میں ترمیم یا اسے '
                                                                              'حذف کرنے کا حق حاصل ہے۔'},
                                                              'title': { 'ar': 'حقوقك',
                                                                         'bn': 'আপনার অধিকার',
                                                                         'de': 'Ihre Rechte',
                                                                         'en': 'Your Rights',
                                                                         'es': 'Sus derechos',
                                                                         'fr': 'Vos droits',
                                                                         'id': 'Hak Anda',
                                                                         'tr': 'Haklarınız',
                                                                         'ur': 'آپ کے حقوق'}}},
                                          { 'translations': { 'desc': { 'ar': 'لأي استفسارات تتعلق بالخصوصية، يرجى '
                                                                              'التواصل على privacy@afaq.app',
                                                                        'bn': 'গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নের '
                                                                              'জন্য, দয়া করে privacy@afaq.app-এ ইমেল '
                                                                              'করুন।',
                                                                        'de': 'Bei Fragen zum Datenschutz senden Sie '
                                                                              'bitte eine E-Mail an privacy@afaq.app',
                                                                        'en': 'For any privacy-related questions, '
                                                                              'please email privacy@afaq.app',
                                                                        'es': 'Si tiene alguna pregunta sobre '
                                                                              'privacidad, envíe un correo electrónico '
                                                                              'a privacy@afaq.app',
                                                                        'fr': 'Pour toute question relative à la '
                                                                              'confidentialité, veuillez envoyer un '
                                                                              'e-mail à privacy@afaq.app',
                                                                        'id': 'Untuk pertanyaan terkait privasi, '
                                                                              'silakan kirim email ke privacy@afaq.app',
                                                                        'tr': 'Gizlilikle ilgili herhangi bir sorunuz '
                                                                              'için lütfen privacy@afaq.app adresine '
                                                                              'e-posta gönderin.',
                                                                        'ur': 'رازداری سے متعلق کسی بھی سوال کے لیے، '
                                                                              'براہ کرم privacy@afaq.app پر ای میل '
                                                                              'کریں۔'},
                                                              'title': { 'ar': 'التواصل بخصوص الخصوصية',
                                                                         'bn': 'গোপনীয়তা সংক্রান্ত যোগাযোগ',
                                                                         'de': 'Kontakt bei Datenschutzfragen',
                                                                         'en': 'Contact for Privacy Concerns',
                                                                         'es': 'Contacto para asuntos de privacidad',
                                                                         'fr': 'Contact pour questions de '
                                                                               'confidentialité',
                                                                         'id': 'Kontak untuk Masalah Privasi',
                                                                         'tr': 'Gizlilik Konularında İletişim',
                                                                         'ur': 'رازداری سے متعلق رابطہ'}}}],
                               'translations': { 'title': { 'ar': 'التزاماتنا في حماية خصوصيتك',
                                                            'bn': 'আমাদের গোপনীয়তার অঙ্গীকার',
                                                            'de': 'Unsere Datenschutzversprechen',
                                                            'en': 'Our Privacy Commitments',
                                                            'es': 'Nuestro compromiso con la privacidad',
                                                            'fr': 'Nos engagements en matière de confidentialité',
                                                            'id': 'Komitmen Privasi Kami',
                                                            'tr': 'Gizlilik Taahhütlerimiz',
                                                            'ur': 'رازداری کے حوالے سے ہمارے وعدے'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'تواصل معنا', 'en': 'Contact Us'},
                                                 'subtitle': { 'ar': 'فريقنا هنا للإجابة على أي استفسارات وفتح آفاق '
                                                                     'الثقة معك',
                                                               'en': 'Our team is here to address any concerns'},
                                                 'title': { 'ar': 'لديك أسئلة حول الخصوصية؟',
                                                            'en': 'Questions About Privacy?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 10,
    'show_in_nav': False,
    'slug': 'privacy',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'كيف نحمي بياناتك ونحافظ على خصوصيتك',
                              'meta_title': 'سياسة الخصوصية — آفاق تكنولوجي',
                              'title': 'سياسة الخصوصية'},
                      'en': { 'description': 'How we protect your data',
                              'meta_title': 'Privacy Policy — Afaq Tech',
                              'title': 'Privacy Policy'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'تواصل معنا', 'en': 'Contact Us'},
                                                 'heading': {'ar': 'شروط الخدمة', 'en': 'Terms of Service'},
                                                 'subtitle': { 'ar': 'يرجى قراءة هذه الشروط بعناية قبل استخدام منصتنا '
                                                                     '— نفتح آفاق الشفافية والوضوح',
                                                               'en': 'Please read these terms carefully before using '
                                                                     'our platform'}}},
                  'order': 0},
                { 'block_type': 'accordion',
                  'content': { 'items': [ { 'translations': { 'desc': { 'ar': 'باستخدام منصة آفاق تكنولوجي، أنت توافق '
                                                                              'على هذه الشروط والأحكام. إذا كنت لا '
                                                                              'توافق، يرجى عدم استخدام خدماتنا.',
                                                                        'bn': 'আফাক টেক প্ল্যাটফর্ম ব্যবহার করার '
                                                                              'মাধ্যমে, আপনি এই শর্তাবলীতে সম্মত '
                                                                              'হচ্ছেন। আপনি যদি সম্মত না হন, তাহলে '
                                                                              'আমাদের সেবা ব্যবহার করবেন না।',
                                                                        'de': 'Durch die Nutzung der '
                                                                              'Afaq-Tech-Plattform stimmen Sie diesen '
                                                                              'Allgemeinen Geschäftsbedingungen zu. '
                                                                              'Wenn Sie nicht zustimmen, nutzen Sie '
                                                                              'unsere Dienste bitte nicht.',
                                                                        'en': 'By using Afaq Tech platform, you agree '
                                                                              'to these terms and conditions. If you '
                                                                              'do not agree, please do not use our '
                                                                              'services.',
                                                                        'es': 'Al utilizar la plataforma de Afaq Tech, '
                                                                              'acepta estos términos y condiciones. Si '
                                                                              'no está de acuerdo, no utilice nuestros '
                                                                              'servicios.',
                                                                        'fr': 'En utilisant la plateforme Afaq Tech, '
                                                                              'vous acceptez les présentes conditions '
                                                                              "générales. Si vous n'êtes pas d'accord, "
                                                                              'veuillez ne pas utiliser nos services.',
                                                                        'id': 'Dengan menggunakan platform Afaq Tech, '
                                                                              'Anda menyetujui syarat dan ketentuan '
                                                                              'ini. Jika Anda tidak setuju, jangan '
                                                                              'gunakan layanan kami.',
                                                                        'tr': 'Afaq Tech platformunu kullanarak bu '
                                                                              'şart ve koşulları kabul etmiş '
                                                                              'olursunuz. Kabul etmiyorsanız, lütfen '
                                                                              'hizmetlerimizi kullanmayın.',
                                                                        'ur': 'آفاق ٹیک پلیٹ فارم استعمال کرکے، آپ ان '
                                                                              'شرائط و ضوابط سے اتفاق کرتے ہیں۔ اگر آپ '
                                                                              'متفق نہیں ہیں، تو براہ کرم ہماری خدمات '
                                                                              'استعمال نہ کریں۔'},
                                                              'title': { 'ar': 'قبول الشروط',
                                                                         'bn': 'শর্তাবলীর গ্রহণ',
                                                                         'de': 'Annahme der Bedingungen',
                                                                         'en': 'Acceptance of Terms',
                                                                         'es': 'Aceptación de los términos',
                                                                         'fr': 'Acceptation des conditions',
                                                                         'id': 'Penerimaan Ketentuan',
                                                                         'tr': 'Şartların Kabulü',
                                                                         'ur': 'شرائط کی قبولیت'}}},
                                          { 'translations': { 'desc': { 'ar': 'توفر آفاق تكنولوجي خدمات رقمية تشمل '
                                                                              'تصميم المواقع وإدارة التواصل الاجتماعي '
                                                                              'وصفحات الهبوط والمحتوى التعليمي.',
                                                                        'bn': 'আফাক টেক ডিজিটাল সেবা প্রদান করে যার '
                                                                              'মধ্যে রয়েছে ওয়েব ডিজাইন, সোশ্যাল '
                                                                              'মিডিয়া ম্যানেজমেন্ট, ল্যান্ডিং পেজ এবং '
                                                                              'শিক্ষামূলক কন্টেন্ট।',
                                                                        'de': 'Afaq Tech bietet digitale '
                                                                              'Dienstleistungen an, darunter '
                                                                              'Webdesign, Social-Media-Management, '
                                                                              'Landing Pages und Bildungsinhalte.',
                                                                        'en': 'Afaq Tech provides digital services '
                                                                              'including web design, social media '
                                                                              'management, landing pages, and '
                                                                              'educational content.',
                                                                        'es': 'Afaq Tech ofrece servicios digitales '
                                                                              'que incluyen diseño web, gestión de '
                                                                              'redes sociales, páginas de aterrizaje y '
                                                                              'contenido educativo.',
                                                                        'fr': 'Afaq Tech propose des services '
                                                                              'numériques, notamment la conception de '
                                                                              'sites web, la gestion des réseaux '
                                                                              "sociaux, les pages d'atterrissage et le "
                                                                              'contenu éducatif.',
                                                                        'id': 'Afaq Tech menyediakan layanan digital '
                                                                              'termasuk desain web, manajemen media '
                                                                              'sosial, halaman arahan, dan konten '
                                                                              'edukasi.',
                                                                        'tr': 'Afaq Tech, web tasarımı, sosyal medya '
                                                                              'yönetimi, açılış sayfaları ve eğitim '
                                                                              'içerikleri dahil olmak üzere dijital '
                                                                              'hizmetler sunmaktadır.',
                                                                        'ur': 'آفاق ٹیک ڈیجیٹل خدمات فراہم کرتا ہے جس '
                                                                              'میں ویب ڈیزائن، سوشل میڈیا مینجمنٹ، '
                                                                              'لینڈنگ پیجز اور تعلیمی مواد شامل ہیں۔'},
                                                              'title': { 'ar': 'وصف الخدمة',
                                                                         'bn': 'সেবার বিবরণ',
                                                                         'de': 'Dienstleistungsbeschreibung',
                                                                         'en': 'Service Description',
                                                                         'es': 'Descripción del servicio',
                                                                         'fr': 'Description du service',
                                                                         'id': 'Deskripsi Layanan',
                                                                         'tr': 'Hizmet Tanımı',
                                                                         'ur': 'خدمت کی تفصیل'}}},
                                          { 'translations': { 'desc': { 'ar': 'المستخدمون مسؤولون عن الحفاظ على سرية '
                                                                              'حساباتهم وجميع الأنشطة التي تحدث تحت '
                                                                              'حساباتهم.',
                                                                        'bn': 'ব্যবহারকারীরা তাদের অ্যাকাউন্টের '
                                                                              'গোপনীয়তা বজায় রাখার জন্য এবং তাদের '
                                                                              'অ্যাকাউন্টের অধীনে সংঘটিত সমস্ত '
                                                                              'কার্যকলাপের জন্য দায়ী।',
                                                                        'de': 'Nutzer sind für die Vertraulichkeit '
                                                                              'ihrer Konten und für alle Aktivitäten '
                                                                              'verantwortlich, die unter ihren Konten '
                                                                              'stattfinden.',
                                                                        'en': 'Users are responsible for maintaining '
                                                                              'the confidentiality of their accounts '
                                                                              'and for all activities under their '
                                                                              'accounts.',
                                                                        'es': 'Los usuarios son responsables de '
                                                                              'mantener la confidencialidad de sus '
                                                                              'cuentas y de todas las actividades '
                                                                              'realizadas bajo ellas.',
                                                                        'fr': 'Les utilisateurs sont responsables de '
                                                                              'la confidentialité de leurs comptes et '
                                                                              'de toutes les activités effectuées sous '
                                                                              'ceux-ci.',
                                                                        'id': 'Pengguna bertanggung jawab untuk '
                                                                              'menjaga kerahasiaan akun mereka dan '
                                                                              'semua aktivitas yang terjadi di bawah '
                                                                              'akun mereka.',
                                                                        'tr': 'Kullanıcılar, hesaplarının gizliliğini '
                                                                              'korumaktan ve hesapları altında '
                                                                              'gerçekleşen tüm faaliyetlerden '
                                                                              'sorumludur.',
                                                                        'ur': 'صارفین اپنے اکاؤنٹس کی رازداری برقرار '
                                                                              'رکھنے اور اپنے اکاؤنٹس کے تحت ہونے والی '
                                                                              'تمام سرگرمیوں کے ذمہ دار ہیں۔'},
                                                              'title': { 'ar': 'مسؤوليات المستخدم',
                                                                         'bn': 'ব্যবহারকারীর দায়িত্ব',
                                                                         'de': 'Verantwortlichkeiten der Nutzer',
                                                                         'en': 'User Responsibilities',
                                                                         'es': 'Responsabilidades del usuario',
                                                                         'fr': "Responsabilités de l'utilisateur",
                                                                         'id': 'Tanggung Jawab Pengguna',
                                                                         'tr': 'Kullanıcı Sorumlulukları',
                                                                         'ur': 'صارف کی ذمہ داریاں'}}},
                                          { 'translations': { 'desc': { 'ar': 'الخدمات المدفوعة تتطلب الدفع مقدماً. '
                                                                              'تختلف سياسات الاسترداد حسب نوع الخدمة '
                                                                              'وتفاصيل كل اتفاقية خدمة.',
                                                                        'bn': 'পেইড সার্ভিসের জন্য অগ্রিম পেমেন্ট '
                                                                              'প্রয়োজন। রিফান্ড নীতি পরিষেবার ধরণ '
                                                                              'অনুযায়ী পরিবর্তিত হয় এবং প্রতিটি '
                                                                              'পরিষেবা চুক্তিতে বিস্তারিত উল্লেখ করা '
                                                                              'আছে।',
                                                                        'de': 'Kostenpflichtige Dienste erfordern eine '
                                                                              'Vorauszahlung. Die '
                                                                              'Rückerstattungsrichtlinien variieren je '
                                                                              'nach Dienstleistungsart und sind in der '
                                                                              'jeweiligen Dienstleistungsvereinbarung '
                                                                              'festgelegt.',
                                                                        'en': 'Paid services require upfront payment. '
                                                                              'Refund policies vary by service type '
                                                                              'and are detailed in each service '
                                                                              'agreement.',
                                                                        'es': 'Los servicios de pago requieren un pago '
                                                                              'por adelantado. Las políticas de '
                                                                              'reembolso varían según el tipo de '
                                                                              'servicio y se detallan en cada acuerdo '
                                                                              'de servicio.',
                                                                        'fr': 'Les services payants nécessitent un '
                                                                              'paiement initial. Les politiques de '
                                                                              'remboursement varient selon le type de '
                                                                              'service et sont détaillées dans chaque '
                                                                              'contrat de service.',
                                                                        'id': 'Layanan berbayar memerlukan pembayaran '
                                                                              'di muka. Kebijakan pengembalian dana '
                                                                              'bervariasi berdasarkan jenis layanan '
                                                                              'dan dijelaskan secara rinci dalam '
                                                                              'setiap perjanjian layanan.',
                                                                        'tr': 'Ücretli hizmetler peşin ödeme '
                                                                              'gerektirir. İade politikaları hizmet '
                                                                              'türüne göre değişiklik gösterir ve her '
                                                                              'hizmet sözleşmesinde ayrıntılı olarak '
                                                                              'belirtilir.',
                                                                        'ur': 'ادا شدہ خدمات کے لیے پیشگی ادائیگی '
                                                                              'ضروری ہے۔ رقم واپسی کی پالیسیاں خدمت کی '
                                                                              'قسم کے لحاظ سے مختلف ہوتی ہیں اور ہر '
                                                                              'خدمت کے معاہدے میں تفصیل سے درج ہیں۔'},
                                                              'title': { 'ar': 'شروط الدفع',
                                                                         'bn': 'পেমেন্টের শর্তাবলী',
                                                                         'de': 'Zahlungsbedingungen',
                                                                         'en': 'Payment Terms',
                                                                         'es': 'Términos de pago',
                                                                         'fr': 'Conditions de paiement',
                                                                         'id': 'Ketentuan Pembayaran',
                                                                         'tr': 'Ödeme Koşulları',
                                                                         'ur': 'ادائیگی کی شرائط'}}},
                                          { 'translations': { 'desc': { 'ar': 'جميع المحتويات والتصاميم والمواد التي '
                                                                              'تنتجها آفاق تكنولوجي تظل ملكاً لنا إلا '
                                                                              'إذا اتفقنا على خلاف ذلك.',
                                                                        'bn': 'আফাক টেক দ্বারা তৈরি সমস্ত কন্টেন্ট, '
                                                                              'ডিজাইন এবং উপকরণ আমাদের বৌদ্ধিক '
                                                                              'সম্পত্তি হিসেবে রয়ে যায়, যতক্ষণ না '
                                                                              'অন্যথায় সম্মত হওয়া যায়।',
                                                                        'de': 'Alle von Afaq Tech erstellten Inhalte, '
                                                                              'Designs und Materialien bleiben unser '
                                                                              'geistiges Eigentum, sofern nichts '
                                                                              'anderes vereinbart wurde.',
                                                                        'en': 'All content, designs, and materials '
                                                                              'created by Afaq Tech remain our '
                                                                              'intellectual property unless otherwise '
                                                                              'agreed.',
                                                                        'es': 'Todo el contenido, diseños y materiales '
                                                                              'creados por Afaq Tech siguen siendo de '
                                                                              'nuestra propiedad intelectual, a menos '
                                                                              'que se acuerde lo contrario.',
                                                                        'fr': 'Tout le contenu, les designs et les '
                                                                              'documents créés par Afaq Tech restent '
                                                                              'notre propriété intellectuelle, sauf '
                                                                              'convention contraire.',
                                                                        'id': 'Semua konten, desain, dan materi yang '
                                                                              'dibuat oleh Afaq Tech tetap menjadi '
                                                                              'kekayaan intelektual kami kecuali '
                                                                              'disepakati lain.',
                                                                        'tr': 'Afaq Tech tarafından oluşturulan tüm '
                                                                              'içerik, tasarım ve materyaller, aksi '
                                                                              'kararlaştırılmadıkça fikri mülkiyetimiz '
                                                                              'olarak kalır.',
                                                                        'ur': 'آفاق ٹیک کے تیار کردہ تمام مواد، ڈیزائن '
                                                                              'اور مواد ہماری دانشورانہ ملکیت رہیں گے '
                                                                              'جب تک کہ دوسری صورت میں اتفاق نہ کیا '
                                                                              'جائے۔'},
                                                              'title': { 'ar': 'حقوق الملكية الفكرية',
                                                                         'bn': 'বৌদ্ধিক সম্পত্তি',
                                                                         'de': 'Geistiges Eigentum',
                                                                         'en': 'Intellectual Property',
                                                                         'es': 'Propiedad intelectual',
                                                                         'fr': 'Propriété intellectuelle',
                                                                         'id': 'Kekayaan Intelektual',
                                                                         'tr': 'Fikri Mülkiyet',
                                                                         'ur': 'دانشورانہ املاک'}}},
                                          { 'translations': { 'desc': { 'ar': 'لا تتحمل آفاق تكنولوجي المسؤولية عن أي '
                                                                              'أضرار غير مباشرة أو عرضية أو تبعية '
                                                                              'ناتجة عن استخدام الخدمات.',
                                                                        'bn': 'সেবা ব্যবহারের ফলে সৃষ্ট কোনো পরোক্ষ, '
                                                                              'আনুষঙ্গিক বা ফলস্বরূপ ক্ষতির জন্য আফাক '
                                                                              'টেক দায়ী থাকবে না।',
                                                                        'de': 'Afaq Tech haftet nicht für indirekte, '
                                                                              'beiläufig entstandene oder '
                                                                              'Folgeschäden, die aus der Nutzung der '
                                                                              'Dienste entstehen.',
                                                                        'en': 'Afaq Tech shall not be liable for any '
                                                                              'indirect, incidental, or consequential '
                                                                              'damages arising from service use.',
                                                                        'es': 'Afaq Tech no será responsable de ningún '
                                                                              'daño indirecto, incidental o '
                                                                              'consecuente derivado del uso del '
                                                                              'servicio.',
                                                                        'fr': 'Afaq Tech ne saurait être tenue '
                                                                              'responsable des dommages indirects, '
                                                                              'accessoires ou consécutifs découlant de '
                                                                              "l'utilisation des services.",
                                                                        'id': 'Afaq Tech tidak bertanggung jawab atas '
                                                                              'kerusakan tidak langsung, insidental, '
                                                                              'atau konsekuensial yang timbul dari '
                                                                              'penggunaan layanan.',
                                                                        'tr': 'Afaq Tech, hizmet kullanımından '
                                                                              'kaynaklanan dolaylı, tesadüfi veya '
                                                                              'sonuçsal hiçbir zarardan sorumlu '
                                                                              'tutulamaz.',
                                                                        'ur': 'آفاق ٹیک خدمات کے استعمال سے پیدا ہونے '
                                                                              'والے کسی بھی بالواسطہ، حادثاتی یا نتیجہ '
                                                                              'خیز نقصانات کے لیے ذمہ دار نہیں ہوگی۔'},
                                                              'title': { 'ar': 'حدود المسؤولية',
                                                                         'bn': 'দায়বদ্ধতার সীমাবদ্ধতা',
                                                                         'de': 'Haftungsbeschränkung',
                                                                         'en': 'Limitation of Liability',
                                                                         'es': 'Limitación de responsabilidad',
                                                                         'fr': 'Limitation de responsabilité',
                                                                         'id': 'Batasan Tanggung Jawab',
                                                                         'tr': 'Sorumluluğun Sınırlandırılması',
                                                                         'ur': 'ذمہ داری کی حدود'}}}],
                               'translations': { 'title': { 'ar': 'الشروط والأحكام',
                                                            'bn': 'শর্তাবলী',
                                                            'de': 'Allgemeine Geschäftsbedingungen',
                                                            'en': 'Terms and Conditions',
                                                            'es': 'Términos y condiciones',
                                                            'fr': 'Conditions générales',
                                                            'id': 'Syarat dan Ketentuan',
                                                            'tr': 'Şartlar ve Koşullar',
                                                            'ur': 'شرائط و ضوابط'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'تواصل مع الدعم', 'en': 'Contact Support'},
                                                 'subtitle': { 'ar': 'فريق الدعم جاهز للإجابة على أسئلتك وفتح آفاق '
                                                                     'التعاون معك',
                                                               'en': 'Our support team is ready to answer your '
                                                                     'questions'},
                                                 'title': { 'ar': 'تحتاج مساعدة في فهم شروطنا؟',
                                                            'en': 'Need Help Understanding Our Terms?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 11,
    'show_in_nav': False,
    'slug': 'terms',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'الشروط والأحكام لاستخدام منصتنا',
                              'meta_title': 'شروط الخدمة — آفاق تكنولوجي',
                              'title': 'شروط الخدمة'},
                      'en': { 'description': 'Terms and conditions for using our platform',
                              'meta_title': 'Terms of Service — Afaq Tech',
                              'title': 'Terms of Service'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'تصميم مخصص', 'en': 'Custom Design'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'محسّن للبحث', 'en': 'SEO Optimized'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'مصمم للهاتف أولاً',
                                                                         'en': 'Mobile First'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'احصل على عرض سعر', 'en': 'Get a Quote'},
                                                 'heading': { 'ar': 'تصميم مواقع يفتح آفاقاً جديدة لعلامتك',
                                                              'en': 'Professional Web Design'},
                                                 'subtitle': { 'ar': 'نصمم مواقع إلكترونية مذهلة ومتجاوبة تفتح آفاق '
                                                                     'التحويل العالية وتحوّل الزوار إلى عملاء دائمين',
                                                               'en': 'We create stunning, responsive websites that '
                                                                     'convert visitors into customers'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🎨',
                                            'link': '/blog/web-design-trends-2026',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تصاميم فريدة متوافقة مع '
                                                                                            'هويتك',
                                                                                      'en': 'Unique brand-aligned '
                                                                                            'visuals'}}},
                                                        { 'translations': { 'text': { 'ar': 'خطط أولية ونماذج تجريبية',
                                                                                      'en': 'Wireframes & mockups '
                                                                                            'included'}}},
                                                        { 'translations': { 'text': { 'ar': 'تعديلات غير محدودة',
                                                                                      'en': 'Unlimited revisions'}}}],
                                            'translations': { 'desc': { 'ar': 'تصاميم فريدة مصممة خصيصاً لهويتك '
                                                                              'التجارية وتفتح آفاق التميّز',
                                                                        'en': 'Unique designs tailored to your brand '
                                                                              'identity'},
                                                              'title': { 'ar': 'تصميم مخصص بالكامل',
                                                                         'en': 'Custom Design'}}},
                                          { 'icon': '📱',
                                            'link': '/blog/responsive-website-2026',
                                            'points': [ { 'translations': { 'text': { 'ar': 'منهجية الهاتف أولاً',
                                                                                      'en': 'Mobile-first approach'}}},
                                                        { 'translations': { 'text': { 'ar': 'اختبار على جميع المتصفحات',
                                                                                      'en': 'Tested on all browsers'}}},
                                                        { 'translations': { 'text': { 'ar': 'عرض دقيق بالبكسل',
                                                                                      'en': 'Pixel-perfect '
                                                                                            'rendering'}}}],
                                            'translations': { 'desc': { 'ar': 'يظهر بشكل مثالي على الكمبيوتر والتابلت '
                                                                              'والهاتف — آفاق الوصول لجميع المستخدمين',
                                                                        'en': 'Looks perfect on desktop, tablet, and '
                                                                              'mobile'},
                                                              'title': { 'ar': 'متجاوب مع كل الأجهزة',
                                                                         'en': 'Responsive'}}},
                                          { 'icon': '⚡',
                                            'link': '/blog/web-design-trends-2026',
                                            'points': [ { 'translations': { 'text': { 'ar': 'محسّن لمؤشرات الويب '
                                                                                            'الأساسية',
                                                                                      'en': 'Core Web Vitals '
                                                                                            'optimized'}}},
                                                        { 'translations': { 'text': { 'ar': 'تحسين الصور م شامل',
                                                                                      'en': 'Image optimization '
                                                                                            'included'}}},
                                                        { 'translations': { 'text': { 'ar': 'إعداد الشبكات المؤقتة',
                                                                                      'en': 'CDN & caching setup'}}}],
                                            'translations': { 'desc': { 'ar': 'سرعة تحميل محسّنة لتجربة مستخدم أفضل '
                                                                              'وفتح آفاق التفاعل',
                                                                        'en': 'Optimized loading speed for better user '
                                                                              'experience'},
                                                              'title': { 'ar': 'سرعة فائقة',
                                                                         'en': 'Fast Performance'}}}],
                               'translations': { 'subtitle': { 'ar': 'حلول تصميم مواقع شاملة تفتح آفاقاً رقمية جديدة '
                                                                     'لعلامتك',
                                                               'en': 'Complete web design solutions that open new '
                                                                     'horizons'},
                                                 'title': {'ar': 'ما نقدمه في تصميم المواقع', 'en': 'What We Offer'}}},
                  'order': 1},
                { 'block_type': 'platform_how_it_works',
                  'content': { 'steps': [ { 'icon': '🔍',
                                            'number': '1',
                                            'translations': { 'desc': { 'ar': 'نفهم أهدافك وجماهيرك ومتطلباتك لنرسم '
                                                                              'آفاق المشروع بدقة',
                                                                        'en': 'We understand your goals, audience, and '
                                                                              'requirements'},
                                                              'title': { 'ar': 'الاكتشاف والتخطيط',
                                                                         'en': 'Discovery & Planning'}}},
                                          { 'icon': '🛠️',
                                            'number': '2',
                                            'translations': { 'desc': { 'ar': 'فريقنا يصمم ويطور موقعك بأحدث التقنيات '
                                                                              'وأفضل الممارسات',
                                                                        'en': 'Our team creates a stunning, functional '
                                                                              'website'},
                                                              'title': { 'ar': 'التصميم والتطوير',
                                                                         'en': 'Design & Development'}}},
                                          { 'icon': '🚀',
                                            'number': '3',
                                            'translations': { 'desc': { 'ar': 'نطلق موقعك ونقدم دعم مستمر لضمان بقاء '
                                                                              'آفاق أداء موقعك مشرقة',
                                                                        'en': 'We launch your site and provide ongoing '
                                                                              'support'},
                                                              'title': { 'ar': 'الإطلاق والدعم',
                                                                         'en': 'Launch & Support'}}}],
                               'translations': { 'subtitle': { 'ar': 'عمليتنا المُجرّبة لتقديم مواقع استثنائية تفوق '
                                                                     'توقعاتك',
                                                               'en': 'Our proven process for delivering exceptional '
                                                                     'websites'},
                                                 'title': {'ar': 'كيف نفتح لك آفاق التصميم؟', 'en': 'How We Work'}}},
                  'order': 2},
                { 'block_type': 'testimonials',
                  'content': { 'columns': 2,
                               'items': [ { 'rating': 5,
                                            'translations': { 'name': {'ar': 'أحمد الراشد', 'en': 'Ahmed Al-Rashid'},
                                                              'role': { 'ar': 'مدير تنفيذي، متجر تك',
                                                                        'en': 'CEO, TechStore'},
                                                              'text': { 'ar': 'موقعنا الجديد زاد التحويلات بنسبة 200% '
                                                                              '— فتحوا لنا آفاقاً إيرادية لم نكن '
                                                                              'نتخيلها',
                                                                        'en': 'Our new website increased conversions '
                                                                              'by 200%'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'سارة العلي', 'en': 'Sara Al-Ali'},
                                                              'role': { 'ar': 'مؤسسة، إديوستارت',
                                                                        'en': 'Founder, EduStart'},
                                                              'text': { 'ar': 'تصميم جميل يمثّل هويتنا بشكل مثالي — '
                                                                              'آفاق التميّز واضحة تماماً',
                                                                        'en': 'Beautiful design that perfectly '
                                                                              'represents our brand'}}}],
                               'translations': { 'subtitle': { 'ar': 'آراء حقيقية من أعمال ساعدناها في فتح آفاق رقمية '
                                                                     'جديدة',
                                                               'en': "Real feedback from businesses we've helped"},
                                                 'title': { 'ar': 'عملاؤنا شهدوا آفاقاً جديدة مع تصاميمنا',
                                                            'en': 'What Our Clients Say'}}},
                  'order': 3},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ مشروعك الآن', 'en': 'Start Your Project'},
                                                 'subtitle': { 'ar': 'دعنا نصمم لك موقعًا يفتح آفاقاً جديدة لعلامتك '
                                                                     'التجارية ويعزز نجاحك',
                                                               'en': "Let's create a website that opens new horizons "
                                                                     'for your business'},
                                                 'title': { 'ar': 'جاهز لتحويل حضورك الرقمي وفتح آفاق جديدة؟',
                                                            'en': 'Ready to Transform Your Online Presence?'}}},
                  'order': 4}],
    'is_homepage': False,
    'nav_order': 20,
    'show_in_nav': False,
    'slug': 'services/web-design',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'خدمات تصميم مواقع احترافية تفتح آفاقاً جديدة لعلامتك التجارية',
                              'meta_title': 'تصميم المواقع — آفاق تكنولوجي',
                              'title': 'تصميم المواقع'},
                      'en': { 'description': 'Professional website design services',
                              'meta_title': 'Web Design — Afaq Tech',
                              'title': 'Web Design'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'استراتيجية محتوى',
                                                                         'en': 'Content Strategy'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'نمو مضمون', 'en': 'Growth Guaranteed'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'تقارير تحليلية',
                                                                         'en': 'Analytics Reports'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'heading': { 'ar': 'تواصل اجتماعي يفتح آفاقاً جديدة لأعمالك',
                                                              'en': 'Social Media That Opens New Horizons'},
                                                 'subtitle': { 'ar': 'نوسّع آفاق حضورك الرقمي ونحوّل منصات التواصل إلى '
                                                                     'مصدر حقيقي للمبيعات والنمو المستدام',
                                                               'en': 'We manage your social media presence to drive '
                                                                     'real results and growth'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '📊',
                                            'link': '/blog/social-media-strategy',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تقويم محتوى شهري',
                                                                                      'en': 'Monthly content '
                                                                                            'calendar'}}},
                                                        { 'translations': { 'text': { 'ar': 'بحث عن الهاشتاقات',
                                                                                      'en': 'Hashtag research'}}},
                                                        { 'translations': { 'text': { 'ar': 'تحليل المنافسين',
                                                                                      'en': 'Competitor analysis'}}}],
                                            'translations': { 'desc': { 'ar': 'تقويمات محتوى استراتيجية متوافقة مع '
                                                                              'أهدافك لفتح آفاق النمو',
                                                                        'en': 'Strategic content calendars aligned '
                                                                              'with your goals'},
                                                              'title': { 'ar': 'التخطيط الاستراتيجي',
                                                                         'en': 'Content Planning'}}},
                                          { 'icon': '✍️',
                                            'link': '/blog/social-media-strategy',
                                            'points': [ { 'translations': { 'text': { 'ar': 'كتابة احترافية',
                                                                                      'en': 'Professional '
                                                                                            'copywriting'}}},
                                                        { 'translations': { 'text': { 'ar': 'رسومات وفيديوهات مخصصة',
                                                                                      'en': 'Custom graphics & '
                                                                                            'videos'}}},
                                                        { 'translations': { 'text': { 'ar': 'اختبار المحتوى',
                                                                                      'en': 'A/B testing for '
                                                                                            'content'}}}],
                                            'translations': { 'desc': { 'ar': 'منشورات وقصص وريلز احترافية تجذب '
                                                                              'الجمهور وتفتح آفاق التفاعل',
                                                                        'en': 'Professional posts, stories, and reels'},
                                                              'title': { 'ar': 'إنشاء المحتوى',
                                                                         'en': 'Content Creation'}}},
                                          { 'icon': '📈',
                                            'link': '/blog/social-media-strategy',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تقارير أداء أسبوعية',
                                                                                      'en': 'Weekly performance '
                                                                                            'reports'}}},
                                                        { 'translations': { 'text': { 'ar': 'رؤى الجمهور',
                                                                                      'en': 'Audience insights'}}},
                                                        { 'translations': { 'text': { 'ar': 'تتبع العائد على الاستثمار',
                                                                                      'en': 'ROI tracking'}}}],
                                            'translations': { 'desc': { 'ar': 'تتبع النمو وأداء الحملات لضمان فتح آفاق '
                                                                              'النجاح المستدام',
                                                                        'en': 'Track growth and optimize performance'},
                                                              'title': { 'ar': 'النمو والتحليل',
                                                                         'en': 'Growth & Analytics'}}}],
                               'translations': { 'subtitle': { 'ar': 'حلول شاملة لإدارة التواصل الاجتماعي توسّع آفاق '
                                                                     'حضورك',
                                                               'en': 'Comprehensive social media management solutions'},
                                                 'title': { 'ar': 'خدماتنا تفتح آفاق التواصل',
                                                            'en': 'Our Services Include'}}},
                  'order': 1},
                { 'block_type': 'platform_how_it_works',
                  'content': { 'steps': [ { 'icon': '🔍',
                                            'number': '1',
                                            'translations': { 'desc': { 'ar': 'نحلّل حضورك الحالي ونصمم خطة تفتح آفاق '
                                                                              'النمو',
                                                                        'en': 'We analyze your current presence and '
                                                                              'create a plan'},
                                                              'title': { 'ar': 'التدقيق والاستراتيجية',
                                                                         'en': 'Audit & Strategy'}}},
                                          { 'icon': '✍️',
                                            'number': '2',
                                            'translations': { 'desc': { 'ar': 'فريقنا ينشئ وينشر محتوى جذاباً يفتح '
                                                                              'آفاق التفاعل',
                                                                        'en': 'Our team creates and publishes engaging '
                                                                              'content'},
                                                              'title': { 'ar': 'الإنشاء والنشر',
                                                                         'en': 'Create & Publish'}}},
                                          { 'icon': '📈',
                                            'number': '3',
                                            'translations': { 'desc': { 'ar': 'نقيس النتائج ونحسّن باستمرار لضمان بقاء '
                                                                              'آفاق الأداء مشرقة',
                                                                        'en': 'We measure results and continuously '
                                                                              'optimize'},
                                                              'title': { 'ar': 'التحليل والتحسين',
                                                                         'en': 'Analyze & Optimize'}}}],
                               'translations': { 'subtitle': { 'ar': 'منهجية منظمة لتحقيق النجاح في التواصل الاجتماعي',
                                                               'en': 'A systematic approach to social media success'},
                                                 'title': {'ar': 'كيف نوسّع آفاق حضورك؟', 'en': 'Our Process'}}},
                  'order': 2},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Start Now'},
                                                 'subtitle': { 'ar': 'دعنا ندير وسائل التواصل ونفتح لك آفاقاً واسعة من '
                                                                     'الزوار والعملاء',
                                                               'en': 'Let us manage your social media and drive real '
                                                                     'results'},
                                                 'title': { 'ar': 'جاهز لتغليب آفاق التواصل الاجتماعي؟',
                                                            'en': 'Ready to Dominate Social Media?'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_order': 21,
    'show_in_nav': False,
    'slug': 'services/social-media',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'إدارة احترافية لوسائل التواصل توسّع آفاق حضورك الرقمي',
                              'meta_title': 'إدارة التواصل الاجتماعي — آفاق تكنولوجي',
                              'title': 'إدارة التواصل الاجتماعي'},
                      'en': { 'description': 'Professional social media management',
                              'meta_title': 'Social Media Management — Afaq Tech',
                              'title': 'Social Media Management'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'اختبار A/B', 'en': 'A/B Testing'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'مصممة للتحويل',
                                                                         'en': 'Conversion Focused'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'تسليم سريع', 'en': 'Fast Delivery'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابنِ صفحتي الآن', 'en': 'Build My Page'},
                                                 'heading': { 'ar': 'صفحات هبوط تفتح آفاق التحويل العالية',
                                                              'en': 'Landing Pages That Convert'},
                                                 'subtitle': { 'ar': 'كل زائر فرصة جديدة لنجاحك — نصمم صفحات تفتح آفاق '
                                                                     'التحويل وتحوّل الزوار إلى عملاء دائمين',
                                                               'en': 'Every visitor is a new opportunity — we design '
                                                                     'pages that turn clicks into customers'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🎯',
                                            'link': '/blog/landing-page-optimization',
                                            'points': [ { 'translations': { 'text': { 'ar': 'بحث في شخصية الجمهور',
                                                                                      'en': 'Audience persona '
                                                                                            'research'}}},
                                                        { 'translations': { 'text': { 'ar': 'تحليل صفحات المنافسين',
                                                                                      'en': 'Competitor page '
                                                                                            'analysis'}}},
                                                        { 'translations': { 'text': { 'ar': 'رسم خريطة قمع التحويل',
                                                                                      'en': 'Conversion funnel '
                                                                                            'mapping'}}}],
                                            'translations': { 'desc': { 'ar': 'كل صفحة مصممة لجمهور وهدف محدد لفتح '
                                                                              'آفاق التحويل الأعلى',
                                                                        'en': 'Each page is designed for a specific '
                                                                              'audience and goal'},
                                                              'title': { 'ar': 'تصميم مستهدف',
                                                                         'en': 'Targeted Design'}}},
                                          { 'icon': '🧪',
                                            'link': '/blog/landing-page-optimization',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تنويعات العناوين والأزرار',
                                                                                      'en': 'Headline & CTA '
                                                                                            'variations'}}},
                                                        { 'translations': { 'text': { 'ar': 'اختبار التخطيط',
                                                                                      'en': 'Layout split testing'}}},
                                                        { 'translations': { 'text': { 'ar': 'تحسين مستمر',
                                                                                      'en': 'Continuous '
                                                                                            'optimization'}}}],
                                            'translations': { 'desc': { 'ar': 'نختبر نسخ مختلفة لتعظيم التحويلات وفتح '
                                                                              'آفاق الأداء الأفضل',
                                                                        'en': 'We test different versions to maximize '
                                                                              'conversions'},
                                                              'title': {'ar': 'اختبارات مستمرة', 'en': 'A/B Testing'}}},
                                          { 'icon': '📊',
                                            'link': '/blog/landing-page-optimization',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تتبع خرائط الحرارة',
                                                                                      'en': 'Heatmap tracking'}}},
                                                        { 'translations': { 'text': { 'ar': 'مراقبة معدل التحويل',
                                                                                      'en': 'Conversion rate '
                                                                                            'monitoring'}}},
                                                        { 'translations': { 'text': { 'ar': 'تقارير أداء شهرية',
                                                                                      'en': 'Monthly performance '
                                                                                            'reports'}}}],
                                            'translations': { 'desc': { 'ar': 'قرارات مبنية على بيانات حقيقية لضمان '
                                                                              'فتح آفاق النتائج الأفضل',
                                                                        'en': 'Data-driven decisions for better '
                                                                              'results'},
                                                              'title': { 'ar': 'مبنية على البيانات',
                                                                         'en': 'Analytics Driven'}}}],
                               'translations': { 'subtitle': { 'ar': 'مصممة بعلم التحويل ومنهجية مبنية على البيانات '
                                                                     'لضمان فتح آفاق النجاح',
                                                               'en': 'Designed with conversion psychology and '
                                                                     'data-driven approach'},
                                                 'title': { 'ar': 'لماذا صفحاتنا تفتح آفاق التحويل؟',
                                                            'en': 'Why Our Landing Pages Work'}}},
                  'order': 1},
                { 'block_type': 'testimonials',
                  'content': { 'columns': 2,
                               'items': [ { 'rating': 5,
                                            'translations': { 'name': {'ar': 'محمد خالد', 'en': 'Mohammed Khaled'},
                                                              'role': {'ar': 'مدير تسويق', 'en': 'Marketing Director'},
                                                              'text': { 'ar': 'معدل التحويل زاد بنسبة 350% — فتحوا لنا '
                                                                              'آفاقاً إيرادية لم نكن نتخيلها',
                                                                        'en': 'Conversion rate increased by 350% with '
                                                                              'their landing pages'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'فاطمة حسن', 'en': 'Fatima Hassan'},
                                                              'role': { 'ar': 'صاحبة متجر إلكتروني',
                                                                        'en': 'E-commerce Owner'},
                                                              'text': { 'ar': 'أفضل استثمار في تسويقنا الإلكتروني — '
                                                                              'آفاق النجاح واضحة تماماً',
                                                                        'en': 'Best investment in our online '
                                                                              'marketing'}}}],
                               'translations': { 'subtitle': { 'ar': 'شاهد تأثير صفحاتنا في فتح آفاق التحويل',
                                                               'en': 'See the impact of our landing pages'},
                                                 'title': { 'ar': 'نتائج تتحدث عن فتح آفاق جديدة',
                                                            'en': 'Results That Speak'}}},
                  'order': 2},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'subtitle': { 'ar': 'دعنا نصمم لك صفحة تحوّل الزوار إلى عملاء وتفتح '
                                                                     'آفاق النجاح',
                                                               'en': 'Let us design a page that turns visitors into '
                                                                     'customers'},
                                                 'title': { 'ar': 'تحتاج صفحة هبوط تفتح آفاق التحويل؟',
                                                            'en': 'Need a High-Converting Landing Page?'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_order': 22,
    'show_in_nav': False,
    'slug': 'services/landing-pages',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'صفحات هبوط تفتح آفاق التحويل العالية',
                              'meta_title': 'صفحات الهبوط — آفاق تكنولوجي',
                              'title': 'صفحات الهبوط'},
                      'en': { 'description': 'High-converting landing pages',
                              'meta_title': 'Landing Pages — Afaq Tech',
                              'title': 'Landing Pages'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'منطق ذكي', 'en': 'Smart Logic'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'تكامل سهل', 'en': 'Easy Integration'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'متوافق مع الهاتف',
                                                                         'en': 'Mobile Friendly'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابنِ نموذجي', 'en': 'Build My Form'},
                                                 'heading': { 'ar': 'نماذج إلكترونية ذكية تفتح آفاق جمع البيانات',
                                                              'en': 'Smart Electronic Forms'},
                                                 'subtitle': { 'ar': 'اجمع بياناتك بكفاءة مع نماذج مصممة لفتح آفاق '
                                                                     'التفاعل وزيادة التحويل',
                                                               'en': 'Collect data efficiently with forms designed for '
                                                                     'conversion'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🧠',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'نماذج متعددة المراحل',
                                                                                      'en': 'Multi-step forms'}}},
                                                        { 'translations': { 'text': { 'ar': 'قواعد ظهور شرطية',
                                                                                      'en': 'Conditional visibility '
                                                                                            'rules'}}},
                                                        { 'translations': { 'text': { 'ar': 'دعم رفع الملفات',
                                                                                      'en': 'File upload support'}}}],
                                            'translations': { 'desc': { 'ar': 'حقول شرطية تتكيف مع إدخال المستخدم لفتح '
                                                                              'آفاق جمع البيانات الذكية',
                                                                        'en': 'Conditional fields that adapt to user '
                                                                              'input'},
                                                              'title': {'ar': 'منطق شرطي ذكي', 'en': 'Smart Logic'}}},
                                          { 'icon': '🔗',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تكامل مع زابير وميك.كوم',
                                                                                      'en': 'Zapier & Make.com '
                                                                                            'integration'}}},
                                                        { 'translations': { 'text': { 'ar': 'مزامنة مع جوجل شيت',
                                                                                      'en': 'Google Sheets sync'}}},
                                                        { 'translations': { 'text': { 'ar': 'إشعارات بريد إلكتروني',
                                                                                      'en': 'Email notifications'}}}],
                                            'translations': { 'desc': { 'ar': 'تكامل مع أنظمة CRM والبريد الإلكتروني '
                                                                              'والأدوات الأخرى لتوسيع آفاق البيانات',
                                                                        'en': 'Connect with CRM, email, and other '
                                                                              'tools'},
                                                              'title': { 'ar': 'تكامل مع الأدوات',
                                                                         'en': 'Integrations'}}},
                                          { 'icon': '📊',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'لوحة تتبع التسليمات',
                                                                                      'en': 'Submission tracking '
                                                                                            'dashboard'}}},
                                                        { 'translations': { 'text': { 'ar': 'تحليل معدلات الاستجابة',
                                                                                      'en': 'Response rate '
                                                                                            'analytics'}}},
                                                        { 'translations': { 'text': { 'ar': 'تصدير لـ CSV/إكسل',
                                                                                      'en': 'Export to CSV/Excel'}}}],
                                            'translations': { 'desc': { 'ar': 'تتبع التسليمات وتحليل الاستجابات لفتح '
                                                                              'آفاق فهم جمهورك',
                                                                        'en': 'Track submissions and analyze '
                                                                              'responses'},
                                                              'title': {'ar': 'تحليلات متقدمة', 'en': 'Analytics'}}}],
                               'translations': { 'subtitle': { 'ar': 'كل ما تحتاجه لجمع البيانات بكفاءة وفتح آفاق '
                                                                     'التحليل',
                                                               'en': 'Everything you need for efficient data '
                                                                     'collection'},
                                                 'title': { 'ar': 'مميزات النماذج التي تفتح آفاق جديدة',
                                                            'en': 'Form Features'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'subtitle': { 'ar': 'دعنا نبني لك نماذج تفتح آفاقاً جديدة في جمع '
                                                                     'البيانات وتحليلها',
                                                               'en': 'Let us build forms that open new horizons for '
                                                                     'your data'},
                                                 'title': { 'ar': 'جاهز لجمع بياناتك بذكاء أكبر؟',
                                                            'en': 'Ready to Collect Data Smarter?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 23,
    'show_in_nav': False,
    'slug': 'services/forms',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'نماذج ذكية تفتح آفاق جمع البيانات بكفاءة',
                              'meta_title': 'النماذج الإلكترونية — آفاق تكنولوجي',
                              'title': 'النماذج الإلكترونية'},
                      'en': { 'description': 'Smart data collection forms',
                              'meta_title': 'Electronic Forms — Afaq Tech',
                              'title': 'Electronic Forms'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'تصميم احترافي',
                                                                         'en': 'Professional Design'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'صيغ متعددة', 'en': 'Multi-Format'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'دعم النشر',
                                                                         'en': 'Publishing Support'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'أنشئ كتابي الإلكتروني', 'en': 'Create My E-Book'},
                                                 'heading': { 'ar': 'كتب إلكترونية تفتح آفاقاً جديدة لمحتواك',
                                                              'en': 'Professional E-Books'},
                                                 'subtitle': { 'ar': 'نحوّل خبراتك إلى كتب إلكترونية تفتح لك آفاقاً '
                                                                     'جديدة في عالم المحتوى والريادة',
                                                               'en': 'Transform your expertise into digital books that '
                                                                     'establish your authority'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '✍️',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'كتابة احترافية',
                                                                                      'en': 'Professional '
                                                                                            'ghostwriting'}}},
                                                        { 'translations': { 'text': { 'ar': 'تدقيق ولغوي',
                                                                                      'en': 'Proofreading & editing'}}},
                                                        { 'translations': { 'text': { 'ar': 'محتوى محسّن للبحث',
                                                                                      'en': 'SEO-optimized content'}}}],
                                            'translations': { 'desc': { 'ar': 'خدمات كتابة وتحرير احترافية تضمن جودة '
                                                                              'المحتوى وفتح آفاق التأثير',
                                                                        'en': 'Professional writing and editing '
                                                                              'services'},
                                                              'title': { 'ar': 'الكتابة والتحرير',
                                                                         'en': 'Writing & Editing'}}},
                                          { 'icon': '🎨',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'تصميم غلاف مخصص',
                                                                                      'en': 'Custom cover design'}}},
                                                        { 'translations': { 'text': { 'ar': 'تنسيق داخلي احترافي',
                                                                                      'en': 'Interior layout & '
                                                                                            'formatting'}}},
                                                        { 'translations': { 'text': { 'ar': 'تنسيق متسق مع الهوية',
                                                                                      'en': 'Brand-consistent '
                                                                                            'styling'}}}],
                                            'translations': { 'desc': { 'ar': 'تصاميم غلاف وتنسيق جميل يفتح آفاق '
                                                                              'اجتذاب القرّاء',
                                                                        'en': 'Beautiful layouts and cover designs'},
                                                              'title': { 'ar': 'التصميم والتنسيق',
                                                                         'en': 'Design & Layout'}}},
                                          { 'icon': '📤',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'نشر على أمازون KDP',
                                                                                      'en': 'Amazon KDP publishing'}}},
                                                        { 'translations': { 'text': { 'ar': 'تصدير بعدة صيغ',
                                                                                      'en': 'Multi-format export (PDF, '
                                                                                            'EPUB, MOBI)'}}},
                                                        { 'translations': { 'text': { 'ar': 'استراتيجية تسويق مشمولة',
                                                                                      'en': 'Marketing strategy '
                                                                                            'included'}}}],
                                            'translations': { 'desc': { 'ar': 'نشر على أمازون وأبل بوكس والمزيد — فتح '
                                                                              'آفاق الوصول العالمي',
                                                                        'en': 'Publish on Amazon, Apple Books, and '
                                                                              'more'},
                                                              'title': {'ar': 'النشر', 'en': 'Publishing'}}}],
                               'translations': { 'subtitle': { 'ar': 'خدمات إنتاج كتب إلكترونية شاملة تفتح آفاق '
                                                                     'الريادة',
                                                               'en': 'End-to-end e-book production services'},
                                                 'title': { 'ar': 'خدماتنا التي تفتح آفاق المحتوى',
                                                            'en': 'Our E-Book Services'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Start Now'},
                                                 'subtitle': { 'ar': 'دعنا نحوّل خبراتك إلى كتاب إلكتروني احترافي يفتح '
                                                                     'آفاقاً جديدة',
                                                               'en': 'Let us transform your expertise into a '
                                                                     'professional e-book'},
                                                 'title': { 'ar': 'جاهز لنشر كتابك الإلكتروني وفتح آفاق المحتوى؟',
                                                            'en': 'Ready to Publish Your E-Book?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 24,
    'show_in_nav': False,
    'slug': 'services/ebooks',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'إنتاج كتب رقمية يفتح لك آفاقاً جديدة في عالم المحتوى والريادة',
                              'meta_title': 'الكتب الإلكترونية — آفاق تكنولوجي',
                              'title': 'الكتب الإلكترونية'},
                      'en': { 'description': 'Professional digital book production',
                              'meta_title': 'E-Books — Afaq Tech',
                              'title': 'E-Books'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'إعلانات جوجل', 'en': 'Google Ads'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'إعلانات ميتا', 'en': 'Meta Ads'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'مبنية على العائد',
                                                                         'en': 'ROI Focused'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'أطلق حملتك', 'en': 'Launch Campaign'},
                                                 'heading': { 'ar': 'حملات إعلانية تفتح آفاق النتائج',
                                                              'en': 'Ad Campaigns That Deliver Results'},
                                                 'subtitle': { 'ar': 'حملات إعلانية مستهدفة تفتح لك آفاقاً واسعة من '
                                                                     'الزوار بأقل تكلفة وأعلى عائد',
                                                               'en': 'Targeted advertising campaigns that maximize '
                                                                     'your ROI'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🔍',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إعلانات البحث والتسوق',
                                                                                      'en': 'Search & Shopping ads'}}},
                                                        { 'translations': { 'text': { 'ar': 'إعلانات يوتيوب',
                                                                                      'en': 'YouTube pre-roll ads'}}},
                                                        { 'translations': { 'text': { 'ar': 'حملات شبكة العرض',
                                                                                      'en': 'Display network '
                                                                                            'campaigns'}}}],
                                            'translations': { 'desc': { 'ar': 'حملات البحث والعرض ويوتيوب — فتح آفاق '
                                                                              'البحث عن العملاء',
                                                                        'en': 'Search, display, and YouTube campaigns'},
                                                              'title': {'ar': 'إعلانات جوجل', 'en': 'Google Ads'}}},
                                          { 'icon': '📱',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'إعلانات ميتا (فيسبوك '
                                                                                            'وانستغرام)',
                                                                                      'en': 'Meta Ads (FB & IG)'}}},
                                                        { 'translations': { 'text': { 'ar': 'إعلانات تيك توك وسناب',
                                                                                      'en': 'TikTok & Snapchat ads'}}},
                                                        { 'translations': { 'text': { 'ar': 'حملات إعادة الاستهداف',
                                                                                      'en': 'Retargeting campaigns'}}}],
                                            'translations': { 'desc': { 'ar': 'فيسبوك وانستغرام وتيك توك وسناب شات — '
                                                                              'فتح آفاق الجمهور الشامل',
                                                                        'en': 'Facebook, Instagram, TikTok, and '
                                                                              'Snapchat'},
                                                              'title': {'ar': 'إعلانات التواصل', 'en': 'Social Ads'}}},
                                          { 'icon': '📊',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'لوحة تحكم فورية',
                                                                                      'en': 'Real-time dashboard'}}},
                                                        { 'translations': { 'text': { 'ar': 'تتبع تكلفة الاكتساب',
                                                                                      'en': 'Cost-per-acquisition '
                                                                                            'tracking'}}},
                                                        { 'translations': { 'text': { 'ar': 'تقارير تحسين أسبوعية',
                                                                                      'en': 'Weekly optimization '
                                                                                            'reports'}}}],
                                            'translations': { 'desc': { 'ar': 'تتبع العائد وحسّن الحملات في الوقت '
                                                                              'الحقيقي لضمان فتح آفاق النجاح',
                                                                        'en': 'Track ROI and optimize campaigns in '
                                                                              'real-time'},
                                                              'title': { 'ar': 'التحليل والتحسين',
                                                                         'en': 'Analytics & Optimization'}}}],
                               'translations': { 'subtitle': { 'ar': 'ندير الحملات عبر جميع المنصات الكبرى لتوسيع آفاق '
                                                                     'الوصول',
                                                               'en': 'We manage campaigns across all major platforms'},
                                                 'title': { 'ar': 'منصات الإعلان التي تفتح آفاق واسعة',
                                                            'en': 'Campaign Platforms'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ الآن', 'en': 'Get Started'},
                                                 'subtitle': { 'ar': 'دعنا ندير حملاتك لتحقيق أقصى تأثير وفتح آفاق '
                                                                     'النمو',
                                                               'en': 'Let us manage your campaigns for maximum impact'},
                                                 'title': { 'ar': 'جاهز لتوسيع آفاق إعلاناتك؟',
                                                            'en': 'Ready to Scale Your Advertising?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 25,
    'show_in_nav': False,
    'slug': 'services/ad-campaigns',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'حملات إعلانية تفتح لك آفاقاً واسعة من الزوار والعملاء',
                              'meta_title': 'الحملات الإعلانية — آفاق تكنولوجي',
                              'title': 'الحملات الإعلانية'},
                      'en': { 'description': 'Effective advertising campaigns',
                              'meta_title': 'Ad Campaigns — Afaq Tech',
                              'title': 'Ad Campaigns'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': {'text': {'ar': 'تصميم شعار', 'en': 'Logo Design'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'دليل هوية', 'en': 'Brand Guidelines'}}},
                                           { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'استشارات استراتيجية',
                                                                         'en': 'Strategic Consulting'}}}],
                               'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابنِ هويتي', 'en': 'Build My Brand'},
                                                 'heading': { 'ar': 'هوية بصرية تفتح آفاق التميّز',
                                                              'en': 'Brand Identity That Stands Out'},
                                                 'subtitle': { 'ar': 'نبتكر هوية فريدة تفتح لك آفاق التميّز عن '
                                                                     'المنافسين مع استشارات تضعك على خارطة النجاح',
                                                               'en': 'We craft unique brand identities that set you '
                                                                     'apart from competitors'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '🎨',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'عدة مفاهيم للشعار',
                                                                                      'en': 'Multiple logo concepts'}}},
                                                        { 'translations': { 'text': { 'ar': 'لوحة ألوان وخطوط',
                                                                                      'en': 'Color palette & '
                                                                                            'typography'}}},
                                                        { 'translations': { 'text': { 'ar': 'بطاقات أعمال وأوراق',
                                                                                      'en': 'Business cards & '
                                                                                            'stationery'}}}],
                                            'translations': { 'desc': { 'ar': 'شعارات لا تُنسى وأنظمة بصرية متكاملة '
                                                                              'تفتح آفاق التأثير',
                                                                        'en': 'Memorable logos and complete visual '
                                                                              'systems'},
                                                              'title': { 'ar': 'الشعار والهوية البصرية',
                                                                         'en': 'Logo & Visual Identity'}}},
                                          { 'icon': '📋',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'كتاب هوية 50+ صفحة',
                                                                                      'en': '50+ page brand book'}}},
                                                        { 'translations': { 'text': { 'ar': 'قواعد الاستخدام وأمثلة',
                                                                                      'en': 'Usage rules & examples'}}},
                                                        { 'translations': { 'text': { 'ar': 'قوالب أصول رقمية',
                                                                                      'en': 'Digital asset '
                                                                                            'templates'}}}],
                                            'translations': { 'desc': { 'ar': 'كتب هوية شاملة لضمان التناسق وفتح آفاق '
                                                                              'الاحترافية',
                                                                        'en': 'Comprehensive brand books for '
                                                                              'consistency'},
                                                              'title': { 'ar': 'دليل الهوية',
                                                                         'en': 'Brand Guidelines'}}},
                                          { 'icon': '💡',
                                            'link': '/blog/welcome-afaq-tech',
                                            'points': [ { 'translations': { 'text': { 'ar': 'بحث وتحليل السوق',
                                                                                      'en': 'Market research & '
                                                                                            'analysis'}}},
                                                        { 'translations': { 'text': { 'ar': 'استراتيجية موقع العلامة',
                                                                                      'en': 'Brand positioning '
                                                                                            'strategy'}}},
                                                        { 'translations': { 'text': { 'ar': 'التميّز عن المنافسين',
                                                                                      'en': 'Competitor '
                                                                                            'differentiation'}}}],
                                            'translations': { 'desc': { 'ar': 'إرشاد خبير في تحديد مواقع العلامة '
                                                                              'التجارية لفتح آفاق النجاح',
                                                                        'en': 'Expert guidance on brand positioning'},
                                                              'title': { 'ar': 'الاستشارات الاستراتيجية',
                                                                         'en': 'Strategic Consulting'}}}],
                               'translations': { 'subtitle': { 'ar': 'حلول هوية شاملة للأعمال الكبيرة والصغيرة لفتح '
                                                                     'آفاق التميّز',
                                                               'en': 'Complete branding solutions for businesses of '
                                                                     'all sizes'},
                                                 'title': { 'ar': 'خدماتنا التي تفتح آفاق الهوية',
                                                            'en': 'Our Branding Services'}}},
                  'order': 1},
                { 'block_type': 'testimonials',
                  'content': { 'columns': 2,
                               'items': [ { 'rating': 5,
                                            'translations': { 'name': {'ar': 'عمر صالح', 'en': 'Omar Saleh'},
                                                              'role': {'ar': 'مؤسس مشروع', 'en': 'Startup Founder'},
                                                              'text': { 'ar': 'هويتنا الجديدة ضاعفت التعرف على علامتنا '
                                                                              '3 مرات — فتحوا لنا آفاقاً جديدة',
                                                                        'en': 'Our new brand identity tripled our '
                                                                              'recognition'}}},
                                          { 'rating': 5,
                                            'translations': { 'name': {'ar': 'لينا محمد', 'en': 'Lina Mohammed'},
                                                              'role': {'ar': 'صاحبة مطعم', 'en': 'Restaurant Owner'},
                                                              'text': { 'ar': 'إعادة الهوية غيّرت أعمالنا بالكامل — '
                                                                              'آفاق النجاح لم تكن بهذا الوضوح',
                                                                        'en': 'The rebranding transformed our business '
                                                                              'completely'}}}],
                               'translations': { 'subtitle': { 'ar': 'شاهد كيف ساعدت هوياتنا الأعمال في فتح آفاق النمو',
                                                               'en': 'See how our branding helped businesses grow'},
                                                 'title': { 'ar': 'علامات فتحنا لها آفاقاً جديدة',
                                                            'en': "Brands We've Transformed"}}},
                  'order': 2},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/contact', 'en': '/contact'},
                                                 'cta_text': {'ar': 'ابدأ مشروعك', 'en': 'Start Your Project'},
                                                 'subtitle': { 'ar': 'دعنا نصمم لك هوية تفتح آفاقاً جديدة وتميّزك عن '
                                                                     'المنافسين',
                                                               'en': 'Let us create a brand identity that opens new '
                                                                     'horizons'},
                                                 'title': { 'ar': 'جاهز لتحويل هويتك وفتح آفاق التميّز؟',
                                                            'en': 'Ready to Transform Your Brand?'}}},
                  'order': 3}],
    'is_homepage': False,
    'nav_order': 26,
    'show_in_nav': False,
    'slug': 'services/brand-identity',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'نبتكر هوية تفتح لك آفاق التميّز مع استشارات تضعك على خارطة النجاح',
                              'meta_title': 'الهوية البصرية — آفاق تكنولوجي',
                              'title': 'الهوية البصرية والاستشارات'},
                      'en': { 'description': 'Complete brand identity and consulting',
                              'meta_title': 'Brand Identity — Afaq Tech',
                              'title': 'Brand Identity & Consulting'}}},
  { 'blocks': [ { 'block_type': 'hero',
                  'content': { 'badges': [ { 'icon': '✓',
                                             'translations': { 'text': { 'ar': 'مدعومة بالذكاء الاصطناعي',
                                                                         'en': 'AI-Powered'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': '9 لغات', 'en': '9 Languages'}}},
                                           { 'icon': '✓',
                                             'translations': {'text': {'ar': 'مجاني للبدء', 'en': 'Free to Start'}}}],
                               'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_logged_in_link': {'ar': '/dashboard', 'en': '/dashboard'},
                                                 'cta_logged_in_text': {'ar': 'لوحة التحكم', 'en': 'Dashboard'},
                                                 'cta_text': {'ar': 'ابدأ مجاناً', 'en': 'Start Free'},
                                                 'heading': { 'ar': 'منصة تعليمية بالذكاء الاصطناعي',
                                                              'en': 'AI-Powered Education Platform'},
                                                 'subtitle': { 'ar': 'ولّد خطط دروس في ثوانٍ، استكشف المناهج، وعزّز '
                                                                     'تدريسك بالذكاء الاصطناعي',
                                                               'en': 'Generate lesson plans in seconds, explore '
                                                                     'curricula, and empower your teaching with AI'}}},
                  'order': 0},
                { 'block_type': 'features',
                  'content': { 'columns': 3,
                               'items': [ { 'icon': '📝',
                                            'translations': { 'desc': { 'ar': 'ولّد خطط دروس احترافية في أقل من 30 '
                                                                              'ثانية',
                                                                        'en': 'Generate professional lesson plans in '
                                                                              'under 30 seconds'},
                                                              'title': { 'ar': 'خطط دروس بالذكاء الاصطناعي',
                                                                         'en': 'AI Lesson Plans'}}},
                                          { 'icon': '📚',
                                            'translations': { 'desc': { 'ar': 'الوصول إلى المواد والمناهج والمواد '
                                                                              'التعليمية لجميع الصفوف',
                                                                        'en': 'Access subjects, curricula, and '
                                                                              'educational materials for all grades'},
                                                              'title': {'ar': 'الأكاديمية', 'en': 'Academy'}}},
                                          { 'icon': '🤖',
                                            'translations': { 'desc': { 'ar': 'احصل على إجابات فورية واستراتيجيات '
                                                                              'تدريس من الذكاء الاصطناعي',
                                                                        'en': 'Get instant answers and teaching '
                                                                              'strategies from AI'},
                                                              'title': {'ar': 'مساعد ذكي', 'en': 'AI Assistant'}}}],
                               'translations': { 'subtitle': { 'ar': 'كل ما تحتاجه لتحويل تجربة التدريس',
                                                               'en': 'Everything you need to transform your teaching'},
                                                 'title': {'ar': 'مميزات المنصة', 'en': 'Platform Features'}}},
                  'order': 1},
                { 'block_type': 'cta',
                  'content': { 'translations': { 'cta_link': {'ar': '/register', 'en': '/register'},
                                                 'cta_text': {'ar': 'ابدأ مجاناً', 'en': 'Get Started Free'},
                                                 'subtitle': { 'ar': 'انضم لألاف المعلمين الذين يستخدمون الذكاء '
                                                                     'الاصطناعي',
                                                               'en': 'Join thousands of teachers already using AI'},
                                                 'title': { 'ar': 'جاهز لتحويل تجربة التدريس؟',
                                                            'en': 'Ready to Transform Your Teaching?'}}},
                  'order': 2}],
    'is_homepage': False,
    'nav_order': 25,
    'show_in_nav': False,
    'slug': 'services/education-platform',
    'template': 'landing',
    'translations': { 'ar': { 'description': 'منصة تعليمية بالذكاء الاصطناعي للمعلمين والطلاب',
                              'meta_title': 'المنصة التعليمية — آفاق تكنولوجي',
                              'title': 'المنصة التعليمية'},
                      'en': { 'description': 'AI-powered educational platform for teachers and students',
                              'meta_title': 'Educational Platform — Afaq Tech',
                              'title': 'Educational Platform'}}},
  { 'blocks': [ { 'block_type': 'chat_greeting',
                  'content': { 'items': [ { 'translations': { 'text': { 'ar': 'اشرح لي مفهوم البرمجة',
                                                                        'bn': 'একটি প্রোগ্রামিং ধারণা ব্যাখ্যা করুন',
                                                                        'de': 'Erkläre mir ein Programmierkonzept',
                                                                        'en': 'Explain a programming concept',
                                                                        'es': 'Explícame un concepto de programación',
                                                                        'fr': 'Expliquez-moi un concept de '
                                                                              'programmation',
                                                                        'id': 'Jelaskan konsep pemrograman',
                                                                        'tr': 'Bir programlama konseptini açıkla',
                                                                        'ur': 'پروگرامنگ کا تصور سمجھائیں'}}},
                                          { 'translations': { 'text': { 'ar': 'كيف أبدأ بتعلم الذكاء الاصطناعي؟',
                                                                        'bn': 'কীভাবে AI শেখা শুরু করব?',
                                                                        'de': 'Wie fange ich mit KI an?',
                                                                        'en': 'How do I start learning AI?',
                                                                        'es': '¿Cómo empiezo a aprender IA?',
                                                                        'fr': "Comment commencer à apprendre l'IA?",
                                                                        'id': 'Bagaimana cara mulai belajar AI?',
                                                                        'tr': 'Yapay zekayı öğrenmeye nasıl başlarım?',
                                                                        'ur': 'AI سیکھنا کیسے شروع کروں؟'}}},
                                          { 'translations': { 'text': { 'ar': 'ما هي أفضل ممارسات التعليم عن بعد؟',
                                                                        'bn': 'দূরশিক্ষণের সেরা পদ্ধতিগুলি কী কী?',
                                                                        'de': 'Was sind die besten Methoden für '
                                                                              'Fernunterricht?',
                                                                        'en': 'What are best practices for distance '
                                                                              'learning?',
                                                                        'es': '¿Cuáles son las mejores prácticas para '
                                                                              'la educación a distancia?',
                                                                        'fr': 'Quelles sont les meilleures pratiques '
                                                                              "pour l'enseignement à distance?",
                                                                        'id': 'Apa praktik terbaik untuk pembelajaran '
                                                                              'jarak jauh?',
                                                                        'tr': 'Uzaktan eğitim için en iyi uygulamalar '
                                                                              'nelerdir?',
                                                                        'ur': 'دور دراز تعلیم کے بہترین طریقے کیا '
                                                                              'ہیں؟'}}},
                                          { 'translations': { 'text': { 'ar': 'ساعدني في تحضير درس',
                                                                        'bn': 'একটি পাঠ প্রস্তুত করতে সাহায্য করুন',
                                                                        'de': 'Hilf mir bei der '
                                                                              'Unterrichtsvorbereitung',
                                                                        'en': 'Help me prepare a lesson',
                                                                        'es': 'Ayúdame a preparar una lección',
                                                                        'fr': 'Aidez-moi à préparer un cours',
                                                                        'id': 'Bantu saya menyiapkan pelajaran',
                                                                        'tr': 'Bir ders hazırlamama yardım et',
                                                                        'ur': 'سبق تیار کرنے میں میری مدد کریں'}}}],
                               'translations': { 'heading': { 'ar': 'كيف يمكنني مساعدتك؟',
                                                              'bn': 'আমি কীভাবে আপনাকে সাহায্য করতে পারি?',
                                                              'de': 'Wie kann ich Ihnen helfen?',
                                                              'en': 'How can I help you?',
                                                              'es': '¿Cómo puedo ayudarte?',
                                                              'fr': 'Comment puis-je vous aider?',
                                                              'id': 'Bagaimana saya bisa membantu Anda?',
                                                              'tr': 'Size nasıl yardımcı olabilirim?',
                                                              'ur': 'میں آپ کی کیسے مدد کر سکتا ہوں؟'},
                                                 'subtitle': { 'ar': 'اسألني عن أي شيء — التعليم، التقنية، أو مساعدتك '
                                                                     'في مهامك اليومية',
                                                               'bn': 'আমাকে কিছু জিজ্ঞাসা করুন — শিক্ষা, প্রযুক্তি, বা '
                                                                     'আপনার দৈনন্দিন কাজে সাহায্য',
                                                               'de': 'Frag mich alles — Bildung, Technologie oder '
                                                                     'Hilfe bei deinen täglichen Aufgaben',
                                                               'en': 'Ask me anything — education, technology, or help '
                                                                     'with your daily tasks',
                                                               'es': 'Pregúntame lo que sea — educación, tecnología o '
                                                                     'ayuda con tus tareas diarias',
                                                               'fr': "Demandez-moi n'importe quoi — éducation, "
                                                                     'technologie, ou aide pour vos tâches '
                                                                     'quotidiennes',
                                                               'id': 'Tanyakan apa saja — pendidikan, teknologi, atau '
                                                                     'bantuan untuk tugas sehari-hari',
                                                               'tr': 'Bana her şeyi sorun — eğitim, teknoloji veya '
                                                                     'günlük işlerinizde yardım',
                                                               'ur': 'مجھ سے کچھ بھی پوچھیں — تعلیم، ٹیکنالوجی، یا '
                                                                     'اپنے روزمرہ کے کاموں میں مدد'}}},
                  'is_active': True,
                  'order': 0}],
    'is_homepage': False,
    'layout_config': {'background': 'var(--color-background)', 'max_width': '100%', 'padding': '0'},
    'nav_icon': '🤖',
    'nav_order': 5,
    'show_in_nav': True,
    'slug': 'ai-chat',
    'template': 'default',
    'translations': { 'ar': { 'description': 'مساعد ذكي يعمل بالذكاء الاصطناعي للإجابة على أسئلتك ومساعدتك في مهامك',
                              'meta_title': 'المساعد الذكي — آفاق تكنولوجي',
                              'title': 'المساعد الذكي'},
                      'en': { 'description': 'An intelligent AI assistant to answer your questions and help with your '
                                             'tasks',
                              'meta_title': 'AI Assistant — Afaq Tech',
                              'title': 'AI Assistant'}} },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '📝', 'nav_order': 10, 'show_in_nav': True, 'slug': 'blog', 'template': 'default', 'translations': { 'ar': { 'title': 'المدونة', 'description': 'مقالات ومستجدات آفاق تكنولوجي' }, 'en': { 'title': 'Blog', 'description': 'Afaq Tech Blog & Articles' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '🎓', 'nav_order': 11, 'show_in_nav': True, 'slug': 'courses', 'template': 'default', 'translations': { 'ar': { 'title': 'الدورات التعليمية', 'description': 'دورات تدريبية متقدمة' }, 'en': { 'title': 'Courses', 'description': 'Educational Courses' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '📊', 'nav_order': 12, 'show_in_nav': True, 'slug': 'dashboard', 'template': 'default', 'translations': { 'ar': { 'title': 'لوحة التحكم وساحة العمل', 'description': 'لوحة تحكم المستخدم' }, 'en': { 'title': 'Dashboard', 'description': 'User Workspace Dashboard' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '📚', 'nav_order': 13, 'show_in_nav': True, 'slug': 'ebooks', 'template': 'default', 'translations': { 'ar': { 'title': 'مكتبة الكتب الإلكترونية', 'description': 'كتب ومراجع رقمية' }, 'en': { 'title': 'E-Books Library', 'description': 'Digital E-Books Library' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '🎮', 'nav_order': 14, 'show_in_nav': True, 'slug': 'gamification', 'template': 'default', 'translations': { 'ar': { 'title': 'التلعيب والشارات', 'description': 'شارة النقاط والمستويات التعليمية' }, 'en': { 'title': 'Gamification & Badges', 'description': 'Gamification achievements and badges' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '📝', 'nav_order': 15, 'show_in_nav': True, 'slug': 'lesson-plans', 'template': 'default', 'translations': { 'ar': { 'title': 'خطط الدروس الذكية', 'description': 'إنشاء وتصدير خطط الدروس بالذكاء الاصطناعي' }, 'en': { 'title': 'Smart Lesson Plans', 'description': 'AI-powered lesson plan generation' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '🛒', 'nav_order': 16, 'show_in_nav': True, 'slug': 'marketplace', 'template': 'default', 'translations': { 'ar': { 'title': 'السوق الرقمي', 'description': 'سوق الخدمات الرقمية والحلول' }, 'en': { 'title': 'Digital Marketplace', 'description': 'Services marketplace' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '👤', 'nav_order': 17, 'show_in_nav': True, 'slug': 'profile', 'template': 'default', 'translations': { 'ar': { 'title': 'الملف الشخصي', 'description': 'إدارة الحساب والإعدادات الشخصية' }, 'en': { 'title': 'User Profile', 'description': 'Manage account profile and settings' } } },
  { 'blocks': [], 'is_homepage': False, 'nav_icon': '💳', 'nav_order': 18, 'show_in_nav': True, 'slug': 'subscriptions', 'template': 'default', 'translations': { 'ar': { 'title': 'الاشتراكات والباقات', 'description': 'باقات الاشتراكات وعضوية المنصة' }, 'en': { 'title': 'Subscriptions & Plans', 'description': 'Platform subscription plans' } } }]

# ════════════════════════════════════════════════════════════════
# Seed
# ════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    for page_data in PAGES:
        blocks_data = page_data.pop('blocks', [])
        page, was_created = Page.objects.update_or_create(
            slug=page_data['slug'],
            defaults=page_data,
        )
        action = 'Created' if was_created else 'Updated'
        print(f'  {action}: {page}')

        page.blocks.all().delete()
        for i, b_data in enumerate(blocks_data):
            block = PageBlock.objects.create(page=page, **b_data)
            print(f'    Block: {block.get_block_type_display()} (order={block.order})')

    print(f'\nDone! Pages: {Page.objects.count()}, Blocks: {PageBlock.objects.count()}')
    invalidate_site_cache()
    print('Site cache invalidated and warmed up.')
