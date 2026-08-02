"""
Seed blog categories and posts.
Run: python seed_blog.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.blog.models import BlogCategory, BlogPost

# ════════════════════════════════════════════════════════════════
# Categories
# ════════════════════════════════════════════════════════════════

CATEGORIES = [
    {
        "slug": "web-technologies", "icon": "🌐", "order": 0,
        "translations": {
            "en": {"name": "Web Technologies", "description": "Latest in web design and development"},
            "ar": {"name": "تقنيات الويب", "description": "أحدث ما في تصميم وتطوير المواقع"},
        },
    },
    {
        "slug": "digital-marketing", "icon": "📢", "order": 1,
        "translations": {
            "en": {"name": "Digital Marketing", "description": "Social media, SEO, and advertising tips"},
            "ar": {"name": "التسويق الرقمي", "description": "نصائح التواصل الاجتماعي والبحث والإعلانات"},
        },
    },
    {
        "slug": "ai-technology", "icon": "🤖", "order": 2,
        "translations": {
            "en": {"name": "AI & Technology", "description": "AI tools and emerging technologies"},
            "ar": {"name": "الذكاء الاصطناعي والتقنية", "description": "أدوات الذكاء الاصطناعي والتقنيات الحديثة"},
        },
    },
    {
        "slug": "client-success", "icon": "🏆", "order": 3,
        "translations": {
            "en": {"name": "Client Success", "description": "Case studies and success stories"},
            "ar": {"name": "نجاح العملاء", "description": "دراسات حالة وقصص نجاح"},
        },
    },
    {
        "slug": "platform-news", "icon": "📰", "order": 4,
        "translations": {
            "en": {"name": "Platform News", "description": "Updates and announcements"},
            "ar": {"name": "أخبار المنصة", "description": "تحديثات وإعلانات"},
        },
    },
]

# ════════════════════════════════════════════════════════════════
# Posts
# ════════════════════════════════════════════════════════════════

POSTS = [
    # ── Web Technologies ──
    {
        "slug": "web-design-trends-2026",
        "featured_image": "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80",
        "translations": {
            "en": {
                "title": "10 Web Design Trends That Will Dominate 2026",
                "excerpt": "Discover the latest web design trends that are shaping the digital landscape, from AI-powered interfaces to immersive 3D experiences.",
                "content": "<h2>The Future of Web Design</h2><p>The web design landscape is evolving rapidly. Here are the top trends shaping 2026:</p><h3>1. AI-Powered Interfaces</h3><p>Websites are becoming smarter with AI that adapts content, layout, and recommendations based on user behavior.</p><h3>2. Immersive 3D Elements</h3><p>Three-dimensional visuals and interactive elements are no longer reserved for gaming sites — they're becoming mainstream.</p><h3>3. Micro-Interactions</h3><p>Subtle animations that provide feedback and guide users through their journey are essential for modern UX.</p><h3>4. Dark Mode by Default</h3><p>More websites are launching with dark mode as the primary theme, reflecting user preferences.</p><h3>5. Variable Fonts</h3><p>Single font files that contain multiple weights and styles, improving performance and design flexibility.</p><p>At Afaq Tech, we stay ahead of these trends to ensure your website looks cutting-edge. <a href='/en/services/web-design'>Explore our web design services</a>.</p>",
            },
            "ar": {
                "title": "10 اتجاهات في تصميم المواقع ستصبح هي الأشهر في 2026",
                "excerpt": "اكتشف أحدث اتجاهات تصميم المواقع التي تشكّل المشهد الرقمي، من واجهات الذكاء الاصطناعي إلى التجارب ثلاثية الأبعاد.",
                "content": "<h2>مستقبل تصميم المواقع</h2><p>يتغير مشهد تصميم المواقع بسرعة. إليك أبرز الاتجاهات التي تشكّل عام 2026:</p><h3>1. واجهات مدعومة بالذكاء الاصطناعي</h3><p>أصبحت المواقع أكثر ذكاءً مع الذكاء الاصطناعي الذي يكيّف المحتوى والتخطيط والتوصيات بناءً على سلوك المستخدم.</p><h3>2. عناصر ثلاثية الأبعاد</h3><p>لم تعد الرسومات ثلاثية الأبعاد حصرية على مواقع الألعاب — بل أصبحت شائعة.</p><h3>3. التفاعلات الدقيقة</h3><p>الحركات البسيطة التي تقدم ملاحظات وتوجّه المستخدمين عبر رحلتهم ضرورية لتجربة المستخدم الحديثة.</p><h3>4. الوضع الداكن بشكل افتراضي</h3><p>المزيد من المواقع تُطلق مع الوضع الداكن كسمة رئيسية.</p><h3>5. الخطوط المتغيرة</h3><p>ملفات خط واحدة تحتوي على أوزان وأنماط متعددة، مما يحسّن الأداء والمرونة التصميمية.</p><p>في آفاق تكنولوجي، نبقى في صدارة هذه الاتجاهات لضمان أن موقعك يبدو متطوراً. <a href='/ar/services/web-design'>استكشف خدمات تصميم المواقع</a>.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "web-technologies",
        "tags": "web-design,trends,2026,UI,UX",
        "related_service": "/services/web-design",
        "read_time": 5,
        "is_featured": True,
    },
    {
        "slug": "responsive-website-2026",
        "featured_image": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        "translations": {
            "en": {
                "title": "Why Every Business Needs a Responsive Website in 2026",
                "excerpt": "Mobile traffic now accounts for over 60% of all web visits. Is your website keeping up?",
                "content": "<h2>The Mobile-First Reality</h2><p>With over 60% of web traffic coming from mobile devices, having a responsive website isn't optional — it's essential.</p><p>A responsive website adapts seamlessly to any screen size, providing an optimal viewing experience whether your visitor is on a phone, tablet, or desktop.</p><h3>Benefits of Responsive Design</h3><ul><li>Better SEO rankings — Google prioritizes mobile-friendly sites</li><li>Higher conversion rates across all devices</li><li>Reduced bounce rates</li><li>Consistent brand experience</li></ul><p>Our team at Afaq Tech creates responsive websites that look stunning on every device.</p>",
            },
            "ar": {
                "title": "لماذا يحتاج كل عمل لموقع متجاوب في 2026",
                "excerpt": "الزيارات من الهاتف تشكل أكثر من 60% من جميع زيارات الويب. هل موقعك يواكب؟",
                "content": "<h2>واقع الهاتف أولاً</h2><p>مع أكثر من 60% من حركة المرور على الويب القادمة من الأجهزة المحمولة، فإن وجود موقع متجاوب ليس خياراً — بل هو ضرورة.</p><p>الموقع المتجاوب يتكيف بسلاسة مع أي حجم شاشة، مما يوفر تجربة مشاهدة مثالية.</p><h3>فوائد التصميم المتجاوب</h3><ul><li>ترتيب أفضل في محركات البحث</li><li>معدلات تحويل أعلى عبر جميع الأجهزة</li><li>تقليل معدلات الارتداد</li><li>تجربة علامة تجارية متسقة</li></ul><p>فريقنا في آفاق تكنولوجي ينشئ مواقع متجاوبة تبدو رائعة على كل جهاز.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "web-technologies",
        "tags": "responsive,mobile,SEO,web-design",
        "related_service": "/services/web-design",
        "read_time": 4,
        "is_featured": False,
    },
    # ── Digital Marketing ──
    {
        "slug": "social-media-strategy",
        "featured_image": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
        "translations": {
            "en": {
                "title": "How to Build a Social Media Strategy That Actually Works",
                "excerpt": "Stop posting randomly. Learn the framework that top brands use to create engaging content and drive real results.",
                "content": "<h2>The Strategic Framework</h2><p>Most businesses fail at social media because they post without a strategy. Here's how to fix that:</p><h3>1. Define Your Audience</h3><p>Who are you trying to reach? Create detailed personas for your ideal customers.</p><h3>2. Set Clear Goals</h3><p>Brand awareness? Lead generation? Sales? Each goal requires different content.</p><h3>3. Content Pillars</h3><p>Establish 3-5 themes that align with your brand and audience interests.</p><h3>4. Consistency is Key</h3><p>Post regularly. Use a content calendar to maintain a steady flow.</p><h3>5. Measure and Optimize</h3><p>Track your metrics weekly and adjust your strategy based on what works.</p>",
            },
            "ar": {
                "title": "كيف تبني استراتيجية تواصل اجتماعي تعمل فعلاً",
                "excerpt": "توقف عن النشر العشوائي. تعرّف على الإطار الذي تستخدمه العلامات التجارية الرائدة لإنشاء محتوى جذاب ونتائج حقيقية.",
                "content": "<h2>الإطار الاستراتيجي</h2><p>معظم الشركات تفشل في التواصل الاجتماعي لأنها تنشر بدون استراتيجية. إليك كيف تصلح ذلك:</p><h3>1. حدد جمهورك</h3><p>من تحاول الوصول إليه؟ أنشئ شخصيات تفصيلية لعملائك المثاليين.</p><h3>2. حدد أهدافاً واضحة</h3><p>الوعي بالعلامة التجارية؟ توليد العملاء؟ المبيعات؟ كل هدف يتطلب محتوى مختلفاً.</p><h3>3. أعمدة المحتوى</h3><p>حدد 3-5 مواضيع تتوافق مع علامتك التجارية واهتمامات جمهورك.</p><h3>4. الاتساق هو المفتاح</h3><p>انشر بانتظام. استخدم تقويم المحتوى للحفاظ على تدفق ثابت.</p><h3>5. قيّم وحسّن</h3><p>تتبع مقاييسك أسبوعياً وعدّل استراتيجيتك بناءً على ما يعمل.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "digital-marketing",
        "tags": "social-media,strategy,content,marketing",
        "related_service": "/services/social-media",
        "read_time": 6,
        "is_featured": True,
    },
    {
        "slug": "landing-page-optimization",
        "featured_image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        "translations": {
            "en": {
                "title": "Landing Page Optimization: 7 Tips to Double Your Conversions",
                "excerpt": "Small changes can lead to big results. Here are proven techniques to improve your landing page conversion rates.",
                "content": "<h2>Optimize for Conversion</h2><p>Your landing page is often the first impression potential customers have of your business. Make it count.</p><h3>1. Clear Headline</h3><p>Your headline should communicate value in under 5 seconds.</p><h3>2. Strong CTA</h3><p>Use action-oriented language and make your call-to-action visually prominent.</p><h3>3. Social Proof</h3><p>Add testimonials, reviews, and trust badges to build credibility.</p><h3>4. Reduce Form Fields</h3><p>Every additional field reduces conversions. Ask only for essential information.</p><h3>5. Mobile Optimization</h3><p>Ensure your landing page loads fast and looks great on mobile devices.</p>",
            },
            "ar": {
                "title": "تحسين صفحات الهبوط: 7 نصائح لمضاعفة التحويلات",
                "excerpt": "التغييرات الصغيرة قد تؤدي إلى نتائج كبيرة. إليك تقنيات مُجربة لتحسين معدلات التحويل في صفحات الهبوط.",
                "content": "<h2>حسّن للتحويل</h2><p>صفحة الهبوط هي انطباع أول عملاء محتملين عن عملك. اجعلها تُحتسب.</p><h3>1. عنوان واضح</h3><p>يجب أن يتواصل عنوانك القيمة في أقل من 5 ثوانٍ.</p><h3>2. زر قوي</h3><p>استخدم لغة تفاعلية واجعل زر الدعوة للعمل بارزاً بصرياً.</p><h3>3. دليل اجتماعي</h3><p>أضف شهادات ومراجعات وشعارات ثقة لبناء المصداقية.</p><h3>4. قلل حقول النموذج</h3><p>كل حقل إضافي يقلل التحويلات. اطلب المعلومات الأساسية فقط.</p><h3>5. تحسين الهاتف</h3><p>تأكد أن صفحة الهبوط تحمل بسرعة وتبدو رائعة على الهاتف.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "digital-marketing",
        "tags": "landing-pages,conversion,optimization,UX",
        "related_service": "/services/landing-pages",
        "read_time": 5,
        "is_featured": False,
    },
    # ── AI & Technology ──
    {
        "slug": "ai-education-arab-world",
        "featured_image": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
        "translations": {
            "en": {
                "title": "How AI is Revolutionizing Education in the Arab World",
                "excerpt": "From personalized learning paths to automated lesson planning, AI is transforming how teachers teach and students learn.",
                "content": "<h2>AI in Education</h2><p>The integration of AI in education is not just a trend — it's a revolution that's making learning more accessible and effective.</p><h3>Personalized Learning</h3><p>AI analyzes each student's strengths and weaknesses, creating customized learning paths that adapt in real-time.</p><h3>Automated Lesson Planning</p><p>Teachers can now generate complete lesson plans in seconds, saving hours of preparation time.</p><h3>24/7 AI Assistants</h3><p>Students can get instant answers to their questions at any time, breaking the barrier of limited teacher availability.</p><p>At Afaq Academy, we harness these AI capabilities to provide world-class education to every student.</p>",
            },
            "ar": {
                "title": "كيف يُحدث الذكاء الاصطناعي ثورة في التعليم في العالم العربي",
                "excerpt": "من مسارات التعلم المخصصة إلى التخطيط التلقائي للدروس، الذكاء الاصطناعي يُحوّل طريقة تعلم المعلمين والطلاب.",
                "content": "<h2>الذكاء الاصطناعي في التعليم</h2><p>دمج الذكاء الاصطناعي في التعليم ليس مجرد اتجاه — بل هو ثورة تجعل التعلم أكثر سهولة وفعالية.</p><h3>التعلم المخصص</h3><p>يحلل الذكاء الاصطناعي نقاط قوة وWeakness كل طالب، ويُنشئ مسارات تعلم مخصصة تتكيف في الوقت الحقيقي.</p><h3>التخطيط التلقائي للدروس</h3><p>يمكن للمعلمين الآن توليد خطط دروس كاملة في ثوانٍ، مما يوفر ساعات من التحضير.</p><h3>مساعدون ذكيون على مدار الساعة</h3><p>يمكن للطلاب الحصول على إجابات فورية على أسئلتهم في أي وقت.</p><p>في أكاديمية آفاق، نستفيد من هذه القدرات الذكاء الاصطناعي لتوفير تعليم عالمي لكل طالب.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "ai-technology",
        "tags": "AI,education,learning,automation",
        "related_service": "/services/education-platform",
        "read_time": 7,
        "is_featured": True,
    },
    # ── Client Success ──
    {
        "slug": "case-study-conversions-350",
        "featured_image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        "translations": {
            "en": {
                "title": "How We Increased a Client's Conversions by 350% with Landing Pages",
                "excerpt": "A real case study showing how strategic landing page design transformed a client's digital marketing results.",
                "content": "<h2>The Challenge</h2><p>Our client, a mid-size e-commerce company, was struggling with low conversion rates despite significant ad spend.</p><h2>Our Approach</h2><p>We redesigned their landing pages with a focus on:</p><ul><li>Clear value proposition above the fold</li><li>Simplified checkout flow</li><li>A/B testing of headlines and CTAs</li><li>Mobile-first design</li></ul><h2>The Results</h2><p>Within 3 months:</p><ul><li>Conversion rate increased by 350%</li><li>Cost per acquisition dropped by 60%</li><li>Revenue increased by 200%</li></ul><p>This case study demonstrates the power of data-driven landing page optimization.</p>",
            },
            "ar": {
                "title": "كيف زدنا التحويلات لعميلنا بنسبة 350% بصفحات الهبوط",
                "excerpt": "دراسة حالة حقيقية تُظهر كيف حوّل تصميم صفحة الهبوط الاستراتيجي نتائج التسويق الرقمي لعميلنا.",
                "content": "<h2>التحدي</h2><p>عميلنا، شركة تجارة إلكترونية متوسطة الحجم، كانت تعاني من معدلات تحويل منخفضة رغم الإنفاق الإعلاني الكبير.</p><h2>منهجيتنا</h2><p>أعدنا تصميم صفحات الهبوط مع التركيز على:</p><ul><li>قيمة واضحة فوق الطي</li><li>تبسيط عملية الشراء</li><li>اختبار A/B للعناوين والأزرار</li><li>تصميم الهاتف أولاً</li></ul><h2>النتائج</h2><p>خلال 3 أشهر:</p><ul><li>معدل التحويل زاد بنسبة 350%</li><li>تكلفة الاكتساب انخفضت بنسبة 60%</li><li>الإيرادات زادت بنسبة 200%</li></ul>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "client-success",
        "tags": "case-study,conversions,landing-pages,results",
        "related_service": "/services/landing-pages",
        "read_time": 4,
        "is_featured": False,
    },
    # ── Platform News ──
    {
        "slug": "welcome-afaq-tech",
        "featured_image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
        "translations": {
            "en": {
                "title": "Welcome to Afaq Tech Platform — Your Digital Success Starts Here",
                "excerpt": "Introducing Afaq Tech — a comprehensive digital platform offering web design, social media management, education, and more.",
                "content": "<h2>Welcome to Afaq Tech</h2><p>We're excited to launch Afaq Tech, a digital platform designed to open new horizons for your business.</p><h3>What We Offer</h3><ul><li>Professional web design</li><li>Social media management</li><li>Landing pages that convert</li><li>Smart electronic forms</li><li>Professional e-books</li><li>AI-powered education platform</li><li>Advertising campaigns</li><li>Brand identity & consulting</li></ul><h3>Our Mission</h3><p>To provide smart digital solutions and education that help businesses and individuals succeed in the digital world.</p><p>Start your journey today — <a href='/en/register'>create a free account</a>.</p>",
            },
            "ar": {
                "title": "مرحباً بكم في منصة آفاق تكنولوجي — نجاحكم الرقمي يبدأ هنا",
                "excerpt": "تعريف بمنصة آفاق تكنولوجي — منصة رقمية شاملة تقدم تصميم المواقع وإدارة التواصل الاجتماعي والتعليم والمزيد.",
                "content": "<h2>مرحباً بكم في آفاق تكنولوجي</h2><p>يسعدنا إطلاق منصة آفاق تكنولوجي، منصة رقمية مصممة لفتح آفاق جديدة لأعمالك.</p><h3>ما نقدمه</h3><ul><li>تصميم مواقع احترافي</li><li>إدارة التواصل الاجتماعي</li><li>صفحات هبوط عالية التحويل</li><li>نماذج إلكترونية ذكية</li><li>كتب إلكترونية احترافية</li><li>منصة تعليمية بالذكاء الاصطناعي</li><li>حملات إعلانية</li><li>هوية بصرية واستشارات</li></ul><h3>رسالتنا</h3><p>تقديم حلول رقمية ذكية وتعليم يساعد الشركات والأفراد على النجاح في العالم الرقمي.</p><p>ابدأ رحلتك اليوم — <a href='/ar/register'>أنشئ حساباً مجانياً</a>.</p>",
            },
        },
        "author_translations": {
            "en": {"author_name": "Admin"},
            "ar": {"author_name": "المدير"},
        },
        "category": "platform-news",
        "tags": "announcement,launch,platform,introduction",
        "related_service": "",
        "read_time": 3,
        "is_featured": False,
    },
]

# ════════════════════════════════════════════════════════════════
# Seed
# ════════════════════════════════════════════════════════════════

print("Seeding blog categories...")
for cat_data in CATEGORIES:
    cat, was_created = BlogCategory.objects.update_or_create(
        slug=cat_data["slug"],
        defaults=cat_data,
    )
    action = "Created" if was_created else "Updated"
    print(f"  {action}: {cat}")

print("\nSeeding blog posts...")
for post_data in POSTS:
    cat_slug = post_data.pop("category")
    cat = BlogCategory.objects.filter(slug=cat_slug).first()
    post, was_created = BlogPost.objects.update_or_create(
        slug=post_data["slug"],
        defaults={**post_data, "category": cat, "is_published": True, "published_at": "2026-07-27T10:00:00+03:00"},
    )
    action = "Created" if was_created else "Updated"
    print(f"  {action}: {post}")

print(f"\nDone! Categories: {BlogCategory.objects.count()}, Posts: {BlogPost.objects.count()}")
