"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Subscriber {
  id: number;
  email: string;
  name: string;
  locale: string;
  status: "active" | "unsubscribed";
  created_at: string;
}

export default function AdminNewsletterPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => { fetchSubscribers(); }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await api.get("/pages/admin/newsletter/");
      setSubscribers(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const exportCsv = () => {
    const rows = [["Email", "Name", "Locale", "Status", "Date"]];
    filtered.forEach((s) => rows.push([s.email, s.name, s.locale, s.status, s.created_at]));
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = filter ? subscribers.filter((s) => s.status === filter) : subscribers;
  const activeCount = subscribers.filter((s) => s.status === "active").length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.newsletterSubs")} ({activeCount} {t("admin.subscriberCount")})
        </h1>
        <div className="flex gap-2">
          {["", "active", "unsubscribed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f ? "white" : "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f === "" ? t("blog.all") : t(`admin.status${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
          <button
            onClick={exportCsv}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: "var(--color-success)" }}
          >
            ⬇ {t("admin.exportCsv")}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>{t("admin.noSubscribers")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.email")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.status")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.receivedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{sub.email}</div>
                    {sub.name && <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{sub.name}</div>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{sub.locale}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: sub.status === "active" ? "var(--color-success-light)" : "var(--color-surface-alt)",
                      color: sub.status === "active" ? "var(--color-success)" : "var(--color-text-muted)",
                    }}>
                      {t(`admin.status${sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
