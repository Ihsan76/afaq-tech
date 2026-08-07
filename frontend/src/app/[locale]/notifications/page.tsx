"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore, type NotificationItem } from "@/store/notifications";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

const fetchAll = async (url: string): Promise<NotificationItem[]> => {
  const first = await api.get(url);
  const data = first.data;
  let results: NotificationItem[] = Array.isArray(data) ? data : data.results || [];
  let next: string | null = data.next || null;
  while (next) {
    const page = await api.get(next);
    results = results.concat(page.data.results || []);
    next = page.data.next || null;
  }
  return results;
};

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const { unreadCount, markRead, markAllRead, fetchUnread } = useNotificationsStore();
  const loadedRef = useRef(false);

  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [loadUser]);

  useEffect(() => {
    if (loadedRef.current && !authLoading && !user) router.push(`/${locale}/login`);
  }, [user, authLoading, router, locale]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ locale });
      if (filter === "unread") params.set("is_read", "false");
      const data = await fetchAll(`/notifications/?${params.toString()}`);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, locale]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [filter, user, load]);

  useEffect(() => {
    if (user) fetchUnread();
  }, [user, fetchUnread]);

  const handleClick = (n: NotificationItem) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-lg">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                🔔 {t("notifications.title")}
              </h1>
              <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("notifications.description")}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white" }}
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
        </FadeIn>

        <FadeIn direction="up">
          <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: filter === f ? "var(--color-primary-light)" : "transparent",
                  color: filter === f ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {t(`notifications.filter.${f}`)}
                {f === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>
        </FadeIn>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t("common.loading")}</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <FadeIn direction="up">
            <div className="text-center py-20 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <p className="text-5xl mb-4">🔕</p>
              <p className="text-lg font-medium">{t("notifications.empty")}</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn direction="up">
            <div className="space-y-2">
              {items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClick(n);
                  }}
                  className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: n.is_read ? "var(--color-surface)" : "var(--color-surface)",
                    border: n.is_read ? "1px solid var(--color-border)" : "1px solid var(--color-primary)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: n.is_read ? "var(--color-muted)" : "var(--color-primary-light)" }}
                  >
                    {n.icon || "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "var(--color-primary)" }} />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(n.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {n.link && (
                    <span className="text-xs shrink-0 self-center" style={{ color: "var(--color-primary)" }}>
                      {t("notifications.open")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
