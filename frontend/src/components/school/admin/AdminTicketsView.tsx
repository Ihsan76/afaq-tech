"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  tickets: any[];
  attachments: any[];
  refresh: () => void;
}

export default function AdminTicketsView({ tickets, attachments, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const reviewAttachment = async (id: number, status: string) => {
    try {
      await api.post(`/schools/attachments/${id}/review/`, { status });
      setBanner({ type: "success", text: t("bannerAttUpdated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerAttError") });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={surfaceCls} style={surfaceStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("ticketsHeading")}
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("ticketsCount", { count: tickets.length })}
          </span>
        </div>
        <Banner banner={banner} />
        {tickets.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("ticketsEmpty")}
          </p>
        ) : (
          <div className="space-y-3">
            {tickets.map((tick: any) => (
              <div key={tick.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">{tick.subject || tick.title}</h4>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${tick.is_resolved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                    {tick.is_resolved ? t("ticketResolved") : t("ticketOpen")}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{tick.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={surfaceCls} style={surfaceStyle}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("attachmentsHeading")}
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("attachmentsCount", { count: attachments.length })}
          </span>
        </div>
        {attachments.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("attachmentsEmpty")}
          </p>
        ) : (
          <div className="space-y-3">
            {attachments.map((att: any) => (
              <div key={att.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{att.title || att.file_name}</h4>
                  <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                    {att.kind_display || att.kind} | {t("statusLabel")} <span className="font-bold">{att.review_status_display || att.review_status}</span>
                  </p>
                </div>
                {att.review_status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => reviewAttachment(att.id, "approved")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white transition-all hover:opacity-90">
                      {t("approve")}
                    </button>
                    <button onClick={() => reviewAttachment(att.id, "rejected")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white transition-all hover:opacity-90">
                      {t("reject")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
