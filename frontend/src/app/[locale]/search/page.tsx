"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import Link from "next/link";

interface SearchResult {
  type: string;
  id: number;
  title: string;
  description: string;
  url: string;
  score: number;
}

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (q: string, type: string = 'all') => {
    if (!q || q.length < 2) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/core/search/', { params: { q, locale, type } });
      setResults(res.data.results || []);
      setTotal(res.data.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get('/core/search/autocomplete/', { params: { q, locale } });
      setSuggestions((res.data.suggestions || []).map((s: any) => s.text));
    } catch {
      setSuggestions([]);
    }
  }, [locale]);

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, [initialQuery, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) fetchSuggestions(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query, activeFilter);
  };

  const filters = [
    { key: 'all', label: t('search.all') },
    { key: 'courses', label: t('search.courses') },
    { key: 'ebooks', label: t('search.ebooks') },
    { key: 'blog', label: t('search.blog') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 pl-12 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setQuery(s); search(s, activeFilter); setSuggestions([]); }}
                  className="block w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="mb-6 flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => { setActiveFilter(f.key); search(query, f.key); }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="py-12 text-center text-gray-500">{t('search.loading')}</div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <p className="mb-4 text-sm text-gray-500">{t('search.resultsCount', { count: total })}</p>
            <div className="space-y-4">
              {results.map((r) => (
                <Link
                  key={`${r.type}-${r.id}`}
                  href={`/${locale}${r.url}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-2xl">
                      {r.type === 'course' ? '📘' : r.type === 'ebook' ? '📕' : '📝'}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900">{r.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{r.description}</p>
                      <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {r.type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="py-12 text-center text-gray-500">{t('search.noResults')}</div>
        )}
      </div>
    </div>
  );
}
