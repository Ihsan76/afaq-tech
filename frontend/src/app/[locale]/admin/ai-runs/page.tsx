"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface AIRunItem {
  id: number;
  user_email: string;
  user_name: string;
  feature: string;
  feature_display: string;
  prompt: string;
  response: string;
  model_used: string;
  tokens_used: number;
  cost: number;
  duration_ms: number;
  created_at: string;
}

interface AIRunStats {
  total_runs: number;
  total_tokens: number;
  total_cost: number;
  avg_duration_ms: number;
  by_feature: { feature: string; count: number; tokens: number }[];
}

const FEATURES = ["lesson_plan", "quiz", "exploration", "chat"];

const FEATURE_COLORS: Record<string, string> = {
  lesson_plan: "var(--color-primary-light)",
  quiz: "var(--color-warning-light)",
  exploration: "var(--color-accent-light)",
  chat: "var(--color-success-light)",
};

export default function AdminAIRunsPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [runs, setRuns] = useState<AIRunItem[]>([]);
  const [stats, setStats] = useState<AIRunStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [featureFilter, setFeatureFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (featureFilter) params.set("feature", featureFilter);
      if (search) params.set("search", search);
      const [runsRes, statsRes] = await Promise.all([
        api.get(`/ai/admin/air-runs/?${params.toString()}`),
        api.get(`/ai/admin/air-runs/stats/?${featureFilter ? `feature=${featureFilter}` : ""}`),
      ]);
      setRuns(runsRes.data.results || runsRes.data || []);
      setStats(statsRes.data);
    } catch {} finally { setIsLoading(false); }
  }, [featureFilter, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const featureColor = (f: string) => FEATURE_COLORS[f] || "var(--color-surface-alt)";
  const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  const fmtCost = (c: number) => c.toFixed(6);
  const fmtTokens = (n: number) => n.toLocaleString();

  const statCards = stats ? [
    { icon: "🤖", value: String(stats.total_runs), label: t("admin.statAiRuns"), color: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" },
    { icon: "🔢", value: fmtTokens(stats.total_tokens), label: t("admin.statTokens"), color: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" },
    { icon: "💵", value: fmtCost(stats.total_cost), label: t("admin.statAiCost"), color: "linear-gradient(135deg, var(--color-success), var(--color-accent))" },
    { icon: "⏱️", value: fmtMs(stats.avg_duration_ms), label: t("admin.statAvgDuration"), color: "linear-gradient(135deg, var(--color-warning), var(--color-error))" },
  ] : [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.aiRuns")}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{t("admin.aiRunsDesc")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAll()}
            placeholder={t("admin.searchPrompt")}
            className="px-4 py-2 rounded-xl text-sm border"
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
          <select value={featureFilter} onChange={(e) => setFeatureFilter(e.target.value)} className="px-4 py-2 rounded-xl text-sm border" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            <option value="">{t("admin.allFeatures")}</option>
            {FEATURES.map((f) => <option key={f} value={f}>{t(`admin.feature${f.charAt(0).toUpperCase() + f.slice(1)}`)}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="p-4 rounded-3xl flex items-center gap-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: card.color }}>
              <span className="text-xl">{card.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-tight truncate" style={{ color: "var(--color-text)" }}>{card.value}</p>
              <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* By feature breakdown */}
      {stats && stats.by_feature.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {stats.by_feature.map((f) => (
            <div key={f.feature} className="px-4 py-2 rounded-2xl text-sm font-bold" style={{ background: featureColor(f.feature), color: "var(--color-text-secondary)" }}>
              {t(`admin.feature${f.feature.charAt(0).toUpperCase() + f.feature.slice(1)}`)} · {f.count} · {fmtTokens(f.tokens)} {t("admin.statTokens")}
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>{t("admin.noAiRuns")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.userCol")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featureCol")}</th>
                <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.modelCol")}</th>
                <th className="hidden sm:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.tokensCol")}</th>
                <th className="hidden sm:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.costCol")}</th>
                <th className="hidden lg:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.durationCol")}</th>
                <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.createdCol")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.promptCol")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <Fragment key={run.id}>
                  <tr className="border-b cursor-pointer transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }} onClick={() => setExpanded(expanded === run.id ? null : run.id)}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{run.user_name}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{run.user_email}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: featureColor(run.feature), color: "var(--color-text-secondary)" }}>{run.feature_display}</span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{run.model_used}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text)" }}>{fmtTokens(run.tokens_used)}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{fmtCost(run.cost)}</td>
                    <td className="hidden lg:table-cell px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>{fmtMs(run.duration_ms)}</td>
                    <td className="hidden md:table-cell px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {run.created_at ? new Date(run.created_at).toLocaleString(locale === "ar" ? "ar-JO" : "en-US", { dateStyle: "medium", timeStyle: "short" }) : ""}
                    </td>
                    <td className="px-6 py-4 text-center text-xs" style={{ color: "var(--color-primary)" }}>
                      {expanded === run.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expanded === run.id && (
                    <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.promptLabel")}</p>
                            <pre className="text-xs whitespace-pre-wrap rounded-xl p-3 max-h-48 overflow-y-auto" style={{ background: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>{run.prompt || "—"}</pre>
                          </div>
                          <div>
                            <p className="text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.responseLabel")}</p>
                            <pre className="text-xs whitespace-pre-wrap rounded-xl p-3 max-h-48 overflow-y-auto" style={{ background: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>{run.response || "—"}</pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}