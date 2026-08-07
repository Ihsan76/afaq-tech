"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { useNotificationsStore, type NotificationItem } from "@/store/notifications";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

export default function NotificationBell() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user } = useAuthStore();
  const { unreadCount, pushEnabled, pushAvailable, pushSupported, fetchUnread, markRead, markAllRead, loadPushState, setupPush, disablePush } =
    useNotificationsStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pushToggling, setPushToggling] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const loadItems = useCallback(async () => {
    try {
      const { data } = await api.get(`/notifications/?locale=${locale}`);
      setItems(data.results || []);
    } catch {
      // silent
    }
  }, [locale]);

  useEffect(() => {
    if (!user) return;
    fetchUnread();
    loadItems();
    loadPushState();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnread, loadItems, loadPushState]);

  useEffect(() => {
    if (!open) return;
    loadItems();
  }, [open, loadItems]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (n: NotificationItem) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);
  };

  const togglePush = async () => {
    setPushToggling(true);
    try {
      if (pushEnabled) {
        await disablePush();
      } else {
        await setupPush();
      }
    } finally {
      setPushToggling(false);
    }
  };

  return (
    <div ref={bellRef} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all duration-200"
        style={{
          backgroundColor: open ? "var(--color-primary-light)" : "transparent",
          color: "var(--color-text-secondary)",
        }}
        title={t("notifications.title")}
        aria-label={t("notifications.title")}
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "var(--color-error)", boxShadow: "0 0 0 2px var(--color-surface)" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <FadeIn direction="down">
          <div
            className="absolute top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden end-0 border"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-border)",
              boxShadow: "0 20px 60px -15px rgb(0 0 0 / 0.3)",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                🔔 {t("notifications.title")}
                {unreadCount > 0 && (
                  <span className="ms-1 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                    ({unreadCount})
                  </span>
                )}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium px-2 py-1 rounded-lg transition-colors"
                  style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-10" style={{ color: "var(--color-text-muted)" }}>
                  <p className="text-3xl mb-2">🔕</p>
                  <p className="text-sm">{t("notifications.empty")}</p>
                </div>
              ) : (
                items.slice(0, 10).map((n) => (
                  <Link
                    key={n.id}
                    href={n.link || `/${locale}/notifications`}
                    onClick={() => handleItemClick(n)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors border-b"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: n.is_read ? "transparent" : "var(--color-primary-light)",
                    }}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{n.icon || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(n.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "var(--color-primary)" }} />
                    )}
                  </Link>
                ))
              )}
            </div>

            {pushSupported && (
              <div className="px-4 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={togglePush}
                  disabled={pushToggling || !pushAvailable}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    backgroundColor: pushEnabled ? "var(--color-success-light)" : "var(--color-muted)",
                    color: pushEnabled ? "var(--color-success)" : "var(--color-text-secondary)",
                  }}
                >
                  <span>🔕 {t("notifications.pushEnable")}</span>
                  <span>{pushToggling ? "…" : pushEnabled ? "✓" : "✗"}</span>
                </button>
              </div>
            )}

            <Link
              href={`/${locale}/notifications`}
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-sm font-medium border-t"
              style={{ color: "var(--color-primary)", borderColor: "var(--color-border)", backgroundColor: "var(--color-background-secondary)" }}
            >
              {t("notifications.viewAll")}
            </Link>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
