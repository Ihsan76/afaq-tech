from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector, TrigramSimilarity
from django.db.models import Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView


class GlobalSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        locale = request.query_params.get('locale', 'ar')
        search_type = request.query_params.get('type', 'all')
        page = int(request.query_params.get('page', 1))
        page_size = 20

        if not query or len(query) < 2:
            return Response({'error': 'Query too short'}, status=400)

        results = []
        total = 0

        if search_type in ('all', 'courses'):
            from apps.courses.models import Course
            courses = Course.objects.annotate(
                search=SearchVector('title', 'description', config=locale),
                rank=SearchRank(SearchVector('title', 'description', config=locale), SearchQuery(query, config=locale)),
            ).filter(search=SearchQuery(query, config=locale)).order_by('-rank')[:10]

            for course in courses:
                results.append({
                    'type': 'course',
                    'id': course.id,
                    'title': course.title,
                    'description': getattr(course, 'description', '')[:200],
                    'url': f'/academy/courses/{course.slug or course.id}',
                    'score': float(getattr(course, 'rank', 0)),
                })

        if search_type in ('all', 'ebooks'):
            from apps.ebooks.models import Ebook
            ebooks = Ebook.objects.annotate(
                search=SearchVector('title', 'author', 'description', config=locale),
                rank=SearchRank(SearchVector('title', 'author', 'description', config=locale), SearchQuery(query, config=locale)),
            ).filter(search=SearchQuery(query, config=locale)).order_by('-rank')[:10]

            for ebook in ebooks:
                results.append({
                    'type': 'ebook',
                    'id': ebook.id,
                    'title': ebook.title,
                    'description': getattr(ebook, 'description', '')[:200],
                    'url': f'/academy/ebooks/{ebook.slug or ebook.id}',
                    'score': float(getattr(ebook, 'rank', 0)),
                })

        if search_type in ('all', 'blog'):
            from apps.blog.models import BlogPost
            posts = BlogPost.objects.annotate(
                search=SearchVector('title', 'content', config=locale),
                rank=SearchRank(SearchVector('title', 'content', config=locale), SearchQuery(query, config=locale)),
            ).filter(search=SearchQuery(query, config=locale)).order_by('-rank')[:10]

            for post in posts:
                results.append({
                    'type': 'blog',
                    'id': post.id,
                    'title': post.title,
                    'description': getattr(post, 'excerpt', '')[:200],
                    'url': f'/blog/{post.slug or post.id}',
                    'score': float(getattr(post, 'rank', 0)),
                })

        results.sort(key=lambda x: x.get('score', 0), reverse=True)
        total = len(results)

        start = (page - 1) * page_size
        end = start + page_size

        return Response({
            'query': query,
            'total': total,
            'page': page,
            'results': results[start:end],
            'facets': self._get_facets(results),
        })

    def _get_facets(self, results):
        facets = {}
        for r in results:
            t = r['type']
            facets[t] = facets.get(t, 0) + 1
        return facets


class AutocompleteView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        locale = request.query_params.get('locale', 'ar')

        if not query or len(query) < 2:
            return Response({'suggestions': []})

        suggestions = []

        from apps.courses.models import Course
        courses = Course.objects.annotate(
            similarity=TrigramSimilarity('title', query)
        ).filter(similarity__gt=0.1).order_by('-similarity')[:5]

        for course in courses:
            suggestions.append({'text': course.title, 'type': 'course'})

        from apps.ebooks.models import Ebook
        ebooks = Ebook.objects.annotate(
            similarity=TrigramSimilarity('title', query)
        ).filter(similarity__gt=0.1).order_by('-similarity')[:5]

        for ebook in ebooks:
            suggestions.append({'text': ebook.title, 'type': 'ebook'})

        return Response({'suggestions': suggestions})
